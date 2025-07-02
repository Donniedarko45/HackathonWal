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
const inventoryCreateSchema = zod_1.z.object({
    productId: zod_1.z.string().uuid(),
    locationId: zod_1.z.string().uuid(),
    quantity: zod_1.z.number().int().min(0),
    reorderPoint: zod_1.z.number().int().min(0).optional()
});
const inventoryUpdateSchema = zod_1.z.object({
    quantity: zod_1.z.number().int().min(0).optional(),
    reservedQty: zod_1.z.number().int().min(0).optional(),
    reorderPoint: zod_1.z.number().int().min(0).optional()
});
// Get all inventory items with filters
router.get('/', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { locationId, productId, lowStock = 'false', page = '1', limit = '20', search } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const offset = (pageNum - 1) * limitNum;
        const where = {};
        if (locationId)
            where.locationId = locationId;
        if (productId)
            where.productId = productId;
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
                    { name: { contains: search, mode: 'insensitive' } },
                    { sku: { contains: search, mode: 'insensitive' } }
                ]
            };
        }
        const [inventory, total] = yield Promise.all([
            prisma_1.prisma.inventory.findMany({
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
            prisma_1.prisma.inventory.count({ where })
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
    }
    catch (error) {
        next(error);
    }
}));
// Get inventory by ID
router.get('/:id', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const inventory = yield prisma_1.prisma.inventory.findUnique({
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
    }
    catch (error) {
        next(error);
    }
}));
// Create new inventory item
router.post('/', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = inventoryCreateSchema.parse(req.body);
        // Check if inventory already exists for this product and location
        const existingInventory = yield prisma_1.prisma.inventory.findUnique({
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
        const inventory = yield prisma_1.prisma.inventory.create({
            data: Object.assign(Object.assign({}, data), { reorderPoint: data.reorderPoint || 50 }),
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
    }
    catch (error) {
        next(error);
    }
}));
// Update inventory
router.put('/:id', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const data = inventoryUpdateSchema.parse(req.body);
        const inventory = yield prisma_1.prisma.inventory.update({
            where: { id },
            data: Object.assign(Object.assign({}, data), { lastUpdated: new Date() }),
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
    }
    catch (error) {
        next(error);
    }
}));
// Adjust inventory (add/subtract stock)
router.post('/:id/adjust', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { adjustment, reason } = req.body;
        if (!adjustment || typeof adjustment !== 'number') {
            return res.status(400).json({ error: 'Valid adjustment number required' });
        }
        const inventory = yield prisma_1.prisma.inventory.findUnique({
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
        const updatedInventory = yield prisma_1.prisma.inventory.update({
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
        res.json(Object.assign(Object.assign({}, updatedInventory), { adjustment,
            reason, previousQuantity: inventory.quantity }));
    }
    catch (error) {
        next(error);
    }
}));
// Get low stock items
router.get('/alerts/low-stock', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { locationId } = req.query;
        const where = {
            OR: [
                { quantity: { lte: 10 } },
                { quantity: { lte: 10 } }
            ]
        };
        if (locationId) {
            where.locationId = locationId;
        }
        const lowStockItems = yield prisma_1.prisma.inventory.findMany({
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
    }
    catch (error) {
        next(error);
    }
}));
// Delete inventory item
router.delete('/:id', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const inventory = yield prisma_1.prisma.inventory.findUnique({
            where: { id },
            select: { locationId: true }
        });
        if (!inventory) {
            return res.status(404).json({ error: 'Inventory item not found' });
        }
        yield prisma_1.prisma.inventory.delete({
            where: { id }
        });
        // Emit real-time update
        const io = req.app.get('io');
        io.to(`warehouse-${inventory.locationId}`).emit('inventory-update', {
            type: 'inventory-deleted',
            inventoryId: id
        });
        res.json({ message: 'Inventory item deleted successfully' });
    }
    catch (error) {
        next(error);
    }
}));
exports.default = router;
