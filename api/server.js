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
const PORT = 3000;
const allowedOrigins = ['https://127.0.0.1:5500', 'http://127.0.0.1:5500','http://127.0.0.1:5501' , 'https://localhost:5501, https://localhost:3000', 'http://localhost:3000'];
const allowedUserRoles = "docente estagiario"

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
  credentials: true  // if you use cookies or auth headers
}));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'upload-' + uniqueSuffix + ext);
  }
});

const upload = multer({ storage: storage });

// Make the uploads folder public
app.use('/uploads', express.static('uploads'));

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

    // Group rows by event
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

app.post('/projetos', upload.fields([
  { name: 'capa', maxCount: 1 },
  { name: 'membroImages' } // várias imagens
]), async (req, res) => {
  const token = req.cookies.SUAP_token;
  console.log("1: " + token);

  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const suapRes = await axios.get('https://suap.ifsul.edu.br/api/rh/meus-dados/', {
      headers: {
        Authorization: 'Bearer ' + token // or however you're storing the token
      }
    });

    if(!allowedUserRoles.includes(suapRes.data.vinculo.categoria)){
      console.log("Não autorizado.")
      return res.status(401).send("Não autorizado.")
    }
        
    const { titulo, data, cursos, descricao, membros } = req.body;
    const capaPath = req.files['capa']?.[0]?.path.slice(8);

    const membrosArray = JSON.parse(membros); // [{ nome, titulos }]
    const imagensMembros = req.files['membroImages'] || [];

    console.log(membros);

    db.serialize(() => {
      db.run('BEGIN TRANSACTION');

      db.run(
        `INSERT INTO projetos (titulo, data, cursos, descricao, capa) VALUES (?, ?, ?, ?, ?)`,
        [titulo, data, cursos, descricao, capaPath],
        function (err) {
          if (err) {
            db.run('ROLLBACK');
            console.error(err);
            return res.status(500).send('Erro ao inserir projeto');
          }

          const projetoId = this.lastID;

          const stmt = db.prepare(
            `INSERT INTO membros (projeto_id, nome, titulos, image) VALUES (?, ?, ?, ?)`
          );

          membrosArray.forEach((membro, index) => {
            const imgPath = imagensMembros[index]?.path.slice(8) || null;

            stmt.run([projetoId, membro.nome, membro.titulos, imgPath], (err) => {
              if (err) {
                db.run('ROLLBACK');
                console.error(err);
                return res.status(500).send('Erro ao inserir membro');
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
  } catch (error) {
    console.error(error);
    res.status(500).send('Erro interno no servidor');
  }
});

app.delete('/projetos/:id', async (req, res) => {
  const token = req.cookies.SUAP_token;
  console.log("4: " + token);
  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const suapRes = await axios.get('https://suap.ifsul.edu.br/api/rh/meus-dados/', {
      headers: {
        Authorization: 'Bearer ' + token // or however you're storing the token
      }
    });

    if(!allowedUserRoles.includes(suapRes.data.vinculo.categoria)){
      console.log("Não autorizado.")
      return res.status(401).send("Não autorizado.")
    }

    db.run(`DELETE FROM projetos WHERE id = ?`, [req.params.id], (err)=>{
      if(err){
        console.log(err);
        return res.status(500).send("Error: " + err);
      }
      res.send("Projeto removido.")
    })

  } catch (error) {
    console.error(error);
    res.status(500).send('Erro interno no servidor');
  }
})

app.get('/meus-dados', async (req, res) => {
  const token = req.cookies.SUAP_token;
  console.log("2: " + token);

  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const suapRes = await axios.get('https://suap.ifsul.edu.br/api/rh/meus-dados/', {
      headers: {
        Authorization: 'Bearer ' + token // or however you're storing the token
      }
    });

    res.json(suapRes.data);
  } catch (err) {
    console.error(err);
    res.status(500).send("Erro ao comunicar com o SUAP");
  }
});

app.post('/save-token', (req, res) => {
  const { token } = req.body;
  console.log("3: " + token);

  // Save it as a secure, HTTP-only cookie
  res.cookie('SUAP_token', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'None',
    maxAge: 3600000 // 1 hour
  });

  res.send({ success: true });
});

app.post('/remove-token', async (req, res) => {
  const token = req.cookies.SUAP_token;

  if (!token) {
    res.clearCookie('SUAP_token', {
      httpOnly: true,
      secure: true,
      sameSite: 'None'
    });
    return res.status(204).end(); // No content
  }

  try {
    // Revoke the token at SUAP (if they support it)
    await axios.post(
      'https://suap.ifsul.edu.br/o/revoke_token/',
      qs.stringify({
        token: token.replace('Bearer ', ''),
        client_id: '4709NRzgE2vNxYBgKgZ5xoQGFhMkiVFLhCyWUTuv'
        // You may need `client_secret` if required
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
  } catch (err) {
    console.error('Error revoking token:', err.message);
    // Still proceed with cookie removal
  }

  res.clearCookie('SUAP_token', {
    httpOnly: true,
    secure: true,
    sameSite: 'None'
  });

  res.status(204).end();
});


function convertToISO(ddmmyyyy) {
  const [dd, mm, yyyy] = ddmmyyyy.split('/');
  return `${yyyy}-${mm}-${dd}`; // Converts to ISO: yyyy-MM-dd
}

https.createServer(options, app).listen(3000, () => {
  console.log('HTTPS server running at https://localhost:3000');
});
