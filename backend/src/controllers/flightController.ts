
import { Request, Response } from 'express';
import db from '../services/database';
import { Flight, FlightQueryParams } from '../types/api';
import { loggers } from '../utils/logger';

interface DatabaseFlight {
  id: number;
  flight_number: string;
  registration: string;
  departure_station: string;
  arrival_station: string;
  departure_time: string;
  arrival_time: string;
}

export const getFlights = (req: Request, res: Response) => {
  const startTime = Date.now();
  
  try {
    // Validate query parameters if they exist
    const { registration, limit }: FlightQueryParams = req.query;
    
    loggers.business.info('Get flights request', {
      requestId: req.requestId,
      filters: { registration, limit },
      ip: req.ip
    });
    
    if (limit && (isNaN(Number(limit)) || Number(limit) < 0)) {
      loggers.business.warn('Invalid limit parameter', 'Bad Request', {
        requestId: req.requestId,
        providedLimit: limit
      });
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Limit parameter must be a positive number'
      });
    }

    if (registration && typeof registration !== 'string') {
      loggers.business.warn('Invalid registration parameter', 'Bad Request', {
        requestId: req.requestId,
        providedRegistration: registration,
        type: typeof registration
      });
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Registration parameter must be a string'
      });
    }

    let query = `
      SELECT 
        id as flightId,
        flight_number as flightNum,
        registration,
        departure_station as schedDepStation,
        arrival_station as schedArrStation,
        departure_time as schedDepTime,
        arrival_time as schedArrTime
      FROM flights 
    `;

    const params: any[] = [];

    if (registration) {
      query += ` WHERE registration = ?`;
      params.push(registration);
    }

    query += ` ORDER BY departure_time ASC`;

    if (limit) {
      query += ` LIMIT ?`;
      params.push(Number(limit));
    }

    db.all(query, params, (err, rows: DatabaseFlight[]) => {
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
