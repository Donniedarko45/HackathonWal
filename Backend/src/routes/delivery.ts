import express from 'express';
import { prisma } from '../lib/prisma';

const router = express.Router();

// Get all deliveries with filters
router.get('/', async (req, res, next) => {
  try {
    const { 
      status, 
      driverId,
      orderId,
      locationId,
      page = '1', 
      limit = '20' 
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    const where: any = {};
    
    if (status) where.status = status;
    if (driverId) where.driverId = driverId;
    if (orderId) where.orderId = orderId;
    if (locationId) where.fromLocationId = locationId;

    const [deliveries, total] = await Promise.all([
      prisma.delivery.findMany({
        where,
        include: {
          driver: {
            select: { id: true, name: true, email: true }
          },
          order: {
            select: { id: true, orderNumber: true, customer: { select: { name: true } } }
          },
          fromLocation: {
            select: { id: true, name: true, address: true }
          }
        },
        orderBy: { scheduledDate: 'asc' },
        skip: offset,
        take: limitNum
      }),
      prisma.delivery.count({ where })
    ]);

    res.json({
      deliveries,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
