import sqlite3 from "sqlite3";

export const db = new sqlite3.Database("extensao.db");

db.serialize(() => {
  // Create events table
  db.run(`
    CREATE TABLE IF NOT EXISTS projetos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      titulo TEXT NOT NULL,
      data DATE NOT NULL,
      capa TEXT NOT NULL,
      cursos TEXT,
      descricao TEXT
    )
  `);

  // Create speakers table
  db.run(`
    CREATE TABLE IF NOT EXISTS membros (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      projeto_id INTEGER NOT NULL,
      nome TEXT NOT NULL,
      titulos TEXT,
      image TEXT,
      FOREIGN KEY (projeto_id) REFERENCES projetos(id) ON DELETE CASCADE
    )
  `);

  console.log("Tables created successfully.");
});