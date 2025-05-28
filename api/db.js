import sqlite3 from "sqlite3";

export const db = new sqlite3.Database("extensao.db");

db.serialize(() => {
  // Create events table
  db.run(`
    CREATE TABLE IF NOT EXISTS projetos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      date DATE NOT NULL,
      courses TEXT,
      description TEXT
    )
  `);

  // Create speakers table
  db.run(`
    CREATE TABLE IF NOT EXISTS membros (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      image TEXT,
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
    )
  `);

  console.log("Tables created successfully.");
});