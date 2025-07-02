import express from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { Prisma } from '@prisma/client';

const router = express.Router();

// Validation schemas
const supplierCreateSchema = z.object({
  name: z.string().min(2),
  contactName: z.string().min(2),
  email: z.string().email(),
  phone: z.string(),
  address: z.string(),
  city: z.string(),
  state: z.string(),
  zipCode: z.string(),
  rating: z.number().min(0).max(5).optional()
});

const supplierUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  contactName: z.string().min(2).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  rating: z.number().min(0).max(5).optional(),
  isActive: z.boolean().optional()
});

// Get all suppliers with filters
router.get('/', async (req, res, next) => {
  try {
    const { 
      isActive = 'true',
      city,
      state,
      minRating,
      search,
      page = '1', 
      limit = '20' 
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    const where: any = {};
    
    if (isActive !== 'all') {
      where.isActive = isActive === 'true';
    }
    
    if (city) where.city = city;
    if (state) where.state = state;
    if (minRating) where.rating = { gte: parseFloat(minRating as string) };
    
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { contactName: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    const [suppliers, total] = await Promise.all([
      prisma.supplier.findMany({
        where,
        include: {
          _count: {
            select: { 
              products: true,
              orders: true
            }
          }
        },
        orderBy: [
          { rating: 'desc' },
          { name: 'asc' }
        ],
        skip: offset,
        take: limitNum
      }),
      prisma.supplier.count({ where })
    ]);

    res.json({
      suppliers,
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

// Get supplier by ID
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        products: {
          select: {
            id: true,
            sku: true,
            name: true,
            unitPrice: true,
            isActive: true,
            category: { select: { name: true } }
          }
        },
        orders: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            orderNumber: true,
            status: true,
            totalAmount: true,
            createdAt: true,
            expectedDate: true,
            fulfilledDate: true
          }
        },
        _count: {
          select: {
            products: true,
            orders: true
          }
        }
      }
    });

    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    res.json(supplier);
  } catch (error) {
    next(error);
  }
});

// Create new supplier
router.post('/', async (req, res, next) => {
  try {
    const data = supplierCreateSchema.parse(req.body);

    // Check if supplier with same email exists
    const existingSupplier = await prisma.supplier.findFirst({
      where: { email: data.email }
    });

    if (existingSupplier) {
      return res.status(400).json({ error: 'Supplier with this email already exists' });
    }

    const supplier = await prisma.supplier.create({
      data: {
        ...data,
        rating: data.rating || 0.0
      }
    });

    res.status(201).json(supplier);
  } catch (error) {
    next(error);
  }
});

// Update supplier
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = supplierUpdateSchema.parse(req.body);

    // Check if email is being updated and doesn't conflict
    if (data.email) {
      const existingSupplier = await prisma.supplier.findFirst({
        where: { 
          email: data.email,
          id: { not: id }
        }
      });

      if (existingSupplier) {
        return res.status(400).json({ error: 'Supplier with this email already exists' });
      }
    }

    const supplier = await prisma.supplier.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date()
      }
    });

    res.json(supplier);
  } catch (error) {
    next(error);
  }
});

// Get supplier performance analytics
router.get('/:id/performance', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;

    const where: any = { supplierId: id };
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }

    const [
      totalOrders,
      completedOrders,
      cancelledOrders,
      avgOrderValue,
      onTimeDeliveries,
      totalOrderValue
    ] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.count({ 
        where: { ...where, status: 'DELIVERED' } 
      }),
      prisma.order.count({ 
        where: { ...where, status: 'CANCELLED' } 
      }),
      prisma.order.aggregate({
        where,
        _avg: { totalAmount: true }
      }),
      prisma.order.count({
        where: {
          ...where,
          status: 'DELIVERED',
          fulfilledDate: { lte: Prisma.raw('expected_date') }
        }
      }),
      prisma.order.aggregate({
        where: { ...where, status: 'DELIVERED' },
        _sum: { totalAmount: true }
      })
    ]);

    const completionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;
    const cancellationRate = totalOrders > 0 ? (cancelledOrders / totalOrders) * 100 : 0;
    const onTimeDeliveryRate = completedOrders > 0 ? (onTimeDeliveries / completedOrders) * 100 : 0;

    const performance = {
      totalOrders,
      completedOrders,
      cancelledOrders,
      completionRate: Math.round(completionRate * 100) / 100,
      cancellationRate: Math.round(cancellationRate * 100) / 100,
      onTimeDeliveryRate: Math.round(onTimeDeliveryRate * 100) / 100,
      averageOrderValue: avgOrderValue._avg.totalAmount || 0,
      totalOrderValue: totalOrderValue._sum.totalAmount || 0
    };

    res.json(performance);
  } catch (error) {
    next(error);
  }
});

