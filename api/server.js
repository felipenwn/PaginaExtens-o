import express from "express";
import { db } from './db.js'; // Preservado
import cors from "cors";
import multer from 'multer';
import fs from 'fs'; // Preservado (usaremos para deletar arquivos)
import https from 'https'; // Preservado
import axios from 'axios';
import cookieParser from "cookie-parser";
import qs from 'qs';
import path from 'path';
// const __dirname = path.resolve(); // Descomente se precisar do __dirname com ESM

const app = express();

const PORT = 5500;
const allowedOrigins = [
  'https://127.0.0.1:5500',
  'http://127.0.0.1:5500',
  '127.0.0.1:5500',
  'http://127.0.0.1:3001',
  'https://127.0.0.1:3001',
  'http://127.0.0.1:3000',
  'https://127.0.0.1:3000',
];
const allowedUserRoles = "docente estagiario" // Preservado

const options = { // Preservado
  key: fs.readFileSync('./cert/key.pem'),
  cert: fs.readFileSync('./cert/cert.pem')
};

// --- Middlewares Preservados ---
app.use(express.json());
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true
}));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// --- Configuração do Multer (Preservada) ---
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Garante que o diretório exista
    const uploadDir = 'uploads/';
    fs.mkdir(uploadDir, { recursive: true }, (err) => {
        if (err) return cb(err);
        cb(null, uploadDir);
    });
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'upload-' + uniqueSuffix + ext);
  }
});

const upload = multer({ storage: storage });

// Pasta de uploads pública (Preservada)
app.use('/uploads', express.static('uploads'));


// =================================================================
// --- NOVO: Middleware de Autenticação SUAP (Reutilizável) ---
// =================================================================
const checkSuapAuth = async (req, res, next) => {
  const token = req.cookies.SUAP_token;
  if (!token) {
    return res.status(401).json({ error: 'Não autenticado' });
  }

  try {
    const suapRes = await axios.get('https://suap.ifsul.edu.br/api/rh/meus-dados/', {
      headers: { 
        Authorization: 'Bearer ' + token 
      }
    });

    if (!allowedUserRoles.includes(suapRes.data.vinculo.categoria)) {
      console.log("Não autorizado (role).");
      return res.status(403).send("Não autorizado."); // 403: Proibido
    }
    
    // Anexa dados do usuário na requisição para uso posterior (ex: /meus-dados)
    req.userData = suapRes.data; 
    next(); // Permissão concedida

  } catch (error) {
    console.error("Erro na autenticação SUAP:", error.message);
    if (error.response && error.response.status === 401) {
         return res.status(401).send('Token SUAP inválido ou expirado.');
    }
    res.status(500).send('Erro interno ao verificar autenticação.');
  }
};


// =================================================================
// --- ROTAS DE PROJETOS ---
// =================================================================

// --- GET /projetos (Preservada) ---
// Lista todos os projetos com membros agrupados por JS
app.get('/projetos', (req, res) => {
  const query = `
      SELECT 
        e.id as projeto_id,
        e.titulo, 
        e.data, 
        e.cursos,
        e.descricao,
        e.capa,
        s.nome AS membro_nome, 
        s.titulos AS membro_titulos,
        s.image AS membro_image 
      FROM projetos e
      LEFT JOIN membros s ON e.id = s.projeto_id
      ORDER BY e.id DESC
    `;

  db.all(query, [], (err, rows) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: 'Database error' });
    }

    // Lógica de agrupamento JS (Preservada)
    const eventsMap = {};
    rows.forEach(row => {
      if (!eventsMap[row.projeto_id]) {
        eventsMap[row.projeto_id] = {
          id: row.projeto_id,
          titulo: row.titulo,
          capa: row.capa,
          data: row.data,
          cursos: row.cursos,
          descricao: row.descricao,
          membros: []
        };
      }

      if (row.membro_nome) {
        eventsMap[row.projeto_id].membros.push({
          nome: row.membro_nome,
          image: row.membro_image,
          titulos: row.membro_titulos
        });
      }
    });

    const events = Object.values(eventsMap).sort((a, b) => b.id - a.id);
    res.json(events);
  });
});

