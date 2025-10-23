import express from "express";
import { db } from './db.js';
import cors from "cors";
import multer from 'multer';
import fs from 'fs';
import https from 'https';
import axios from 'axios';
import cookieParser from "cookie-parser";
import qs from 'qs';
import path from 'path';

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
const allowedUserRoles = ["docente", "estagiario", "Aluno"];

const options = {
  key: fs.readFileSync('./cert/key.pem'),
  cert: fs.readFileSync('./cert/cert.pem')
};

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

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
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

app.use('/uploads', express.static('uploads'));

const checkSuapAuth = async (req, res, next) => {
  const token = req.cookies.SUAP_token;
  console.log('🔍 Token recebido:', token ? token.substring(0, 20) + '...' : 'NENHUM');
  if (!token) {
    return res.status(401).json({ error: 'Não autenticado' });
  }

  try {
    const suapRes = await axios.get('https://suap.ifsul.edu.br/api/rh/meus-dados/', {
      headers: {
        Authorization: 'Bearer ' + token
      }
    });

    console.log('✅ Resposta do SUAP:', suapRes.data);
    
    // Para alunos, vinculo.categoria não existe
    // Então vamos verificar se é aluno pela presença de vinculo.matricula
    const isAluno = suapRes.data.vinculo && suapRes.data.vinculo.matricula;
    const categoria = suapRes.data.vinculo?.categoria;
    
    console.log('🔑 Categoria:', categoria);
    console.log('🎓 É aluno?', isAluno);

    // Se não é aluno e não tem categoria permitida, bloqueia
    if (!isAluno && !allowedUserRoles.includes(categoria)) {
      console.log("❌ Não autorizado (role).");
      return res.status(403).send("Não autorizado.");
    }
    // Adiciona a categoria manualmente para alunos
    if (isAluno && !categoria) {
      suapRes.data.vinculo.categoria = 'Aluno';
    }

    // if (!allowedUserRoles.includes(suapRes.data.vinculo.categoria)) {
    //   console.log("Não autorizado (role).");
    //   return res.status(403).send("Não autorizado.");
    // }

    req.userData = suapRes.data;
    next();

} catch (error) {
    console.error("❌ Erro na autenticação SUAP:", error.message);
    if (error.response && error.response.status === 401) {
      return res.status(401).send('Token SUAP inválido ou expirado.');
    }
    res.status(500).send('Erro interno ao verificar autenticação.');
  }
};

// =================================================================
// --- ROTAS DE PROJETOS ---
// =================================================================

// --- GET /projetos (MODIFICADO) ---
// Adicionada a coluna 'galeria'
app.get('/projetos', (req, res) => {
  const query = `
      SELECT 
        e.id as projeto_id,
        e.titulo, e.data, e.cursos, e.descricao, e.capa,
        e.galeria, -- NOVO
        s.nome AS membro_nome, s.titulos AS membro_titulos, s.image AS membro_image 
      FROM projetos e
      LEFT JOIN membros s ON e.id = s.projeto_id
      ORDER BY e.id DESC
    `;

  db.all(query, [], (err, rows) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: 'Database error' });
    }

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
          galeria: JSON.parse(row.galeria || '[]'), // MODIFICADO
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

// --- GET /projetos/:id (MODIFICADO) ---
// Adicionado o campo 'galeria'
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
      
      // MODIFICADO: Transforma a string JSON da galeria em um array
      projeto.galeria = JSON.parse(projeto.galeria || '[]');

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

