
import db from '../services/database';

const flights = [
  { flight_number: 'AY101', registration: 'ABC', departure_station: 'LHR', arrival_station: 'HEL', departure_time: '2025-08-08T10:00:00Z', arrival_time: '2025-08-08T13:00:00Z' },
  { flight_number: 'AY102', registration: 'ABC', departure_station: 'HEL', arrival_station: 'LHR', departure_time: '2025-08-08T16:00:00Z', arrival_time: '2025-08-08T19:00:00Z' },
  { flight_number: 'AY201', registration: 'DEF', departure_station: 'JFK', arrival_station: 'HEL', departure_time: '2025-08-08T12:00:00Z', arrival_time: '2025-08-08T20:00:00Z' },
  { flight_number: 'AY202', registration: 'DEF', departure_station: 'HEL', arrival_station: 'JFK', departure_time: '2025-08-08T22:00:00Z', arrival_time: '2025-08-09T06:00:00Z' },
];

const workPackages = [
  { name: 'WP-001', registration: 'ABC', start_time: '2025-08-08T13:30:00Z', end_time: '2025-08-08T15:30:00Z', work_orders: 5, status: 'In Progress' },
  { name: 'WP-002', registration: 'DEF', start_time: '2025-08-08T20:30:00Z', end_time: '2025-08-08T21:30:00Z', work_orders: 3, status: 'Completed' },
];

db.serialize(() => {
  const flightStmt = db.prepare('INSERT INTO flights (flight_number, registration, departure_station, arrival_station, departure_time, arrival_time) VALUES (?, ?, ?, ?, ?, ?)');
  flights.forEach(flight => flightStmt.run(Object.values(flight)));
  flightStmt.finalize();

  const workPackageStmt = db.prepare('INSERT INTO work_packages (name, registration, start_time, end_time, work_orders, status) VALUES (?, ?, ?, ?, ?, ?)');
  workPackages.forEach(wp => workPackageStmt.run(Object.values(wp)));
  workPackageStmt.finalize();
});

console.log('Database seeded');