// --- NOVO: GET /projetos/:id ---
// Busca um projeto específico pelo ID
app.get('/projetos/:id', (req, res) => {
    const { id } = req.params;
  
    const queryProjeto = `SELECT * FROM projetos WHERE id = ?`;
    
    db.get(queryProjeto, [id], (err, projeto) => {
      if (err) {
        console.error(err.message);
        return res.status(500).json({ error: 'Database error' });
      }
      if (!projeto) {
        return res.status(404).json({ error: 'Projeto não encontrado' });
      }
  
      // Busca os membros associados
      const queryMembros = `SELECT nome, titulos, image FROM membros WHERE projeto_id = ?`;
      db.all(queryMembros, [id], (err, membros) => {
        if (err) {
          console.error(err.message);
          return res.status(500).json({ error: 'Database error fetching members' });
        }
        projeto.membros = membros || [];
        res.json(projeto);
      });
    });
  });

// --- POST /projetos (Refatorada) ---
// Cria um novo projeto, agora usando o middleware de autenticação
app.post('/projetos', checkSuapAuth, upload.fields([
  { name: 'capa', maxCount: 1 },
  { name: 'membroImages' } 
]), (req, res) => {
  // A autenticação já foi verificada pelo middleware 'checkSuapAuth'
  
  const { titulo, data, cursos, descricao, membros } = req.body;
  const capaPath = req.files['capa']?.[0]?.path.slice(8); // Remove 'uploads/'

  const membrosArray = JSON.parse(membros); // [{ nome, titulos }]
  const imagensMembros = req.files['membroImages'] || [];

  console.log("Criando projeto:", titulo);

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    db.run(
      `INSERT INTO projetos (titulo, data, cursos, descricao, capa) VALUES (?, ?, ?, ?, ?)`,
      [titulo, data, cursos, descricao, capaPath],
      function (err) { // 'function' para usar 'this.lastID'
        if (err) {
          db.run('ROLLBACK');
          console.error(err);
          return res.status(500).send('Erro ao inserir projeto');
        }

        const projetoId = this.lastID;

        // Se não houver membros, finaliza aqui
        if (membrosArray.length === 0) {
            db.run('COMMIT');
            return res.status(201).send('Projeto inserido com sucesso (sem membros)');
        }

        const stmt = db.prepare(
          `INSERT INTO membros (projeto_id, nome, titulos, image) VALUES (?, ?, ?, ?)`
        );

        membrosArray.forEach((membro, index) => {
          const imgPath = imagensMembros[index]?.path.slice(8) || null; // Remove 'uploads/'

          stmt.run([projetoId, membro.nome, membro.titulos, imgPath], (err) => {
            if (err) {
              console.error("Erro ao inserir membro:", err.message);
              // Este erro será pego pelo finalize/commit
            }
          });
        });

        stmt.finalize((err) => {
          if (err) {
            db.run('ROLLBACK');
            console.error(err);
            return res.status(500).send('Erro ao finalizar membros');
          }

          db.run('COMMIT');
          res.status(201).send('Projeto e membros inseridos com sucesso');
        });
      }
    );
  });
});


