
import { Request, Response } from 'express';
import db from '../services/database';

interface WorkPackage {
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
    const query = `
      SELECT 
        id as workPackageId,
        name,
        registration,
        start_time as startDateTime,
        end_time as endDateTime,
        work_orders as workOrders,
        status
      FROM work_packages 
      ORDER BY start_time ASC
    `;

    db.all(query, [], (err, rows: WorkPackage[]) => {
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
