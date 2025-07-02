import express from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';

const router = express.Router();

// Validation schemas
const orderCreateSchema = z.object({
  orderType: z.enum(['PURCHASE', 'SALES', 'TRANSFER', 'RETURN']),
  customerId: z.string().uuid().optional(),
  supplierId: z.string().uuid().optional(),
  locationId: z.string().uuid(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  expectedDate: z.string().datetime().optional(),
  notes: z.string().optional(),
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().min(1),
    unitPrice: z.number().min(0)
  }))
});

const orderUpdateSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  expectedDate: z.string().datetime().optional(),
  fulfilledDate: z.string().datetime().optional(),
  notes: z.string().optional()
});

// Generate order number
const generateOrderNumber = () => {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `ORD-${timestamp.slice(-6)}-${random}`;
};

// Get all orders with filters
router.get('/', async (req, res, next) => {
  try {
    const { 
      status, 
      orderType,
      locationId,
      customerId,
      supplierId,
      priority,
      startDate,
      endDate,
      page = '1', 
      limit = '20' 
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    const where: any = {};
    
    if (status) where.status = status;
    if (orderType) where.orderType = orderType;
    if (locationId) where.locationId = locationId;
    if (customerId) where.customerId = customerId;
    if (supplierId) where.supplierId = supplierId;
    if (priority) where.priority = priority;

    // Date range filter
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          customer: {
            select: { id: true, name: true, email: true }
          },
          supplier: {
            select: { id: true, name: true, email: true }
          },
          location: {
            select: { id: true, name: true, type: true, city: true }
          },
          orderItems: {
            include: {
              product: {
                select: { id: true, sku: true, name: true }
              }
            }
          },
          _count: {
            select: { deliveries: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limitNum
      }),
      prisma.order.count({ where })
    ]);

    res.json({
      orders,
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

// Get order by ID
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        customer: {
          select: { id: true, name: true, email: true, role: true }
        },
        supplier: {
          select: { id: true, name: true, email: true, contactName: true, phone: true }
        },
        location: true,
        orderItems: {
          include: {
            product: {
              include: {
                category: { select: { name: true } },
                supplier: { select: { name: true } }
              }
            }
          }
        },
        deliveries: {
          include: {
            driver: { select: { id: true, name: true } },
            fromLocation: { select: { name: true, address: true } }
          }
        }
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    next(error);
  }
});

// Create new order
router.post('/', async (req, res, next) => {
  try {
    const data = orderCreateSchema.parse(req.body);

    // Validate supplier/customer based on order type
    if (data.orderType === 'PURCHASE' && !data.supplierId) {
      return res.status(400).json({ error: 'Supplier ID required for purchase orders' });
    }
    if (data.orderType === 'SALES' && !data.customerId) {
      return res.status(400).json({ error: 'Customer ID required for sales orders' });
    }

    // Calculate total amount
    const totalAmount = data.items.reduce((sum, item) => 
      sum + (item.quantity * item.unitPrice), 0
    );

    const orderNumber = generateOrderNumber();

    // Create order with items in a transaction
    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          orderType: data.orderType,
          customerId: data.customerId,
          supplierId: data.supplierId,
          locationId: data.locationId,
          totalAmount,
          priority: data.priority || 'MEDIUM',
          expectedDate: data.expectedDate ? new Date(data.expectedDate) : null,
          notes: data.notes
        }
      });

      // Create order items
      await tx.orderItem.createMany({
        data: data.items.map(item => ({
          orderId: newOrder.id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.quantity * item.unitPrice
        }))
      });

      // For sales orders, reserve inventory
      if (data.orderType === 'SALES') {
        for (const item of data.items) {
          const inventory = await tx.inventory.findUnique({
            where: {
              productId_locationId: {
                productId: item.productId,
                locationId: data.locationId
              }
            }
          });

          if (!inventory || inventory.quantity < item.quantity) {
            throw new Error(`Insufficient stock for product ${item.productId}`);
          }

          await tx.inventory.update({
            where: { id: inventory.id },
            data: {
              reservedQty: inventory.reservedQty + item.quantity
            }
          });
        }
      }

      return newOrder;
    });

    const createdOrder = await prisma.order.findUnique({
      where: { id: order.id },
      include: {
        customer: { select: { id: true, name: true, email: true } },
        supplier: { select: { id: true, name: true, email: true } },
        location: { select: { id: true, name: true, type: true } },
        orderItems: {
          include: {
            product: { select: { id: true, sku: true, name: true } }
          }
        }
      }
    });

    // Emit real-time update
    const io = req.app.get('io');
    io.emit('order-created', {
      type: 'order-created',
      data: createdOrder
    });

    res.status(201).json(createdOrder);
  } catch (error) {
    next(error);
  }
});

