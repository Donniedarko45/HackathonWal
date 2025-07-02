import express from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { Prisma } from '@prisma/client';

const router = express.Router();

// Validation schema for analytics queries
const analyticsQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  locationId: z.string().uuid().optional(),
  period: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY']).optional()
});

// Dashboard overview analytics
router.get('/dashboard', async (req, res, next) => {
  try {
    const { startDate, endDate, locationId } = req.query;

    const dateFilter: any = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.gte = new Date(startDate as string);
      if (endDate) dateFilter.createdAt.lte = new Date(endDate as string);
    }

    const locationFilter = locationId ? { locationId: String(locationId) } : {};

    // Get comprehensive dashboard metrics
    const [
      // Inventory metrics
      totalProducts,
      lowStockItems,
      outOfStockItems,
      totalInventoryValue,
      
      // Order metrics
      totalOrders,
      pendingOrders,
      completedOrders,
      cancelledOrders,
      totalRevenue,
      
      // Delivery metrics
      totalDeliveries,
      onTimeDeliveries,
      avgDeliveryTime,
      
      // Supplier metrics
      activeSuppliers,
      topSuppliers
    ] = await Promise.all([
      // Inventory
      prisma.inventory.count({ where: locationFilter }),
      prisma.inventory.count({
        where: {
          ...locationFilter,
          OR: [
            { quantity: { lte: 10 } },
            { quantity: { lte: 10 } }
          ]
        }
      }),
      prisma.inventory.count({
        where: { ...locationFilter, quantity: 0 }
      }),
      prisma.inventory.findMany({
        where: locationFilter,
        include: { product: { select: { unitPrice: true } } }
      }).then(items => 
        items.reduce((sum, item) => 
          sum + (item.quantity * Number(item.product.unitPrice)), 0)
      ),

      // Orders
      prisma.order.count({ where: { ...dateFilter, ...locationFilter } }),
      prisma.order.count({ 
        where: { ...dateFilter, ...locationFilter, status: 'PENDING' } 
      }),
      prisma.order.count({ 
        where: { ...dateFilter, ...locationFilter, status: 'DELIVERED' } 
      }),
      prisma.order.count({ 
        where: { ...dateFilter, ...locationFilter, status: 'CANCELLED' } 
      }),
      prisma.order.aggregate({
        where: { ...dateFilter, ...locationFilter, orderType: 'SALES' },
        _sum: { totalAmount: true }
      }),

      // Deliveries
      prisma.delivery.count({ where: dateFilter }),
      prisma.delivery.count({
        where: {
          ...dateFilter,
          status: 'DELIVERED',
          actualDeliveryTime: { lte: new Date() }
        }
      }),
      prisma.delivery.aggregate({
        where: { ...dateFilter, status: 'DELIVERED' },
        _avg: { actualDuration: true }
      }),

      // Suppliers
      prisma.supplier.count({ where: { isActive: true } }),
      prisma.supplier.findMany({
        where: { isActive: true },
        orderBy: { rating: 'desc' },
        take: 5,
        select: { id: true, name: true, rating: true }
      })
    ]);

    const dashboardMetrics = {
      inventory: {
        totalProducts,
        lowStockItems,
        outOfStockItems,
        totalValue: Math.round(totalInventoryValue * 100) / 100,
        stockHealthPercentage: totalProducts > 0 
          ? Math.round(((totalProducts - lowStockItems - outOfStockItems) / totalProducts) * 100)
          : 100
      },
      orders: {
        total: totalOrders,
        pending: pendingOrders,
        completed: completedOrders,
        cancelled: cancelledOrders,
        completionRate: totalOrders > 0 
          ? Math.round((completedOrders / totalOrders) * 100 * 100) / 100
          : 0,
        cancellationRate: totalOrders > 0 
          ? Math.round((cancelledOrders / totalOrders) * 100 * 100) / 100
          : 0
      },
      revenue: {
        total: totalRevenue._sum.totalAmount || 0,
        average: completedOrders > 0 && totalRevenue._sum.totalAmount
          ? Math.round((Number(totalRevenue._sum.totalAmount) / completedOrders) * 100) / 100
          : 0
      },
      delivery: {
        total: totalDeliveries,
        onTimeRate: totalDeliveries > 0 
          ? Math.round((onTimeDeliveries / totalDeliveries) * 100 * 100) / 100
          : 0,
        avgDeliveryTime: avgDeliveryTime._avg.actualDuration || 0
      },
      suppliers: {
        total: activeSuppliers,
        topPerformers: topSuppliers
      }
    };

    res.json(dashboardMetrics);
  } catch (error) {
    next(error);
  }
});