// --- NOVO: PUT /projetos/:id ---
// Atualiza um projeto existente
app.put('/projetos/:id', checkSuapAuth, upload.fields([
    { name: 'capa', maxCount: 1 },
    { name: 'membroImages', maxCount: 10 } // Limite do Code 2
  ]), (req, res) => {
    
    const { id } = req.params;
    const { titulo, data, descricao, cursos, membros } = req.body; // membros é JSON string
    const capaFile = req.files['capa'] ? req.files['capa'][0] : null;
    const membroImages = req.files['membroImages'] || [];

    // 1. Busca projeto existente para pegar path da capa antiga
    db.get('SELECT capa FROM projetos WHERE id = ?', [id], (err, projetoExistente) => {
      if (err) {
        console.error(err);
        return res.status(500).send('Erro ao buscar projeto');
      }
      if (!projetoExistente) {
        return res.status(404).json({ error: 'Projeto não encontrado' });
      }

      // --- Iniciar Transação ---
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        // 2. Atualizar Tabela 'projetos'
        let updateQuery = 'UPDATE projetos SET titulo = ?, data = ?, descricao = ?, cursos = ?';
        // 'slice(8)' remove 'uploads/' do path, salvando só o filename
        const capaPath = capaFile ? capaFile.path.slice(8) : null; 
        let params = [titulo, data, descricao, cursos];

        if (capaPath) {
          updateQuery += ', capa = ?';
          params.push(capaPath);
        }
        updateQuery += ' WHERE id = ?';
        params.push(id);

        db.run(updateQuery, params, (err) => {
          if (err) {
            db.run('ROLLBACK');
            console.error(err);
            return res.status(500).send('Erro ao atualizar projeto');
          }

          // 3. Deletar capa antiga (se nova foi enviada)
          if (capaPath && projetoExistente.capa) {
            fs.unlink(path.join('uploads', projetoExistente.capa), (err) => {
              if (err) console.error('Erro ao deletar capa antiga:', err); 
            });
          }
          
          // 4. Lidar com Membros
          // 4a. Buscar membros antigos (para deletar imagens)
          db.all('SELECT image FROM membros WHERE projeto_id = ?', [id], (err, membrosAntigos) => {
            if (err) {
              db.run('ROLLBACK');
              console.error(err);
              return res.status(500).send('Erro ao buscar membros antigos');
            }

            // 4b. Deletar membros antigos do DB
            db.run('DELETE FROM membros WHERE projeto_id = ?', [id], (err) => {
              if (err) {
                db.run('ROLLBACK');
                console.error(err);
                return res.status(500).send('Erro ao deletar membros antigos');
              }

              // 4c. Deletar imagens antigas dos membros (se houver)
              membrosAntigos.forEach(membro => {
                if (membro.image) {
                  fs.unlink(path.join('uploads', membro.image), (err) => {
                    if (err) console.error('Erro ao deletar imagem de membro:', err);
                  });
                }
              });

              // 4d. Inserir novos membros
              try {
                const membrosArray = JSON.parse(membros || '[]');
                if (membrosArray.length === 0) {
                    // Se não há novos membros, apenas commita
                     db.run('COMMIT');
                     return res.send('Projeto atualizado com sucesso (sem novos membros).');
                }

                const stmt = db.prepare(`INSERT INTO membros (projeto_id, nome, titulos, image) VALUES (?, ?, ?, ?)`);
                let membrosProcessados = 0;
                let ocorreuErroMembro = false;

                membrosArray.forEach((membro, index) => {
                  // A lógica assume que o frontend envia imagens novas na mesma ordem dos membros
                  const imgPath = membroImages[index]?.path.slice(8) || membro.image || null; 

                  stmt.run([id, membro.nome, membro.titulos, imgPath], (err) => {
                    if (err && !ocorreuErroMembro) {
                        ocorreuErroMembro = true;
                        console.error('Erro ao inserir membro:', err);
                    }
                    
                    membrosProcessados++;
                    
                    // Se foi o último membro a ser processado
                    if (membrosProcessados === membrosArray.length) {
                        stmt.finalize((err) => {
                            if (err || ocorreuErroMembro) {
                                db.run('ROLLBACK');
                                console.error("Erro ao finalizar membros, revertendo.", err);
                                return res.status(500).send('Erro ao finalizar inserção de membros');
                            }
                            
                            // SÓ AQUI podemos commitar
                            db.run('COMMIT', (err) => {
                                 if (err) {
                                    console.error('Erro no COMMIT:', err);
                                    return res.status(500).send('Erro ao commitar transação');
                                 }
                                 res.send('Projeto atualizado com sucesso');
                            });
                        });
                    }
                  });
                });
              } catch (parseError) {
                  db.run('ROLLBACK');
                  console.error('Erro ao parsear JSON de membros:', parseError);
                  return res.status(400).send('JSON de membros mal formatado');
              }
            });
          });
        });
      });
    });
});