// Update order
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = orderUpdateSchema.parse(req.body);

    const order = await prisma.order.update({
      where: { id },
      data: {
        ...data,
        expectedDate: data.expectedDate ? new Date(data.expectedDate) : undefined,
        fulfilledDate: data.fulfilledDate ? new Date(data.fulfilledDate) : undefined,
        updatedAt: new Date()
      },
      include: {
        customer: { select: { id: true, name: true, email: true } },
        supplier: { select: { id: true, name: true, email: true } },
        location: { select: { id: true, name: true, type: true } },
        orderItems: {
          include: {
            product: { select: { id: true, sku: true, name: true } }
          }
        }
      }
    });

    // Emit real-time update
    const io = req.app.get('io');
    io.emit('order-updated', {
      type: 'order-updated',
      data: order
    });

    res.json(order);
  } catch (error) {
    next(error);
  }
});

// Fulfill order (update inventory)
router.post('/:id/fulfill', async (req, res, next) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        orderItems: {
          include: { product: true }
        },
        location: true
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.status !== 'CONFIRMED' && order.status !== 'PROCESSING') {
      return res.status(400).json({ 
        error: 'Order must be confirmed or processing to fulfill' 
      });
    }

    // Update order and inventory in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update order status
      const updatedOrder = await tx.order.update({
        where: { id },
        data: {
          status: 'SHIPPED',
          fulfilledDate: new Date()
        }
      });

      // Update inventory based on order type
      for (const item of order.orderItems) {
        const inventory = await tx.inventory.findUnique({
          where: {
            productId_locationId: {
              productId: item.productId,
              locationId: order.locationId
            }
          }
        });

        if (inventory) {
          if (order.orderType === 'PURCHASE') {
            // Add to inventory
            await tx.inventory.update({
              where: { id: inventory.id },
              data: {
                quantity: inventory.quantity + item.quantity,
                lastUpdated: new Date()
              }
            });
          } else if (order.orderType === 'SALES') {
            // Remove from inventory and clear reservation
            await tx.inventory.update({
              where: { id: inventory.id },
              data: {
                quantity: inventory.quantity - item.quantity,
                reservedQty: Math.max(0, inventory.reservedQty - item.quantity),
                lastUpdated: new Date()
              }
            });
          }
        }
      }

      return updatedOrder;
    });

    // Emit real-time updates
    const io = req.app.get('io');
    io.emit('order-fulfilled', {
      type: 'order-fulfilled',
      orderId: id,
      orderNumber: order.orderNumber
    });

    io.to(`warehouse-${order.locationId}`).emit('inventory-update', {
      type: 'order-fulfilled',
      orderId: id
    });

    res.json({ message: 'Order fulfilled successfully', order: result });
  } catch (error) {
    next(error);
  }
});

// Cancel order
router.post('/:id/cancel', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const order = await prisma.order.findUnique({
      where: { id },
      include: { orderItems: true }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (['DELIVERED', 'CANCELLED'].includes(order.status)) {
      return res.status(400).json({ 
        error: 'Cannot cancel order with current status' 
      });
    }

    // Update order and release reserved inventory
    const result = await prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.order.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          notes: order.notes ? `${order.notes}\nCancelled: ${reason}` : `Cancelled: ${reason}`
        }
      });

      // Release reserved inventory for sales orders
      if (order.orderType === 'SALES') {
        for (const item of order.orderItems) {
          const inventory = await tx.inventory.findUnique({
            where: {
              productId_locationId: {
                productId: item.productId,
                locationId: order.locationId
              }
            }
          });

          if (inventory) {
            await tx.inventory.update({
              where: { id: inventory.id },
              data: {
                reservedQty: Math.max(0, inventory.reservedQty - item.quantity)
              }
            });
          }
        }
      }

      return updatedOrder;
    });

    // Emit real-time update
    const io = req.app.get('io');
    io.emit('order-cancelled', {
      type: 'order-cancelled',
      orderId: id,
      reason
    });

    res.json({ message: 'Order cancelled successfully', order: result });
  } catch (error) {
    next(error);
  }
});

// Get order analytics
router.get('/analytics/summary', async (req, res, next) => {
  try {
    const { locationId, startDate, endDate } = req.query;

    const where: any = {};
    if (locationId) where.locationId = locationId;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }

    const [
      totalOrders,
      ordersByStatus,
      ordersByType,
      revenueData
    ] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.groupBy({
        by: ['status'],
        where,
        _count: true
      }),
      prisma.order.groupBy({
        by: ['orderType'],
        where,
        _count: true
      }),
      prisma.order.aggregate({
        where: { ...where, orderType: 'SALES' },
        _sum: { totalAmount: true },
        _avg: { totalAmount: true }
      })
    ]);

    res.json({
      totalOrders,
      ordersByStatus,
      ordersByType,
      revenue: {
        total: revenueData._sum.totalAmount || 0,
        average: revenueData._avg.totalAmount || 0
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router; 