// Update supplier rating
router.post('/:id/rating', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rating, orderId } = req.body;

    if (!rating || rating < 0 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 0 and 5' });
    }

    // Verify the order belongs to this supplier
    if (orderId) {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: { supplierId: true, status: true }
      });

      if (!order || order.supplierId !== id) {
        return res.status(400).json({ error: 'Invalid order for this supplier' });
      }

      if (order.status !== 'DELIVERED') {
        return res.status(400).json({ error: 'Can only rate completed orders' });
      }
    }

    // Calculate new average rating
    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        orders: {
          where: { status: 'DELIVERED' },
          select: { id: true }
        }
      }
    });

    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    // Simple average calculation (in production, you'd store individual ratings)
    const totalCompletedOrders = supplier.orders.length;
    const currentRating = supplier.rating || 0;
    const newRating = totalCompletedOrders > 0 
      ? ((currentRating * totalCompletedOrders) + rating) / (totalCompletedOrders + 1)
      : rating;

    const updatedSupplier = await prisma.supplier.update({
      where: { id },
      data: { 
        rating: Math.round(newRating * 100) / 100 // Round to 2 decimal places
      }
    });

    res.json({ 
      message: 'Rating updated successfully',
      supplier: updatedSupplier 
    });
  } catch (error) {
    next(error);
  }
});

// Get top performing suppliers
router.get('/analytics/top-performers', async (req, res, next) => {
  try {
    const { limit = '10', minOrders = '5' } = req.query;
    
    const limitNum = parseInt(limit as string);
    const minOrdersNum = parseInt(minOrders as string);

    const suppliers = await prisma.supplier.findMany({
      where: {
        isActive: true,
        orders: {
          some: {
            status: 'DELIVERED'
          }
        }
      },
      include: {
        _count: {
          select: {
            orders: {
              where: { status: 'DELIVERED' }
            }
          }
        },
        orders: {
          where: { status: 'DELIVERED' },
          select: {
            totalAmount: true,
            fulfilledDate: true,
            expectedDate: true
          }
        }
      },
      orderBy: { rating: 'desc' },
      take: limitNum
    });

    const topPerformers = suppliers
      .filter(supplier => supplier._count.orders >= minOrdersNum)
      .map(supplier => {
        const completedOrders = supplier.orders;
        const totalRevenue = completedOrders.reduce((sum, order) => sum + Number(order.totalAmount), 0);
        const onTimeDeliveries = completedOrders.filter(order => 
          order.fulfilledDate && order.expectedDate && 
          order.fulfilledDate <= order.expectedDate
        ).length;
        
        return {
          id: supplier.id,
          name: supplier.name,
          rating: supplier.rating,
          totalOrders: supplier._count.orders,
          totalRevenue,
          onTimeDeliveryRate: completedOrders.length > 0 
            ? Math.round((onTimeDeliveries / completedOrders.length) * 100 * 100) / 100
            : 0,
          averageOrderValue: completedOrders.length > 0 
            ? Math.round((totalRevenue / completedOrders.length) * 100) / 100
            : 0
        };
      });

    res.json(topPerformers);
  } catch (error) {
    next(error);
  }
});

// Deactivate supplier
router.post('/:id/deactivate', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    // Check for active orders
    const activeOrders = await prisma.order.count({
      where: {
        supplierId: id,
        status: { in: ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED'] }
      }
    });

    if (activeOrders > 0) {
      return res.status(400).json({ 
        error: `Cannot deactivate supplier with ${activeOrders} active orders` 
      });
    }

    const supplier = await prisma.supplier.update({
      where: { id },
      data: { 
        isActive: false,
        updatedAt: new Date()
      }
    });

    res.json({ 
      message: 'Supplier deactivated successfully',
      reason,
      supplier 
    });
  } catch (error) {
    next(error);
  }
});

export default router; 