"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const morgan_1 = __importDefault(require("morgan"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const dotenv_1 = __importDefault(require("dotenv"));
// Import routes
const auth_1 = __importDefault(require("./routes/auth"));
const inventory_1 = __importDefault(require("./routes/inventory"));
const orders_1 = __importDefault(require("./routes/orders"));
const delivery_1 = __importDefault(require("./routes/delivery"));
const analytics_1 = __importDefault(require("./routes/analytics"));
const suppliers_1 = __importDefault(require("./routes/suppliers"));
const locations_1 = __importDefault(require("./routes/locations"));
// Import middleware
const errorHandler_1 = require("./middleware/errorHandler");
const auth_2 = require("./middleware/auth");
dotenv_1.default.config();
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
// Socket.IO setup for real-time updates
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: process.env.CORS_ORIGIN || "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});
exports.io = io;
// Middleware
app.use((0, helmet_1.default)());
app.use((0, compression_1.default)());
app.use((0, morgan_1.default)('combined'));
app.use((0, cors_1.default)({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true
}));
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
// Make io accessible in routes
app.set('io', io);
// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});
// API Routes
app.use('/api/auth', auth_1.default);
app.use('/api/inventory', auth_2.authenticateToken, inventory_1.default);
app.use('/api/orders', auth_2.authenticateToken, orders_1.default);
app.use('/api/delivery', auth_2.authenticateToken, delivery_1.default);
app.use('/api/analytics', auth_2.authenticateToken, analytics_1.default);
app.use('/api/suppliers', auth_2.authenticateToken, suppliers_1.default);
app.use('/api/locations', auth_2.authenticateToken, locations_1.default);
// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    socket.on('join-warehouse', (warehouseId) => {
        socket.join(`warehouse-${warehouseId}`);
        console.log(`Client ${socket.id} joined warehouse ${warehouseId}`);
    });
    socket.on('join-delivery', (deliveryId) => {
        socket.join(`delivery-${deliveryId}`);
        console.log(`Client ${socket.id} joined delivery ${deliveryId}`);
    });
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});
// Error handling middleware
app.use(errorHandler_1.errorHandler);
// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Route not found' });
});
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
    console.log(`🚀 Supply Chain Management Server running on port ${PORT}`);
    console.log(`📊 Health check available at http://localhost:${PORT}/health`);
});
