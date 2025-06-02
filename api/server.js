import express from "express";
import { db } from './db.js';
import cors from "cors";
import multer from 'multer';

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));

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
        e.id as event_id,
        e.title, 
        e.date, 
        e.courses,
        e.description,
        e.capa,
        s.nome AS membro_nome, 
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
            data: row.data,
            cursos: row.cursos,
            descricao: row.descricao,
            membros: []
          };
        }
  
        if (row.membro_nome) {
          eventsMap[row.projeto_id].membros.push({
            nome: row.membro_nome,
            image: row.membro_image
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
    db.serialize(() => {
      const {titulo, data, cursos, descricao, capa} = req.body;
        db.run(
            `INSERT INTO projetos (titulo, data, cursos, descricao, capa) VALUES (?, ?, ?, ?, ?)`,
            [titulo, convertToISO(data), cursos, descricao, capa],
            function (err) {
                if (err) return res.status(500).send(err.message);
            }
        );
    });
    res.status(200).send();
    console.log("POST /projetos");
});

app.post('/membros', (req, res) => {
    db.serialize(() => {
        const {IDprojeto, nome, image} = req.body;
        db.run(
            `INSERT INTO membros (projeto_id, nome, image) VALUES (?, ?, ?)`,
            [IDprojeto, nome, image],
            function (err) {
                if (err) return res.status(500).send(err.message);
            }
        );
    });
    res.status(200).send();
    console.log("POST /membros");
});



function convertToISO(ddmmyyyy) {
    const [dd, mm, yyyy] = ddmmyyyy.split('/');
    return `${yyyy}-${mm}-${dd}`; // Converts to ISO: yyyy-MM-dd
}

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
