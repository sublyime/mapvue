"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const dotenv_1 = __importDefault(require("dotenv"));
const connection_js_1 = require("./database/connection.js");
const gis_1 = __importDefault(require("./routes/gis"));
const auth_1 = __importDefault(require("./routes/auth"));
const upload_1 = __importDefault(require("./routes/upload"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: process.env.CORS_ORIGIN || "http://localhost:5173",
        methods: ["GET", "POST", "PUT", "DELETE"]
    }
});
exports.io = io;
const PORT = process.env.PORT || 3001;
async function initializeApp() {
    try {
        console.log('🔌 Initializing database connection...');
        const db = (0, connection_js_1.initializeDatabase)();
        const isHealthy = await db.healthCheck();
        if (!isHealthy) {
            throw new Error('Database health check failed');
        }
        const hasPostGIS = await db.checkPostGIS();
        if (!hasPostGIS) {
            console.warn('⚠️  PostGIS extension not found. Some spatial features may not work.');
        }
        else {
            console.log('🗺️  PostGIS extension detected and ready');
        }
        console.log('✅ Database connection established successfully');
    }
    catch (error) {
        console.error('❌ Database initialization failed:', error);
        console.error('💡 Make sure PostgreSQL is running and database is set up');
        console.error('🔧 Run: npm run db:setup to initialize the database');
        process.exit(1);
    }
}
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https:", "blob:"],
            scriptSrc: ["'self'"],
            connectSrc: ["'self'", "ws:", "wss:"],
        },
    },
}));
app.use((0, cors_1.default)({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true
}));
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);
app.use(express_1.default.json({ limit: '50mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '50mb' }));
app.use('/api/gis', gis_1.default);
app.use('/api/auth', auth_1.default);
app.use('/api/upload', upload_1.default);
app.get('/health', async (req, res) => {
    try {
        const db = (0, connection_js_1.initializeDatabase)();
        const isHealthy = await db.healthCheck();
        res.json({
            status: isHealthy ? 'OK' : 'DEGRADED',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            database: isHealthy ? 'connected' : 'disconnected'
        });
    }
    catch (error) {
        res.status(500).json({
            status: 'ERROR',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            database: 'error',
            error: 'Database connection failed'
        });
    }
});
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    socket.on('join-project', (projectId) => {
        socket.join(`project-${projectId}`);
        console.log(`User ${socket.id} joined project ${projectId}`);
    });
    socket.on('leave-project', (projectId) => {
        socket.leave(`project-${projectId}`);
        console.log(`User ${socket.id} left project ${projectId}`);
    });
    socket.on('feature-created', (data) => {
        socket.to(`project-${data.projectId}`).emit('feature-created', data);
    });
    socket.on('feature-updated', (data) => {
        socket.to(`project-${data.projectId}`).emit('feature-updated', data);
    });
    socket.on('feature-deleted', (data) => {
        socket.to(`project-${data.projectId}`).emit('feature-deleted', data);
    });
    socket.on('layer-updated', (data) => {
        socket.to(`project-${data.projectId}`).emit('layer-updated', data);
    });
    socket.on('cursor-move', (data) => {
        socket.to(`project-${data.projectId}`).emit('cursor-move', {
            userId: socket.id,
            ...data
        });
    });
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});
app.use((err, req, res, next) => {
    console.error('Error:', err);
    if (err.type === 'entity.too.large') {
        return res.status(413).json({
            success: false,
            error: {
                code: 'FILE_TOO_LARGE',
                message: 'File too large'
            }
        });
    }
    return res.status(500).json({
        success: false,
        error: {
            code: 'INTERNAL_ERROR',
            message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
        }
    });
});
app.use((req, res) => {
    return res.status(404).json({
        success: false,
        error: {
            code: 'NOT_FOUND',
            message: 'Route not found'
        }
    });
});
async function startServer() {
    await initializeApp();
    httpServer.listen(PORT, () => {
        console.log(`🚀 MapVue server running on port ${PORT}`);
        console.log(`📡 Socket.io enabled for real-time features`);
        console.log(`🌍 CORS enabled for: ${process.env.CORS_ORIGIN || "http://localhost:5173"}`);
        console.log(`🛡️  Security headers enabled`);
        console.log(`🗄️  Database: Connected and ready`);
        console.log(`📍 Health check: http://localhost:${PORT}/health`);
    });
}
startServer().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
});
exports.default = app;
//# sourceMappingURL=server_new.js.map