// --- MELHORADO: DELETE /projetos/:id ---
// Remove um projeto, seus membros E seus arquivos
app.delete('/projetos/:id', checkSuapAuth, (req, res) => {
  const { id } = req.params;

  // 1. Iniciar Transação
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    // 2. Buscar dados dos arquivos para deletar
    db.get('SELECT capa FROM projetos WHERE id = ?', [id], (err, projeto) => {
      if (err) {
        db.run('ROLLBACK');
        console.error(err);
        return res.status(500).send('Erro ao buscar projeto');
      }
      if (!projeto) {
        db.run('ROLLBACK');
        return res.status(404).json({ error: 'Projeto não encontrado' });
      }

      db.all('SELECT image FROM membros WHERE projeto_id = ?', [id], (err, membros) => {
        if (err) {
          db.run('ROLLBACK');
          console.error(err);
          return res.status(500).send('Erro ao buscar membros');
        }

        // 3. Deletar arquivos (fs)
        if (projeto.capa) {
          fs.unlink(path.join('uploads', projeto.capa), (err) => {
            if (err) console.error('Erro ao deletar capa:', err);
          });
        }
        membros.forEach(membro => {
          if (membro.image) {
            fs.unlink(path.join('uploads', membro.image), (err) => {
              if (err) console.error('Erro ao deletar imagem de membro:', err);
            });
          }
        });

        // 4. Deletar do DB (em ordem: filhos, depois pai)
        db.run('DELETE FROM membros WHERE projeto_id = ?', [id], (err) => {
          if (err) {
            db.run('ROLLBACK');
            console.error(err);
            return res.status(500).send('Erro ao deletar membros');
          }

          db.run('DELETE FROM projetos WHERE id = ?', [id], (err) => {
            if (err) {
              db.run('ROLLBACK');
              console.error(err);
              return res.status(500).send('Erro ao deletar projeto');
            }

            // 5. Commit
            db.run('COMMIT', (err) => {
              if (err) {
                console.error('Erro no COMMIT:', err);
                return res.status(500).send('Erro ao commitar deleção');
              }
              res.send('Projeto removido com sucesso');
            });
          });
        });
      });
    });
  });
});


// =================================================================
// --- OUTRAS ROTAS (Preservadas e Refatoradas) ---
// =================================================================

// --- GET /membros (Preservada) ---
app.get('/membros', (req, res) => {
  db.all('SELECT * FROM membros', [], (err, rows) => {
    if (err) {
      res.status(500).send(err.message);
      return;
    }
    res.json(rows);
  });
  console.log("GET /membros");
});

// --- GET /meus-dados (Refatorada) ---
// Agora usa o middleware e apenas retorna os dados já buscados
app.get('/meus-dados', checkSuapAuth, (req, res) => {
  // Os dados do usuário foram anexados em 'req.userData' pelo middleware
  res.json(req.userData);
});

// --- POST /save-token (Preservada) ---
app.post('/save-token', (req, res) => {
  const { token } = req.body;
  console.log("Salvando token...");

  res.cookie('SUAP_token', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'None',
    maxAge: 3600000 // 1 hora
  });

  res.send({ success: true });
});

// --- POST /remove-token (Preservada) ---
app.post('/remove-token', async (req, res) => {
  const token = req.cookies.SUAP_token;

  if (token) {
    try {
      // Tenta revogar o token no SUAP
      await axios.post(
        'https://suap.ifsul.edu.br/o/revoke_token/',
        qs.stringify({
          token: token.replace('Bearer ', ''),
          client_id: '4709NRzgE2vNxYBgKgZ5xoQGFhMkiVFLhCyWUTuv' // Seu client_id
        }),
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        }
      );
      console.log("Token revogado no SUAP.");
    } catch (err) {
      console.error('Erro ao revogar token (pode já ter expirado):', err.message);
    }
  }

  // Limpa o cookie independentemente do sucesso da revogação
  res.clearCookie('SUAP_token', {
    httpOnly: true,
    secure: true,
    sameSite: 'None'
  });

  res.status(204).end();
});

// --- Helper Function (Preservada) ---
function convertToISO(ddmmyyyy) {
  const [dd, mm, yyyy] = ddmmyyyy.split('/');
  return `${yyyy}-${mm}-${dd}`; // Converte para ISO: yyyy-MM-dd
}

// --- Inicialização do Servidor HTTPS (Preservada) ---
https.createServer(options, app).listen(PORT, () => {
  console.log(`HTTPS server running at https://localhost:${PORT}`);
});