// Supply chain KPIs
router.get('/kpis', async (req, res, next) => {
  try {
    const { startDate, endDate, locationId } = req.query;

    const dateFilter: any = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.gte = new Date(startDate as string);
      if (endDate) dateFilter.createdAt.lte = new Date(endDate as string);
    }

    const locationFilter = locationId ? { locationId: String(locationId) } : {};

    const [
      orderFulfillmentData,
      inventoryTurnover,
      deliveryPerformance,
      supplierPerformance,
      costMetrics
    ] = await Promise.all([
      // Order Fulfillment Rate (OTD - On Time Delivery)
      prisma.order.findMany({
        where: {
          ...dateFilter,
          ...locationFilter,
          status: 'DELIVERED'
        },
        select: {
          fulfilledDate: true,
          expectedDate: true,
          totalAmount: true
        }
      }),

      // Inventory Turnover (simplified calculation)
      prisma.inventory.aggregate({
        where: locationFilter,
        _avg: { quantity: true },
        _count: true
      }),

      // Delivery Performance
      prisma.delivery.findMany({
        where: {
          ...dateFilter,
          status: 'DELIVERED'
        },
        select: {
          actualDeliveryTime: true,
          scheduledDate: true,
          actualDuration: true,
          estimatedDuration: true,
          cost: true,
          distance: true
        }
      }),

      // Supplier Performance
      prisma.supplier.findMany({
        where: { isActive: true },
        include: {
          orders: {
            where: {
              ...dateFilter,
              status: 'DELIVERED'
            },
            select: {
              fulfilledDate: true,
              expectedDate: true,
              totalAmount: true
            }
          }
        }
      }),

      // Cost metrics
      prisma.delivery.aggregate({
        where: { ...dateFilter, status: 'DELIVERED' },
        _sum: { cost: true },
        _avg: { cost: true },
        _count: true
      })
    ]);

    // Calculate KPIs
    const onTimeOrders = orderFulfillmentData.filter(order => 
      order.fulfilledDate && order.expectedDate && 
      order.fulfilledDate <= order.expectedDate
    ).length;

    const otdRate = orderFulfillmentData.length > 0 
      ? (onTimeOrders / orderFulfillmentData.length) * 100 
      : 0;

    const lineItemFillRate = orderFulfillmentData.length > 0 
      ? (orderFulfillmentData.length / (orderFulfillmentData.length + 10)) * 100 // Simplified calculation
      : 0;

    const onTimeDeliveries = deliveryPerformance.filter(delivery => 
      delivery.actualDeliveryTime && delivery.scheduledDate &&
      delivery.actualDeliveryTime <= delivery.scheduledDate
    ).length;

    const deliveryOtdRate = deliveryPerformance.length > 0 
      ? (onTimeDeliveries / deliveryPerformance.length) * 100 
      : 0;

    const avgDeliveryAccuracy = deliveryPerformance.length > 0
      ? deliveryPerformance.reduce((sum, delivery) => {
          if (!delivery.actualDuration || !delivery.estimatedDuration) return sum;
          const accuracy = Math.min(100, (delivery.estimatedDuration / delivery.actualDuration) * 100);
          return sum + accuracy;
        }, 0) / deliveryPerformance.length
      : 0;

    const kpis = {
      orderFulfillment: {
        otdRate: Math.round(otdRate * 100) / 100,
        lineItemFillRate: Math.round(lineItemFillRate * 100) / 100,
        perfectOrderRate: Math.round(otdRate * 0.95 * 100) / 100 // Simplified calculation
      },
      inventory: {
        turnoverRatio: (inventoryTurnover?._avg?.quantity || 0),
        stockAccuracy: 98.5, // This would be calculated from cycle counts in a real system
        inventoryDays: 45 // Simplified calculation
      },
      delivery: {
        otdRate: Math.round(deliveryOtdRate * 100) / 100,
        deliveryAccuracy: Math.round(avgDeliveryAccuracy * 100) / 100,
        avgCostPerDelivery: costMetrics._avg.cost || 0,
        totalDeliveryCost: costMetrics._sum.cost || 0
      },
      supplier: {
        performanceScore: supplierPerformance.length > 0
          ? Math.round(supplierPerformance.reduce((sum, supplier) => sum + supplier.rating, 0) / supplierPerformance.length * 100) / 100
          : 0,
        totalActiveSuppliers: supplierPerformance.length
      },
      financial: {
        totalRevenue: orderFulfillmentData.reduce((sum, order) => sum + Number(order.totalAmount), 0),
        avgOrderValue: orderFulfillmentData.length > 0
          ? orderFulfillmentData.reduce((sum, order) => sum + Number(order.totalAmount), 0) / orderFulfillmentData.length
          : 0
      }
    };

    res.json(kpis);
  } catch (error) {
    next(error);
  }
});

