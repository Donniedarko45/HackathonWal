import express from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { Prisma } from '@prisma/client';

const router = express.Router();

// Validation schemas
const inventoryCreateSchema = z.object({
  productId: z.string().uuid(),
  locationId: z.string().uuid(),
  quantity: z.number().int().min(0),
  reorderPoint: z.number().int().min(0).optional()
});

const inventoryUpdateSchema = z.object({
  quantity: z.number().int().min(0).optional(),
  reservedQty: z.number().int().min(0).optional(),
  reorderPoint: z.number().int().min(0).optional()
});

// Get all inventory items with filters
router.get('/', async (req, res, next) => {
  try {
    const { 
      locationId, 
      productId, 
      lowStock = 'false',
      page = '1', 
      limit = '20',
      search 
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    const where: any = {};
    
    if (locationId) where.locationId = locationId;
    if (productId) where.productId = productId;
    
    // Low stock filter
    if (lowStock === 'true') {
      where.OR = [
        { quantity: { lte: 10 } },
        { quantity: { lte: 10 } }
      ];
    }

    // Search in product name or SKU
    if (search) {
      where.product = {
        OR: [
          { name: { contains: search as string, mode: 'insensitive' } },
          { sku: { contains: search as string, mode: 'insensitive' } }
        ]
      };
    }

    const [inventory, total] = await Promise.all([
      prisma.inventory.findMany({
        where,
        include: {
          product: {
            select: {
              id: true,
              sku: true,
              name: true,
              unitPrice: true,
              category: { select: { name: true } },
              supplier: { select: { name: true } }
            }
          },
          location: {
            select: {
              id: true,
              name: true,
              type: true,
              city: true
            }
          }
        },
        orderBy: { lastUpdated: 'desc' },
        skip: offset,
        take: limitNum
      }),
      prisma.inventory.count({ where })
    ]);

    // Emit real-time update if location specified
    if (locationId) {
      const io = req.app.get('io');
      io.to(`warehouse-${locationId}`).emit('inventory-update', {
        type: 'inventory-fetched',
        data: inventory
      });
    }

    res.json({
      inventory,
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

// Get inventory by ID
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const inventory = await prisma.inventory.findUnique({
      where: { id },
      include: {
        product: {
          include: {
            category: true,
            supplier: true
          }
        },
        location: true
      }
    });

    if (!inventory) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    res.json(inventory);
  } catch (error) {
    next(error);
  }
});

// Create new inventory item
router.post('/', async (req, res, next) => {
  try {
    const data = inventoryCreateSchema.parse(req.body);

    // Check if inventory already exists for this product and location
    const existingInventory = await prisma.inventory.findUnique({
      where: {
        productId_locationId: {
          productId: data.productId,
          locationId: data.locationId
        }
      }
    });

    if (existingInventory) {
      return res.status(400).json({ 
        error: 'Inventory already exists for this product at this location' 
      });
    }

    const inventory = await prisma.inventory.create({
      data: {
        ...data,
        reorderPoint: data.reorderPoint || 50
      },
      include: {
        product: {
          select: {
            id: true,
            sku: true,
            name: true,
            unitPrice: true
          }
        },
        location: {
          select: {
            id: true,
            name: true,
            type: true
          }
        }
      }
    });

    // Emit real-time update
    const io = req.app.get('io');
    io.to(`warehouse-${inventory.locationId}`).emit('inventory-update', {
      type: 'inventory-created',
      data: inventory
    });

    res.status(201).json(inventory);
  } catch (error) {
    next(error);
  }
});

// Update inventory
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = inventoryUpdateSchema.parse(req.body);

    const inventory = await prisma.inventory.update({
      where: { id },
      data: {
        ...data,
        lastUpdated: new Date()
      },
      include: {
        product: {
          select: {
            id: true,
            sku: true,
            name: true,
            unitPrice: true
          }
        },
        location: {
          select: {
            id: true,
            name: true,
            type: true
          }
        }
      }
    });

    // Check for low stock alert
    if (inventory.quantity <= inventory.reorderPoint) {
      const io = req.app.get('io');
      io.to(`warehouse-${inventory.locationId}`).emit('low-stock-alert', {
        inventoryId: inventory.id,
        productName: inventory.product.name,
        currentQuantity: inventory.quantity,
        reorderPoint: inventory.reorderPoint,
        location: inventory.location.name
      });
    }

    // Emit real-time update
    const io = req.app.get('io');
    io.to(`warehouse-${inventory.locationId}`).emit('inventory-update', {
      type: 'inventory-updated',
      data: inventory
    });

    res.json(inventory);
  } catch (error) {
    next(error);
  }
});

// Adjust inventory (add/subtract stock)
router.post('/:id/adjust', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { adjustment, reason } = req.body;

    if (!adjustment || typeof adjustment !== 'number') {
      return res.status(400).json({ error: 'Valid adjustment number required' });
    }

    const inventory = await prisma.inventory.findUnique({
      where: { id },
      include: { product: true, location: true }
    });

    if (!inventory) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    const newQuantity = inventory.quantity + adjustment;

    if (newQuantity < 0) {
      return res.status(400).json({ error: 'Insufficient stock for this adjustment' });
    }

    const updatedInventory = await prisma.inventory.update({
      where: { id },
      data: {
        quantity: newQuantity,
        lastUpdated: new Date()
      },
      include: {
        product: {
          select: {
            id: true,
            sku: true,
            name: true,
            unitPrice: true
          }
        },
        location: {
          select: {
            id: true,
            name: true,
            type: true
          }
        }
      }
    });

    // Log the adjustment (you could create a separate audit log table)
    // For now, we'll just emit the event

    // Emit real-time update
    const io = req.app.get('io');
    io.to(`warehouse-${inventory.locationId}`).emit('inventory-update', {
      type: 'inventory-adjusted',
      data: updatedInventory,
      adjustment,
      reason
    });

    res.json({
      ...updatedInventory,
      adjustment,
      reason,
      previousQuantity: inventory.quantity
    });
  } catch (error) {
    next(error);
  }
});

// Get low stock items
router.get('/alerts/low-stock', async (req, res, next) => {
  try {
    const { locationId } = req.query;

    const where: any = {
      OR: [
        { quantity: { lte: 10 } },
        { quantity: { lte: 10 } }
      ]
    };

    if (locationId) {
      where.locationId = locationId;
    }

    const lowStockItems = await prisma.inventory.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            sku: true,
            name: true,
            unitPrice: true,
            supplier: { select: { name: true, email: true } }
          }
        },
        location: {
          select: {
            id: true,
            name: true,
            type: true
          }
        }
      },
      orderBy: [
        { quantity: 'asc' },
        { lastUpdated: 'desc' }
      ]
    });

    res.json(lowStockItems);
  } catch (error) {
    next(error);
  }
});

// Delete inventory item
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const inventory = await prisma.inventory.findUnique({
      where: { id },
      select: { locationId: true }
    });

    if (!inventory) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    await prisma.inventory.delete({
      where: { id }
    });

    // Emit real-time update
    const io = req.app.get('io');
    io.to(`warehouse-${inventory.locationId}`).emit('inventory-update', {
      type: 'inventory-deleted',
      inventoryId: id
    });

    res.json({ message: 'Inventory item deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router; 