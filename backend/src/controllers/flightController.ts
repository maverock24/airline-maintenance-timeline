
import { Request, Response } from 'express';
import db from '../services/database';

interface Flight {
  id: number;
  flight_number: string;
  registration: string;
  departure_station: string;
  arrival_station: string;
  departure_time: string;
  arrival_time: string;
}

export const getFlights = (req: Request, res: Response) => {
  try {
    const query = `
      SELECT 
        id as flightId,
        flight_number as flightNum,
        registration,
        departure_station as schedDepStation,
        arrival_station as schedArrStation,
        departure_time as schedDepTime,
        arrival_time as schedArrTime
      FROM flights 
      ORDER BY departure_time ASC
    `;

    db.all(query, [], (err, rows: Flight[]) => {
      if (err) {
        console.error('Database error in getFlights:', err);
        res.status(500).json({ 
          error: 'Database Error',
          message: 'Failed to retrieve flights data'
        });
        return;
      }

      if (!rows || rows.length === 0) {
        res.status(200).json([]);
        return;
      }

      res.status(200).json(rows);
    });
  } catch (error) {
    console.error('Unexpected error in getFlights:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred while fetching flights'
    });
  }
};