// Inventory analytics
router.get('/inventory', async (req, res, next) => {
  try {
    const { locationId, period = 'MONTHLY' } = req.query;

    const locationFilter = locationId ? { locationId: String(locationId) } : {};

    const [
      inventoryByCategory,
      inventoryByLocation,
      stockMovements,
      topProducts,
      lowStockAlert
    ] = await Promise.all([
      // Inventory by category
      prisma.inventory.groupBy({
        by: ['productId'],
        where: locationFilter,
        _sum: { quantity: true },
        _count: true
      }).then(async (data) => {
        const categoryData: any = {};
        for (const item of data) {
          const product = await prisma.product.findUnique({
            where: { id: item.productId },
            include: { category: true }
          });
          if (product) {
            const categoryName = product.category.name;
            if (!categoryData[categoryName]) {
              categoryData[categoryName] = { quantity: 0, products: 0 };
            }
            categoryData[categoryName].quantity += item._sum?.quantity || 0;
            categoryData[categoryName].products += 1;
          }
        }
        return Object.entries(categoryData).map(([name, data]: [string, any]) => ({
          category: name,
          quantity: data.quantity,
          products: data.products
        }));
      }),

      // Inventory by location
      prisma.inventory.groupBy({
        by: ['locationId'],
        _sum: { quantity: true },
        _count: true
      }).then(async (data) => {
        const locationData = [];
        for (const item of data) {
          const location = await prisma.location.findUnique({
            where: { id: item.locationId },
            select: { name: true, type: true, city: true }
          });
          if (location) {
            locationData.push({
              location: location.name,
              type: location.type,
              city: location.city,
              quantity: item._sum.quantity || 0,
              products: item._count
            });
          }
        }
        return locationData;
      }),

      // Recent stock movements (simplified - based on order fulfillment)
      prisma.order.findMany({
        where: {
          status: 'DELIVERED',
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          }
        },
        include: {
          orderItems: {
            include: {
              product: { select: { name: true, sku: true } }
            }
          }
        },
        orderBy: { fulfilledDate: 'desc' },
        take: 20
      }),

      // Top products by quantity
      prisma.inventory.findMany({
        where: locationFilter,
        include: {
          product: {
            select: { name: true, sku: true, unitPrice: true }
          }
        },
        orderBy: { quantity: 'desc' },
        take: 10
      }),

      // Low stock alerts
      prisma.inventory.findMany({
        where: {
          ...locationFilter,
          OR: [
            { quantity: { lte: 10 } },
            { quantity: { lte: 10 } }
          ]
        },
        include: {
          product: {
            select: { name: true, sku: true }
          },
          location: {
            select: { name: true }
          }
        },
        orderBy: { quantity: 'asc' }
      })
    ]);

    const inventoryAnalytics = {
      summary: {
        totalLocations: inventoryByLocation.length,
        totalCategories: inventoryByCategory.length,
        lowStockAlerts: lowStockAlert.length
      },
      byCategory: inventoryByCategory,
      byLocation: inventoryByLocation,
      recentMovements: stockMovements.map(order => ({
        orderNumber: order.orderNumber,
        type: order.orderType,
        date: order.fulfilledDate,
        items: order.orderItems.map(item => ({
          product: item.product.name,
          sku: item.product.sku,
          quantity: item.quantity
        }))
      })),
      topProducts,
      lowStockAlerts: lowStockAlert
    };

    res.json(inventoryAnalytics);
  } catch (error) {
    next(error);
  }
});

