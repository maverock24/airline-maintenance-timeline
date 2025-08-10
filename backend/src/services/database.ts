
import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('./airline.db', (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Connected to the airline database.');
});

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS flights (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      flight_number TEXT NOT NULL,
      registration TEXT NOT NULL,
      departure_station TEXT NOT NULL,
      arrival_station TEXT NOT NULL,
      departure_time TEXT NOT NULL,
      arrival_time TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS work_packages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      registration TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      work_orders INTEGER NOT NULL,
      status TEXT NOT NULL
    )
  `);
});

export default db;
