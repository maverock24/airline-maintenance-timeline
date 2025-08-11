
import { Request, Response } from 'express';
import db from '../services/database';
import { WorkPackage, WorkPackageQueryParams } from '../types/api';

interface DatabaseWorkPackage {
  id: number;
  name: string;
  registration: string;
  start_time: string;
  end_time: string;
  work_orders: number;
  status: string;
}

export const getWorkPackages = (req: Request, res: Response) => {
  try {
    // Validate query parameters if they exist
    const { registration, status, limit }: WorkPackageQueryParams = req.query;
    
    if (limit && (isNaN(Number(limit)) || Number(limit) < 0)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Limit parameter must be a positive number'
      });
    }

    if (registration && typeof registration !== 'string') {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Registration parameter must be a string'
      });
    }

    if (status && typeof status !== 'string') {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Status parameter must be a string'
      });
    }

    let query = `
      SELECT 
        id as workPackageId,
        name,
        registration,
        start_time as startDateTime,
        end_time as endDateTime,
        work_orders as workOrders,
        status
      FROM work_packages 
    `;

    const params: any[] = [];
    const conditions: string[] = [];

    if (registration) {
      conditions.push('registration = ?');
      params.push(registration);
    }

    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ` ORDER BY start_time ASC`;

    if (limit) {
      query += ` LIMIT ?`;
      params.push(Number(limit));
    }

    db.all(query, params, (err, rows: DatabaseWorkPackage[]) => {
      if (err) {
        console.error('Database error in getWorkPackages:', err);
        res.status(500).json({ 
          error: 'Database Error',
          message: 'Failed to retrieve work packages data'
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
    console.error('Unexpected error in getWorkPackages:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred while fetching work packages'
    });
  }
};