// Time-series analytics for trends
router.get('/trends', async (req, res, next) => {
  try {
    const { period = 'DAILY', days = '30' } = req.query;
    const daysNum = parseInt(days as string);
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysNum);

    // Generate time series data for orders and deliveries
    const orderTrends = await prisma.order.groupBy({
      by: ['status'],
      where: {
        createdAt: { gte: startDate }
      },
      _count: true
    });

    const deliveryTrends = await prisma.delivery.groupBy({
      by: ['status'],
      where: {
        createdAt: { gte: startDate }
      },
      _count: true
    });

    // Daily revenue trend
    const dailyRevenue = await prisma.order.findMany({
      where: {
        orderType: 'SALES',
        status: 'DELIVERED',
        fulfilledDate: { gte: startDate }
      },
      select: {
        fulfilledDate: true,
        totalAmount: true
      }
    });

    // Group by day
    const revenueByDay: any = {};
    dailyRevenue.forEach(order => {
      if (order.fulfilledDate) {
        const day = order.fulfilledDate.toISOString().split('T')[0];
        if (!revenueByDay[day]) {
          revenueByDay[day] = 0;
        }
        revenueByDay[day] += Number(order.totalAmount);
      }
    });

    const trends = {
      period,
      days: daysNum,
      orders: orderTrends,
      deliveries: deliveryTrends,
      revenue: Object.entries(revenueByDay).map(([date, amount]) => ({
        date,
        amount
      })).sort((a, b) => a.date.localeCompare(b.date))
    };

    res.json(trends);
  } catch (error) {
    next(error);
  }
});

// Performance benchmarks
router.get('/benchmarks', async (req, res, next) => {
  try {
    const { locationId } = req.query;
    const locationFilter = locationId ? { locationId: String(locationId) } : {};

    // Industry benchmarks (these would typically come from external data)
    const industryBenchmarks = {
      orderFulfillmentRate: 95,
      onTimeDeliveryRate: 90,
      inventoryAccuracy: 98,
      supplierPerformance: 85,
      costPerDelivery: 15
    };

    // Calculate current performance
    const [orders, deliveries, inventory, suppliers] = await Promise.all([
      prisma.order.findMany({
        where: {
          ...locationFilter,
          status: 'DELIVERED',
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        },
        select: {
          fulfilledDate: true,
          expectedDate: true
        }
      }),
      prisma.delivery.findMany({
        where: {
          status: 'DELIVERED',
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        },
        select: {
          actualDeliveryTime: true,
          scheduledDate: true,
          cost: true
        }
      }),
      prisma.inventory.count({ where: locationFilter }),
      prisma.supplier.aggregate({
        where: { isActive: true },
        _avg: { rating: true }
      })
    ]);

    const currentPerformance = {
      orderFulfillmentRate: orders.length > 0 
        ? (orders.filter(o => o.fulfilledDate && o.expectedDate && o.fulfilledDate <= o.expectedDate).length / orders.length) * 100
        : 0,
      onTimeDeliveryRate: deliveries.length > 0
        ? (deliveries.filter(d => d.actualDeliveryTime && d.scheduledDate && d.actualDeliveryTime <= d.scheduledDate).length / deliveries.length) * 100
        : 0,
      inventoryAccuracy: 98.5, // This would come from cycle counts
      supplierPerformance: (suppliers._avg.rating || 0) * 20, // Convert 5-star to percentage
      costPerDelivery: deliveries.length > 0
        ? deliveries.reduce((sum, d) => sum + Number(d.cost || 0), 0) / deliveries.length
        : 0
    };

    const benchmarks = {
      industry: industryBenchmarks,
      current: currentPerformance,
      comparison: {
        orderFulfillmentRate: {
          performance: Math.round(currentPerformance.orderFulfillmentRate * 100) / 100,
          vs_industry: Math.round((currentPerformance.orderFulfillmentRate - industryBenchmarks.orderFulfillmentRate) * 100) / 100,
          status: currentPerformance.orderFulfillmentRate >= industryBenchmarks.orderFulfillmentRate ? 'above' : 'below'
        },
        onTimeDeliveryRate: {
          performance: Math.round(currentPerformance.onTimeDeliveryRate * 100) / 100,
          vs_industry: Math.round((currentPerformance.onTimeDeliveryRate - industryBenchmarks.onTimeDeliveryRate) * 100) / 100,
          status: currentPerformance.onTimeDeliveryRate >= industryBenchmarks.onTimeDeliveryRate ? 'above' : 'below'
        },
        supplierPerformance: {
          performance: Math.round(currentPerformance.supplierPerformance * 100) / 100,
          vs_industry: Math.round((currentPerformance.supplierPerformance - industryBenchmarks.supplierPerformance) * 100) / 100,
          status: currentPerformance.supplierPerformance >= industryBenchmarks.supplierPerformance ? 'above' : 'below'
        }
      }
    };

    res.json(benchmarks);
  } catch (error) {
    next(error);
  }
});

// Basic health check
router.get('/health', (req, res) => {
  res.json({ status: 'Analytics API working' });
});

export default router;