// --- POST /projetos (MODIFICADO) ---
// Adiciona suporte ao upload da galeria
app.post('/projetos', checkSuapAuth, upload.fields([
  { name: 'capa', maxCount: 1 },
  { name: 'membroImages' },
  { name: 'galeria', maxCount: 10 } // NOVO: Campo para galeria
]), (req, res) => {
  const { titulo, data, cursos, descricao, membros } = req.body;
  
  // MODIFICADO: Usando .filename para mais robustez
  const capaFilename = req.files['capa']?.[0]?.filename; 
  const membrosArray = JSON.parse(membros);
  const imagensMembros = req.files['membroImages'] || [];
  
  // NOVO: Pega os nomes dos arquivos da galeria
  const galeriaFiles = req.files['galeria'] || [];
  const galeriaFilenames = galeriaFiles.map(file => file.filename);
  const galeriaJSON = JSON.stringify(galeriaFilenames); // Salva como string JSON

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    db.run(
      // MODIFICADO: Insere a galeria
      `INSERT INTO projetos (titulo, data, cursos, descricao, capa, galeria) VALUES (?, ?, ?, ?, ?, ?)`,
      [titulo, data, cursos, descricao, capaFilename, galeriaJSON],
      function (err) {
        if (err) {
          db.run('ROLLBACK');
          return res.status(500).send('Erro ao inserir projeto');
        }

        const projetoId = this.lastID;
        if (membrosArray.length === 0) {
          db.run('COMMIT');
          return res.status(201).send('Projeto inserido com sucesso');
        }

        const stmt = db.prepare(`INSERT INTO membros (projeto_id, nome, titulos, image) VALUES (?, ?, ?, ?)`);
        membrosArray.forEach((membro, index) => {
          const imgFilename = imagensMembros[index]?.filename || null;
          stmt.run([projetoId, membro.nome, membro.titulos, imgFilename]);
        });

        stmt.finalize((err) => {
          if (err) {
            db.run('ROLLBACK');
            return res.status(500).send('Erro ao finalizar membros');
          }
          db.run('COMMIT');
          res.status(201).send('Projeto e membros inseridos com sucesso');
        });
      }
    );
  });
});


// --- PUT /projetos/:id (TOTALMENTE REFATORADO) ---
// Lógica completa para atualização de galeria e membros
app.put('/projetos/:id', checkSuapAuth, upload.fields([
    { name: 'capa', maxCount: 1 },
    { name: 'membroImages' }, // Novas imagens para novos membros
    { name: 'galeria', maxCount: 10 } // Novas imagens para galeria
  ]), (req, res) => {
    const { id } = req.params;
    const { titulo, data, descricao, cursos, membros, fotosGaleriaRemover } = req.body;
    
    // Parse dos dados recebidos
    let membrosArray;
    let galeriaParaRemover;
    try {
        membrosArray = JSON.parse(membros || '[]');
        galeriaParaRemover = JSON.parse(fotosGaleriaRemover || '[]');
    } catch (e) {
        return res.status(400).json({ error: "JSON inválido para membros ou galeria a remover." });
    }

    const capaFile = req.files['capa']?.[0];
    const novasImagensMembros = req.files['membroImages'] || [];
    const novasImagensGaleria = req.files['galeria'] || [];

    db.get('SELECT capa, galeria FROM projetos WHERE id = ?', [id], (err, projetoExistente) => {
        if (err) return res.status(500).send('Erro ao buscar projeto');
        if (!projetoExistente) return res.status(404).json({ error: 'Projeto não encontrado' });

        db.serialize(() => {
            db.run('BEGIN TRANSACTION');

            // 1. Gerenciar Galeria
            const galeriaAntiga = JSON.parse(projetoExistente.galeria || '[]');
            const galeriaMantida = galeriaAntiga.filter(img => !galeriaParaRemover.includes(img));
            const galeriaNovaCompleta = [...galeriaMantida, ...novasImagensGaleria.map(f => f.filename)];

            // 2. Gerenciar Membros e suas imagens
            db.all('SELECT image FROM membros WHERE projeto_id = ?', [id], (err, membrosAntigos) => {
                if (err) { db.run('ROLLBACK'); return res.status(500).send('Erro ao buscar membros antigos'); }

                const imagensMembrosMantidos = new Set(membrosArray.filter(m => m.image).map(m => m.image));
                const imagensMembrosParaDeletar = membrosAntigos
                    .filter(m => m.image && !imagensMembrosMantidos.has(m.image))
                    .map(m => m.image);

                // 3. Deletar e recriar membros (mais simples e seguro que update)
                db.run('DELETE FROM membros WHERE projeto_id = ?', [id], (err) => {
                    if (err) { db.run('ROLLBACK'); return res.status(500).send('Erro ao limpar membros antigos'); }
                    
                    const stmt = db.prepare(`INSERT INTO membros (projeto_id, nome, titulos, image) VALUES (?, ?, ?, ?)`);
                    let newImageIndex = 0;
                    membrosArray.forEach(membro => {
                        // Se o membro já tinha imagem, usa ela. Senão, pega uma da lista de novas imagens.
                        const imagemFinal = membro.image || novasImagensMembros[newImageIndex]?.filename || null;
                        if (!membro.image && novasImagensMembros[newImageIndex]) {
                            newImageIndex++;
                        }
                        stmt.run([id, membro.nome, membro.titulos, imagemFinal]);
                    });

                    stmt.finalize((err) => {
                        if (err) { db.run('ROLLBACK'); return res.status(500).send('Erro ao inserir novos membros'); }

                        // 4. Atualizar a tabela 'projetos'
                        let updateQuery = 'UPDATE projetos SET titulo=?, data=?, descricao=?, cursos=?, galeria=?';
                        let params = [titulo, data, descricao, cursos, JSON.stringify(galeriaNovaCompleta)];

                        if (capaFile) {
                            updateQuery += ', capa = ?';
                            params.push(capaFile.filename);
                        }
                        updateQuery += ' WHERE id = ?';
                        params.push(id);

                        db.run(updateQuery, params, (err) => {
                            if (err) { db.run('ROLLBACK'); return res.status(500).send('Erro ao atualizar projeto'); }
                            
                            // 5. COMMIT e deletar arquivos físicos
                            db.run('COMMIT', (err) => {
                                if (err) { return res.status(500).send('Erro ao commitar transação'); }

                                // Deleta arquivos que não são mais necessários
                                if (capaFile && projetoExistente.capa) {
                                    fs.unlink(path.join('uploads', projetoExistente.capa), e => e && console.error("Erro ao deletar capa antiga:", e));
                                }
                                galeriaParaRemover.forEach(img => fs.unlink(path.join('uploads', img), e => e && console.error("Erro ao deletar imagem da galeria:", e)));
                                imagensMembrosParaDeletar.forEach(img => fs.unlink(path.join('uploads', img), e => e && console.error("Erro ao deletar imagem de membro:", e)));

                                res.send('Projeto atualizado com sucesso');
                            });
                        });
                    });
                });
            });
        });
    });
});


