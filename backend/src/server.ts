import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';

// Import database connection
import { initializeDatabase } from './database/connection';

// Import routes
import gisRoutes from './routes/gis';
import authRoutes from './routes/auth';
import uploadRoutes from './routes/upload';

// Load environment variables
dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

const DEFAULT_PORT = parseInt(process.env.PORT || '3001', 10);
const MAX_PORT_ATTEMPTS = 5;

// Initialize database connection
async function initializeApp() {
  try {
    console.log('🔌 Initializing database connection...');
    const db = initializeDatabase();
    
    // Test database connection
    const isHealthy = await db.healthCheck();
    if (!isHealthy) {
      throw new Error('Database health check failed');
    }
    
    // Check PostGIS extension
    const hasPostGIS = await db.checkPostGIS();
    if (!hasPostGIS) {
      console.warn('⚠️  PostGIS extension not found. Some spatial features may not work.');
    } else {
      console.log('🗺️  PostGIS extension detected and ready');
    }
    
    console.log('✅ Database connection established successfully');
    return true;
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    console.error('💡 PostgreSQL may not be installed or configured');
    console.error('� See database/SETUP_INSTRUCTIONS.md for setup guide');
    console.warn('⚠️  Starting server without database connection');
    return false;
  }
}

// Security middleware
app.use(helmet({
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

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:5173",
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Log all requests and responses for /api/gis/layers for debugging
app.use('/api/gis/layers', (req, res, next) => {
  console.log(`[GIS LAYERS] ${req.method} ${req.originalUrl}`);
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);

  const originalSend = res.send;
  res.send = function (body) {
    console.log(`[GIS LAYERS RESPONSE] Status: ${res.statusCode}`);
    try {
      console.log('Response Body:', typeof body === 'string' ? body : JSON.stringify(body));
    } catch (e) {
      console.log('Response Body:', body);
    }
    // @ts-ignore
    return originalSend.call(this, body);
  };
  next();
});

// Add this before your API routes to log all GIS route errors
app.use('/api/gis', async (req, res, next) => {
  try {
    // ...existing code...
    next();
  } catch (err) {
    console.error(`[GIS ROUTE ERROR] ${req.method} ${req.originalUrl}`);
    if (err instanceof Error) {
      console.error(err.stack);
    } else {
      console.error(err);
    }
    next(err);
  }
});

// API routes
app.use('/api/gis', gisRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);

// Add this after app.use('/api/gis', gisRoutes); to log errors from GIS routes
app.use('/api/gis', (err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(`[GIS ROUTE ERROR HANDLER] ${req.method} ${req.originalUrl}`);
  if (err instanceof Error) {
    console.error(err.stack);
  } else {
    console.error(err);
  }
  next(err);
});

// Health check endpoint with database status
app.get('/health', async (req, res) => {
  try {
    const db = initializeDatabase();
    const isHealthy = await db.healthCheck();
    
    res.json({ 
      status: isHealthy ? 'OK' : 'DEGRADED',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: isHealthy ? 'connected' : 'disconnected'
    });
  } catch (error) {
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'not_configured',
      message: 'Server running without database - PostgreSQL setup required'
    });
  }
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join a project room
  socket.on('join-project', (projectId) => {
    socket.join(`project-${projectId}`);
    console.log(`User ${socket.id} joined project ${projectId}`);
  });

  // Leave a project room
  socket.on('leave-project', (projectId) => {
    socket.leave(`project-${projectId}`);
    console.log(`User ${socket.id} left project ${projectId}`);
  });

  // Real-time feature creation
  socket.on('feature-created', (data) => {
    socket.to(`project-${data.projectId}`).emit('feature-created', data);
  });

  // Real-time feature updates
  socket.on('feature-updated', (data) => {
    socket.to(`project-${data.projectId}`).emit('feature-updated', data);
  });

  // Real-time feature deletion
  socket.on('feature-deleted', (data) => {
    socket.to(`project-${data.projectId}`).emit('feature-deleted', data);
  });

  // Real-time layer updates
  socket.on('layer-updated', (data) => {
    socket.to(`project-${data.projectId}`).emit('layer-updated', data);
  });

  // Cursor tracking for collaborative editing
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

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
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

// 404 handler
app.use((req, res) => {
  return res.status(404).json({ 
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Route not found'
    }
  });
});

// Export io for use in routes
export { io };

// Start server
async function startServer(port = DEFAULT_PORT, attempt = 1) {
  const dbConnected = await initializeApp();

  const server = app.listen(port, () => {
    console.log(`🚀 MapVue server running on port ${port}`);
    console.log(`📡 Socket.io enabled for real-time features`);
    console.log(`🌍 CORS enabled for: ${process.env.CORS_ORIGIN || "http://localhost:5173"}`);
    console.log(`🛡️  Security headers enabled`);
    
    if (dbConnected) {
      console.log(`🗄️  Database: Connected and ready`);
    } else {
      console.log(`⚠️  Database: Not configured - see database/SETUP_INSTRUCTIONS.md`);
    }
    
    console.log(`📍 Health check: http://localhost:${port}/health`);
  });

  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      if (attempt < MAX_PORT_ATTEMPTS) {
        const nextPort = port + 1;
        console.error(`❌ Port ${port} is already in use. Trying port ${nextPort}...`);
        setTimeout(() => startServer(nextPort, attempt + 1), 500);
      } else {
        console.error(`❌ All attempted ports (${DEFAULT_PORT}-${DEFAULT_PORT + MAX_PORT_ATTEMPTS - 1}) are in use. Exiting.`);
        process.exit(1);
      }
    } else {
      throw err;
    }
  });
}

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

// Add global error handlers at the end of the file, before export default app
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

// Reminder: If using Express <5, unhandled promise rejections in routes may not be caught.
// Make sure all async route handlers in gisRoutes use next(err) on error.