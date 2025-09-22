import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';

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

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
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
    return res.status(413).json({ error: 'File too large' });
  }
  
  return res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use((req, res) => {
  return res.status(404).json({ error: 'Route not found' });
});

// Start server
httpServer.listen(PORT, () => {
  console.log(`🚀 MapVue server running on port ${PORT}`);
  console.log(`📡 Socket.io enabled for real-time features`);
  console.log(`🌍 CORS enabled for: ${process.env.CORS_ORIGIN || "http://localhost:5173"}`);
  console.log(`🛡️  Security headers enabled`);
});

export default app;