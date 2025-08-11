
import sqlite3 from 'sqlite3';
import { loggers } from '../utils/logger';

const db = new sqlite3.Database('./airline.db', (err) => {
  if (err) {
    loggers.database.error('Database connection failed', err);
    process.exit(1); // Exit the application if database connection fails
  }
  loggers.database.connection('connected', { 
    database: './airline.db',
    timestamp: new Date().toISOString()
  });
});

db.serialize(() => {
  const startTime = Date.now();
  
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
    const duration = Date.now() - startTime;
    if (err) {
      loggers.database.error('Create flights table failed', err, { 
        table: 'flights',
        duration 
      });
      process.exit(1);
    }
    loggers.database.query('CREATE TABLE', 'flights', duration, { 
      action: 'table_creation',
      exists: 'IF NOT EXISTS'
    });
  });

  const workPackagesStartTime = Date.now();
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
    const duration = Date.now() - workPackagesStartTime;
    if (err) {
      loggers.database.error('Create work_packages table failed', err, { 
        table: 'work_packages',
        duration 
      });
      process.exit(1);
    }
    loggers.database.query('CREATE TABLE', 'work_packages', duration, { 
      action: 'table_creation',
      exists: 'IF NOT EXISTS'
    });
  });
});

export default db;
