import sqlite3 from "sqlite3";

export const db = new sqlite3.Database("extensao.db");

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS projetos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      titulo TEXT NOT NULL,
      data DATE NOT NULL,
      capa TEXT NOT NULL,
      cursos TEXT,
      descricao TEXT,
      galeria TEXT
    )
  `);


  db.run(`
    CREATE TABLE IF NOT EXISTS membros (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      projeto_id INTEGER NOT NULL,
      nome TEXT NOT NULL,
      titulos TEXT,
      image TEXT,
      email TEXT,            -- NOVO
      responsavel BOOLEAN DEFAULT 0, -- NOVO
      FOREIGN KEY (projeto_id) REFERENCES projetos(id) ON DELETE CASCADE
    )
  `);


  db.run('ALTER TABLE projetos ADD COLUMN galeria TEXT', (err) => {
    if (err && err.message.includes('duplicate column name')) {
 
    } else if (err) {
  
    } else {
   
    }
  });
  

  db.run('ALTER TABLE membros ADD COLUMN email TEXT', (err) => {
    if (err && err.message.includes('duplicate column name')) {
   
    } else if (err) {

    } else {

    }
  });


  db.run('ALTER TABLE membros ADD COLUMN responsavel BOOLEAN DEFAULT 0', (err) => {
    if (err && err.message.includes('duplicate column name')) {

    } else if (err) {
        console.error("Erro ao adicionar 'responsavel':", err.message);
    } else {
   
    }
  });


});