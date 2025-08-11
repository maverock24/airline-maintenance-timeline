
import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('./airline.db', (err) => {
  if (err) {
    console.error('Failed to connect to database:', err.message);
    process.exit(1); // Exit the application if database connection fails
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
  `, (err) => {
    if (err) {
      console.error('Failed to create flights table:', err.message);
      process.exit(1);
    }
  });

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
  `, (err) => {
    if (err) {
      console.error('Failed to create work_packages table:', err.message);
      process.exit(1);
    }
  });
});

export default db;
