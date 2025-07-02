import express from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { Prisma } from '@prisma/client';

const router = express.Router();

// Validation schemas
const locationCreateSchema = z.object({
  name: z.string().min(2),
  address: z.string(),
  city: z.string(),
  state: z.string(),
  zipCode: z.string(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  type: z.enum(['WAREHOUSE', 'STORE', 'DISTRIBUTION_CENTER', 'SUPPLIER'])
});

const locationUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  type: z.enum(['WAREHOUSE', 'STORE', 'DISTRIBUTION_CENTER', 'SUPPLIER']).optional()
});

// Get all locations with filters
router.get('/', async (req, res, next) => {
  try {
    const { 
      type,
      city,
      state,
      search,
      page = '1', 
      limit = '20' 
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    const where: any = {};
    
    if (type) where.type = type;
    if (city) where.city = city;
    if (state) where.state = state;
    
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { address: { contains: search as string, mode: 'insensitive' } },
        { city: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    const [locations, total] = await Promise.all([
      prisma.location.findMany({
        where,
        include: {
          _count: {
            select: {
              inventory: true,
              orders: true
            }
          }
        },
        orderBy: [
          { type: 'asc' },
          { name: 'asc' }
        ],
        skip: offset,
        take: limitNum
      }),
      prisma.location.count({ where })
    ]);

    res.json({
      locations,
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

// Get location by ID
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const location = await prisma.location.findUnique({
      where: { id },
      include: {
        inventory: {
          include: {
            product: {
              select: {
                id: true,
                sku: true,
                name: true,
                unitPrice: true,
                category: { select: { name: true } }
              }
            }
          },
          orderBy: { lastUpdated: 'desc' }
        },
        orders: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            orderNumber: true,
            orderType: true,
            status: true,
            totalAmount: true,
            createdAt: true
          }
        },
        _count: {
          select: {
            inventory: true,
            orders: true,
            deliveriesTo: true
          }
        }
      }
    });

    if (!location) {
      return res.status(404).json({ error: 'Location not found' });
    }

    res.json(location);
  } catch (error) {
    next(error);
  }
});

// Create new location
router.post('/', async (req, res, next) => {
  try {
    const data = locationCreateSchema.parse(req.body);

    const location = await prisma.location.create({
      data
    });

    res.status(201).json(location);
  } catch (error) {
    next(error);
  }
});

// Update location
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = locationUpdateSchema.parse(req.body);

    const location = await prisma.location.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date()
      }
    });

    res.json(location);
  } catch (error) {
    next(error);
  }
});

// Get location inventory summary
router.get('/:id/inventory-summary', async (req, res, next) => {
  try {
    const { id } = req.params;

    const location = await prisma.location.findUnique({
      where: { id },
      select: { name: true, type: true }
    });

    if (!location) {
      return res.status(404).json({ error: 'Location not found' });
    }

    const [
      totalProducts,
      totalQuantity,
      lowStockItems,
      outOfStockItems,
      totalValue
    ] = await Promise.all([
      prisma.inventory.count({
        where: { locationId: id }
      }),
      prisma.inventory.aggregate({
        where: { locationId: id },
        _sum: { quantity: true }
      }),
      prisma.inventory.count({
        where: {
          locationId: id,
          OR: [
            { quantity: { lte: 10 } },
            { quantity: { lte: 10 } }
          ]
        }
      }),
      prisma.inventory.count({
        where: {
          locationId: id,
          quantity: 0
        }
      }),
      prisma.inventory.findMany({
        where: { locationId: id },
        include: {
          product: { select: { unitPrice: true } }
        }
      }).then(items => 
        items.reduce((sum, item) => 
          sum + (item.quantity * Number(item.product.unitPrice)), 0
        )
      )
    ]);

    const summary = {
      location,
      totalProducts,
      totalQuantity: totalQuantity._sum.quantity || 0,
      lowStockItems,
      outOfStockItems,
      totalValue: Math.round(totalValue * 100) / 100,
      averageValuePerProduct: totalProducts > 0 
        ? Math.round((totalValue / totalProducts) * 100) / 100 
        : 0
    };

    res.json(summary);
  } catch (error) {
    next(error);
  }
});

// Get location analytics
router.get('/:id/analytics', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;

    const where: any = { locationId: id };
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }

    const [
      totalOrders,
      ordersByType,
      ordersByStatus,
      totalRevenue,
      inventoryTurnover
    ] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.groupBy({
        by: ['orderType'],
        where,
        _count: true
      }),
      prisma.order.groupBy({
        by: ['status'],
        where,
        _count: true
      }),
      prisma.order.aggregate({
        where: { ...where, orderType: 'SALES' },
        _sum: { totalAmount: true }
      }),
      // Simplified inventory turnover calculation
      prisma.inventory.aggregate({
        where: { locationId: id },
        _avg: { quantity: true }
      })
    ]);

    const analytics = {
      totalOrders,
      ordersByType,
      ordersByStatus,
      totalRevenue: totalRevenue._sum.totalAmount || 0,
      averageInventoryLevel: inventoryTurnover._avg.quantity || 0
    };

    res.json(analytics);
  } catch (error) {
    next(error);
  }
});

// Get nearby locations (requires latitude/longitude)
router.get('/:id/nearby', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { radius = '50' } = req.query; // radius in kilometers

    const radiusKm = parseFloat(radius as string);

    const currentLocation = await prisma.location.findUnique({
      where: { id },
      select: { latitude: true, longitude: true, name: true }
    });

    if (!currentLocation || !currentLocation.latitude || !currentLocation.longitude) {
      return res.status(400).json({ 
        error: 'Location coordinates not available for proximity search' 
      });
    }

    // Simple distance calculation (in a real app, you'd use a spatial database or service)
    const locations = await prisma.location.findMany({
      where: {
        id: { not: id },
        latitude: { not: null },
        longitude: { not: null }
      },
      include: {
        _count: {
          select: { inventory: true }
        }
      }
    });

    const nearbyLocations = locations
      .map(location => {
        const distance = calculateDistance(
          currentLocation.latitude!,
          currentLocation.longitude!,
          location.latitude!,
          location.longitude!
        );
        
        return {
          ...location,
          distance: Math.round(distance * 100) / 100
        };
      })
      .filter(location => location.distance <= radiusKm)
      .sort((a, b) => a.distance - b.distance);

    res.json({
      currentLocation: currentLocation.name,
      radius: radiusKm,
      nearbyLocations
    });
  } catch (error) {
    next(error);
  }
});

// Calculate distance between two points (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Get locations by type
router.get('/type/:type', async (req, res, next) => {
  try {
    const { type } = req.params;
    
    const validTypes = ['WAREHOUSE', 'STORE', 'DISTRIBUTION_CENTER', 'SUPPLIER'];
    if (!validTypes.includes(type.toUpperCase())) {
      return res.status(400).json({ error: 'Invalid location type' });
    }

    const locations = await prisma.location.findMany({
      where: { type: type.toUpperCase() as any },
      include: {
        _count: {
          select: {
            inventory: true,
            orders: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json(locations);
  } catch (error) {
    next(error);
  }
});

export default router; 