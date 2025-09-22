import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';

// Import database connection
import { initializeDatabase } from './database/connection.js';

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

const PORT = process.env.PORT || 3001;

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
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    console.error('💡 Make sure PostgreSQL is running and database is set up');
    console.error('🔧 Run: npm run db:setup to initialize the database');
    process.exit(1);
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

// API routes
app.use('/api/gis', gisRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);

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
    res.status(500).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'error',
      error: 'Database connection failed'
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

export default app;