// --- DELETE /projetos/:id (MODIFICADO) ---
// Adicionada a remoção de arquivos da galeria
app.delete('/projetos/:id', checkSuapAuth, (req, res) => {
    const { id } = req.params;
  
    db.get('SELECT capa, galeria FROM projetos WHERE id = ?', [id], (err, projeto) => {
      if (err) return res.status(500).send('Erro ao buscar projeto');
      if (!projeto) return res.status(404).json({ error: 'Projeto não encontrado' });
  
      db.all('SELECT image FROM membros WHERE projeto_id = ?', [id], (err, membros) => {
        if (err) return res.status(500).send('Erro ao buscar membros');
  
        db.serialize(() => {
          db.run('BEGIN TRANSACTION');
          db.run('DELETE FROM membros WHERE projeto_id = ?', [id]);
          db.run('DELETE FROM projetos WHERE id = ?', [id]);
          db.run('COMMIT', (err) => {
            if (err) {
              db.run('ROLLBACK');
              return res.status(500).send('Erro ao commitar deleção');
            }
  
            // Deleta os arquivos depois que o DB foi confirmado
            if (projeto.capa) fs.unlink(path.join('uploads', projeto.capa), e => e && console.error(e));
            membros.forEach(m => { if (m.image) fs.unlink(path.join('uploads', m.image), e => e && console.error(e)); });
            // NOVO: Deletar arquivos da galeria
            const galeriaFiles = JSON.parse(projeto.galeria || '[]');
            galeriaFiles.forEach(img => fs.unlink(path.join('uploads', img), e => e && console.error(e)));
  
            res.send('Projeto removido com sucesso');
          });
        });
      });
    });
  });

// =================================================================
// --- OUTRAS ROTAS (Sem grandes mudanças) ---
// =================================================================

app.get('/membros', (req, res) => {
  db.all('SELECT * FROM membros', [], (err, rows) => {
    if (err) return res.status(500).send(err.message);
    res.json(rows);
  });
});

app.get('/meus-dados', checkSuapAuth, (req, res) => {
  res.json(req.userData);
});

app.post('/save-token', (req, res) => {
  const { token } = req.body;
  res.cookie('SUAP_token', token, {
    httpOnly: true, secure: true, sameSite: 'None', maxAge: 3600000
  });
  res.send({ success: true });
});

app.post('/remove-token', async (req, res) => {
  const token = req.cookies.SUAP_token;
  if (token) {
    try {
      await axios.post('https://suap.ifsul.edu.br/o/revoke_token/',
        qs.stringify({
          token: token.replace('Bearer ', ''),
          client_id: '4709NRzgE2vNxYBgKgZ5xoQGFhMkiVFLhCyWUTuv'
        }),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );
    } catch (err) {
      console.error('Erro ao revogar token:', err.message);
    }
  }
  res.clearCookie('SUAP_token', { httpOnly: true, secure: true, sameSite: 'None' });
  res.status(204).end();
});

https.createServer(options, app).listen(PORT, () => {
  console.log(`HTTPS server running at https://localhost:${PORT}`);
});