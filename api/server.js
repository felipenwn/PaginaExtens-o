import express from "express";
import { db } from './db.js';
const app = express();
const PORT = 3000;

app.use(express.json());

app.get('/projetos', (req, res) => {
    const query = `
      SELECT 
        e.id as event_id,
        e.title, 
        e.date, 
        e.courses,
        e.description,
        s.name AS speaker_name, 
        s.image AS speaker_image 
      FROM projetos e
      LEFT JOIN membros s ON e.id = s.event_id
    `;
  
    db.all(query, [], (err, rows) => {
      if (err) {
        console.error(err.message);
        return res.status(500).json({ error: 'Database error' });
      }
  
      // Group rows by event
      const eventsMap = {};
      rows.forEach(row => {
        if (!eventsMap[row.event_id]) {
          eventsMap[row.event_id] = {
            id: row.event_id,
            titulo: row.title,
            data: row.date,
            cursos: row.courses,
            descricao: row.description,
            membros: []
          };
        }
  
        if (row.speaker_name) {
          eventsMap[row.event_id].membros.push({
            nome: row.speaker_name,
            image: row.speaker_image
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
        db.run(
            `INSERT INTO projetos (title, date, courses, description) VALUES (?, ?, ?, ?)`,
            [req.query.titulo, convertToISO(req.query.data), req.query.cursos, req.query.descricao],
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
        db.run(
            `INSERT INTO membros (event_id, name, image) VALUES (?, ?, ?)`,
            [req.query.IDprojeto, req.query.nome, req.query.image],
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
