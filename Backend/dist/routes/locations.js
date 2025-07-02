"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const router = express_1.default.Router();
// Validation schemas
const locationCreateSchema = zod_1.z.object({
    name: zod_1.z.string().min(2),
    address: zod_1.z.string(),
    city: zod_1.z.string(),
    state: zod_1.z.string(),
    zipCode: zod_1.z.string(),
    latitude: zod_1.z.number().optional(),
    longitude: zod_1.z.number().optional(),
    type: zod_1.z.enum(['WAREHOUSE', 'STORE', 'DISTRIBUTION_CENTER', 'SUPPLIER'])
});
const locationUpdateSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).optional(),
    address: zod_1.z.string().optional(),
    city: zod_1.z.string().optional(),
    state: zod_1.z.string().optional(),
    zipCode: zod_1.z.string().optional(),
    latitude: zod_1.z.number().optional(),
    longitude: zod_1.z.number().optional(),
    type: zod_1.z.enum(['WAREHOUSE', 'STORE', 'DISTRIBUTION_CENTER', 'SUPPLIER']).optional()
});
// Get all locations with filters
router.get('/', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { type, city, state, search, page = '1', limit = '20' } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const offset = (pageNum - 1) * limitNum;
        const where = {};
        if (type)
            where.type = type;
        if (city)
            where.city = city;
        if (state)
            where.state = state;
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { address: { contains: search, mode: 'insensitive' } },
                { city: { contains: search, mode: 'insensitive' } }
            ];
        }
        const [locations, total] = yield Promise.all([
            prisma_1.prisma.location.findMany({
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
            prisma_1.prisma.location.count({ where })
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
    }
    catch (error) {
        next(error);
    }
}));
// Get location by ID
router.get('/:id', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const location = yield prisma_1.prisma.location.findUnique({
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
    }
    catch (error) {
        next(error);
    }
}));
// Create new location
router.post('/', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = locationCreateSchema.parse(req.body);
        const location = yield prisma_1.prisma.location.create({
            data
        });
        res.status(201).json(location);
    }
    catch (error) {
        next(error);
    }
}));
// Update location
router.put('/:id', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const data = locationUpdateSchema.parse(req.body);
        const location = yield prisma_1.prisma.location.update({
            where: { id },
            data: Object.assign(Object.assign({}, data), { updatedAt: new Date() })
        });
        res.json(location);
    }
    catch (error) {
        next(error);
    }
}));
// Get location inventory summary
router.get('/:id/inventory-summary', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const location = yield prisma_1.prisma.location.findUnique({
            where: { id },
            select: { name: true, type: true }
        });
        if (!location) {
            return res.status(404).json({ error: 'Location not found' });
        }
        const [totalProducts, totalQuantity, lowStockItems, outOfStockItems, totalValue] = yield Promise.all([
            prisma_1.prisma.inventory.count({
                where: { locationId: id }
            }),
            prisma_1.prisma.inventory.aggregate({
                where: { locationId: id },
                _sum: { quantity: true }
            }),
            prisma_1.prisma.inventory.count({
                where: {
                    locationId: id,
                    OR: [
                        { quantity: { lte: 10 } },
                        { quantity: { lte: 10 } }
                    ]
                }
            }),
            prisma_1.prisma.inventory.count({
                where: {
                    locationId: id,
                    quantity: 0
                }
            }),
            prisma_1.prisma.inventory.findMany({
                where: { locationId: id },
                include: {
                    product: { select: { unitPrice: true } }
                }
            }).then(items => items.reduce((sum, item) => sum + (item.quantity * Number(item.product.unitPrice)), 0))
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
    }
    catch (error) {
        next(error);
    }
}));
// Get location analytics
router.get('/:id/analytics', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { startDate, endDate } = req.query;
        const where = { locationId: id };
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate)
                where.createdAt.gte = new Date(startDate);
            if (endDate)
                where.createdAt.lte = new Date(endDate);
        }
        const [totalOrders, ordersByType, ordersByStatus, totalRevenue, inventoryTurnover] = yield Promise.all([
            prisma_1.prisma.order.count({ where }),
            prisma_1.prisma.order.groupBy({
                by: ['orderType'],
                where,
                _count: true
            }),
            prisma_1.prisma.order.groupBy({
                by: ['status'],
                where,
                _count: true
            }),
            prisma_1.prisma.order.aggregate({
                where: Object.assign(Object.assign({}, where), { orderType: 'SALES' }),
                _sum: { totalAmount: true }
            }),
            // Simplified inventory turnover calculation
            prisma_1.prisma.inventory.aggregate({
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
    }
    catch (error) {
        next(error);
    }
}));
// Get nearby locations (requires latitude/longitude)
router.get('/:id/nearby', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { radius = '50' } = req.query; // radius in kilometers
        const radiusKm = parseFloat(radius);
        const currentLocation = yield prisma_1.prisma.location.findUnique({
            where: { id },
            select: { latitude: true, longitude: true, name: true }
        });
        if (!currentLocation || !currentLocation.latitude || !currentLocation.longitude) {
            return res.status(400).json({
                error: 'Location coordinates not available for proximity search'
            });
        }
        // Simple distance calculation (in a real app, you'd use a spatial database or service)
        const locations = yield prisma_1.prisma.location.findMany({
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
            const distance = calculateDistance(currentLocation.latitude, currentLocation.longitude, location.latitude, location.longitude);
            return Object.assign(Object.assign({}, location), { distance: Math.round(distance * 100) / 100 });
        })
            .filter(location => location.distance <= radiusKm)
            .sort((a, b) => a.distance - b.distance);
        res.json({
            currentLocation: currentLocation.name,
            radius: radiusKm,
            nearbyLocations
        });
    }
    catch (error) {
        next(error);
    }
}));
// Calculate distance between two points (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}
// Get locations by type
router.get('/type/:type', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { type } = req.params;
        const validTypes = ['WAREHOUSE', 'STORE', 'DISTRIBUTION_CENTER', 'SUPPLIER'];
        if (!validTypes.includes(type.toUpperCase())) {
            return res.status(400).json({ error: 'Invalid location type' });
        }
        const locations = yield prisma_1.prisma.location.findMany({
            where: { type: type.toUpperCase() },
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
    }
    catch (error) {
        next(error);
    }
}));
exports.default = router;
