import { Request, Response } from 'express';
import db from '../services/database';
import { WorkPackageQueryParams } from '../types/api';
import { ERROR_MESSAGES, HTTP_STATUS } from '../utils/constants';
import { loggers } from '../utils/logger';

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
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        error: 'Bad Request',
        message: 'Limit parameter must be a positive number',
      });
    }

    if (registration && typeof registration !== 'string') {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        error: 'Bad Request',
        message: 'Registration parameter must be a string',
      });
    }

    if (status && typeof status !== 'string') {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        error: 'Bad Request',
        message: 'Status parameter must be a string',
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

    const params: (string | number)[] = [];
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
        loggers.app.error(err, 'Database error in getWorkPackages');
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
          error: 'Database Error',
          message: 'Failed to retrieve work packages data',
        });
        return;
      }

      if (!rows || rows.length === 0) {
        res.status(HTTP_STATUS.OK).json([]);
        return;
      }

      res.status(HTTP_STATUS.OK).json(rows);
    });
  } catch (error) {
    loggers.app.error(error as Error, 'Unexpected error in getWorkPackages');
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
      message: 'An unexpected error occurred while fetching work packages',
    });
  }
};
