import express from "express";
import { db } from './db.js';
import cors from "cors";
import multer from 'multer';
import fs from 'fs';
import https from 'https';
import axios from 'axios';
import cookieParser from "cookie-parser";
import qs from 'qs';

const app = express();
const PORT = 3000;
const allowedOrigins = ['https://127.0.0.1:5500']

const options = {
  key: fs.readFileSync('./cert/key.pem'),
  cert: fs.readFileSync('./cert/cert.pem')
};


app.use(express.json());
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, Postman)
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
    cb(null, 'uploads/'); // this folder must exist
  },
  filename: function (req, file, cb) {
    // Save as: speaker-12345.png
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'speaker-' + uniqueSuffix + ext);
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

    const events = Object.values(eventsMap);
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

app.post('/projetos', (req, res) => {
  const token = req.cookies.SUAP_token;
  console.log("1: " + token);

  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const { titulo, data, cursos, descricao, membros, capa } = req.body;

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    db.run(
      `INSERT INTO projetos (titulo, data, cursos, descricao, capa) VALUES (?, ?, ?, ?, ?)`,
      [titulo, data, cursos, descricao, capa],
      function (err) {
        if (err) {
          db.run('ROLLBACK');
          console.log(err);
          return res.status(500).send('Error inserting event');
        }

        const projetoId = this.lastID;

        const stmt = db.prepare(
          `INSERT INTO membros (projeto_id, nome, titulos, image) VALUES (?, ?, ?, ?)`
        );

        for (const membro of membros) {
          stmt.run([projetoId, membro.nome, membro.titulos, membro.image], (err) => {
            if (err) {
              db.run('ROLLBACK');
              console.log(err);
              return res.status(500).send('Error inserting speaker');
            }
          });
        }

        stmt.finalize((err) => {
          if (err) {
            db.run('ROLLBACK');
            console.log(err);
            return res.status(500).send('Error finalizing speakers');
          }

          db.run('COMMIT');
          res.status(201).send('Projeto e membros inseridos com sucesso');
        });
      }
    );
  });
});

app.get('/meus-dados', async (req, res) => {
  const token = req.cookies.SUAP_token;
  console.log("2: " + token);

  if (!token) {
    return res.status(401).json({ error: 'Not authenticated'});
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
