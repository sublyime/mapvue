# MapVue Backend API

Professional Node.js backend for the MapVue GIS application, providing comprehensive spatial data management, authentication, file operations, and real-time collaboration features.

## 🏗️ Overview

The MapVue backend is a robust Express.js application built with TypeScript, featuring PostgreSQL with PostGIS for spatial data storage, JWT authentication, file upload handling, and Socket.io for real-time collaboration. It provides a complete REST API for the macOS-style GIS frontend application.

## ✨ Key Features

### 🔐 Authentication & Security
- **JWT Token Authentication** - Secure user sessions with refresh tokens
- **Password Hashing** - bcrypt for secure password storage
- **Rate Limiting** - Prevent abuse and DDoS attacks
- **CORS Configuration** - Secure cross-origin resource sharing
- **Input Validation** - Comprehensive request validation and sanitization
- **SQL Injection Protection** - Parameterized queries and ORM security

### 🗺️ GIS Data Management
- **Full CRUD Operations** - Complete Create, Read, Update, Delete for all spatial data
- **Spatial Queries** - Advanced PostGIS spatial analysis and queries
- **Geometry Validation** - Ensure all geometric data is valid and properly formatted
- **Coordinate System Support** - Transform between different projection systems
- **Spatial Indexing** - Optimized spatial indexes for fast query performance
- **Bulk Operations** - Efficient handling of large datasets

### 📁 File Operations
- **Multi-format Support** - Import/export GeoJSON, KML, GPX, Shapefile formats
- **Drag & Drop Uploads** - Seamless file upload with progress tracking
- **File Validation** - Comprehensive format and content validation
- **Metadata Extraction** - Extract and store file metadata and properties
- **Batch Processing** - Handle multiple files simultaneously
- **Storage Management** - Efficient file storage and cleanup

### 🚀 Real-time Collaboration
- **Socket.io Integration** - WebSocket connections for live updates
- **Room Management** - Project-based collaboration rooms
- **Presence Tracking** - Track active users and their activities
- **Change Broadcasting** - Real-time feature and layer updates
- **Conflict Resolution** - Handle simultaneous edits gracefully
- **Event History** - Track and replay collaboration events

### 📊 Performance & Monitoring
- **Connection Pooling** - Efficient database connection management
- **Query Optimization** - Optimized SQL queries with proper indexing
- **Health Monitoring** - Comprehensive health checks and status reporting
- **Error Logging** - Detailed error tracking and debugging information
- **Performance Metrics** - Track response times and system performance

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 15+ with PostGIS extension
- Git for version control

### Installation

```bash
# Clone repository (if not already done)
git clone https://github.com/sublyime/mapvue.git
cd mapvue/backend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database credentials

# Set up database (automated)
cd database
.\setup.ps1  # Windows PowerShell
# or
npm run db:setup  # Cross-platform

# Start development server
npm run dev
```

### Environment Configuration

Create a `.env` file in the backend directory:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mapvue
DB_USER=postgres
DB_PASSWORD=your_postgres_password

# Server Configuration
PORT=3001
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# File Upload Configuration
UPLOAD_MAX_SIZE=10485760  # 10MB
UPLOAD_ALLOWED_TYPES=.geojson,.json,.kml,.gpx,.shp,.zip

# CORS Configuration
CORS_ORIGIN=http://localhost:5173
CORS_CREDENTIALS=true

# Rate Limiting
RATE_LIMIT_WINDOW=15  # minutes
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
LOG_FILE=logs/mapvue.log
```

## 🏗️ Architecture

### Project Structure
```
backend/
├── src/
│   ├── routes/              # Express route handlers
│   │   ├── auth.ts         # Authentication endpoints
│   │   ├── gis.ts          # GIS data operations
│   │   └── upload.ts       # File upload handling
│   ├── models/             # Database models and schemas
│   │   ├── User.ts         # User model with authentication
│   │   ├── Project.ts      # Project model with spatial bounds
│   │   ├── Layer.ts        # Layer model with styling
│   │   └── Feature.ts      # Feature model with PostGIS geometry
│   ├── database/           # Database connection and configuration
│   │   └── connection.ts   # PostgreSQL + PostGIS connection
│   ├── middleware/         # Express middleware functions
│   │   ├── auth.ts         # JWT authentication middleware
│   │   ├── validation.ts   # Request validation middleware
│   │   └── rateLimit.ts    # Rate limiting middleware
│   ├── services/           # Business logic services
│   │   ├── authService.ts  # Authentication logic
│   │   ├── gisService.ts   # GIS operations service
│   │   └── uploadService.ts # File processing service
│   ├── utils/              # Utility functions
│   │   ├── gisImport.ts    # GIS file import utilities
│   │   ├── upload.ts       # File handling utilities
│   │   └── spatial.ts      # Spatial analysis utilities
│   ├── types/              # TypeScript type definitions
│   │   └── database.ts     # Database schema types
│   └── server.ts           # Main Express application
├── database/               # Database setup and migrations
│   ├── schema.sql          # Database schema definition
│   ├── setup.ps1           # Windows setup script
│   ├── setup.sh            # Linux/Mac setup script
│   └── migrations/         # Database migration files
└── logs/                   # Application log files
```

### Database Models

#### User Model
```typescript
interface User {
  id: string;              // UUID primary key
  username: string;        // Unique username
  email: string;          // Email address
  passwordHash: string;   // Hashed password
  fullName: string;       // Display name
  isActive: boolean;      // Account status
  lastLogin: Date;        // Last login timestamp
  preferences: object;    // User preferences JSON
  createdAt: Date;        // Account creation timestamp
  updatedAt: Date;        // Last update timestamp
}
```

#### Project Model
```typescript
interface Project {
  id: string;             // UUID primary key
  name: string;           // Project name
  description: string;    // Project description
  bounds: Geometry;       // PostGIS geometry for project bounds
  isPublic: boolean;      // Public visibility flag
  userId: string;         // Owner user ID
  collaborators: string[]; // Array of collaborator user IDs
  settings: object;       // Project settings JSON
  createdAt: Date;        // Creation timestamp
  updatedAt: Date;        // Last update timestamp
}
```

#### Layer Model
```typescript
interface Layer {
  id: string;             // UUID primary key
  name: string;           // Layer name
  description: string;    // Layer description
  layerType: 'vector' | 'raster' | 'tile'; // Layer type
  style: object;          // Layer styling JSON
  isVisible: boolean;     // Visibility flag
  opacity: number;        // Opacity value (0-1)
  zIndex: number;         // Drawing order
  bounds: Geometry;       // PostGIS geometry for layer bounds
  projectId: string;      // Parent project ID
  createdAt: Date;        // Creation timestamp
  updatedAt: Date;        // Last update timestamp
}
```

#### Feature Model
```typescript
interface Feature {
  id: string;             // UUID primary key
  geometry: Geometry;     // PostGIS geometry
  properties: object;     // Feature properties JSON
  style: object;          // Feature-specific styling JSON
  layerId: string;        // Parent layer ID
  createdBy: string;      // Creator user ID
  updatedBy: string;      // Last editor user ID
  version: number;        // Version for conflict resolution
  createdAt: Date;        // Creation timestamp
  updatedAt: Date;        // Last update timestamp
}
```

## 🛠️ API Endpoints

### Authentication Routes (`/api/auth`)
- `POST /register` - Create new user account
- `POST /login` - Authenticate user and get JWT token
- `POST /refresh` - Refresh JWT token
- `GET /profile` - Get current user profile
- `PUT /profile` - Update user profile
- `POST /logout` - Logout and invalidate token

### GIS Data Routes (`/api/gis`)
- `GET /projects` - List user's projects
- `POST /projects` - Create new project
- `GET /projects/:id` - Get specific project
- `PUT /projects/:id` - Update project
- `DELETE /projects/:id` - Delete project
- `GET /projects/:id/layers` - Get project layers
- `POST /projects/:id/layers` - Create layer in project
- `GET /layers/:id/features` - Get layer features
- `POST /layers/:id/features` - Create feature in layer
- `PUT /features/:id` - Update feature
- `DELETE /features/:id` - Delete feature

### File Upload Routes (`/api/upload`)
- `POST /gis` - Upload and import GIS files
- `GET /formats` - Get supported file formats
- `POST /validate` - Validate file without importing
- `GET /history` - Get upload history
- `DELETE /files/:id` - Delete uploaded file

### Spatial Query Routes (`/api/spatial`)
- `POST /intersects` - Find intersecting features
- `POST /within` - Find features within distance
- `POST /buffer` - Create buffer around features
- `POST /union` - Union multiple geometries
- `POST /difference` - Calculate geometry difference

### Health Check (`/api/health`)
- `GET /` - Get system health status
- `GET /database` - Check database connectivity
- `GET /services` - Check all service statuses

## 🔧 Development

### Available Scripts
```bash
# Development
npm run dev          # Start development server with hot reload
npm run build        # Build TypeScript to JavaScript
npm run start        # Start production server

# Testing
npm run test         # Run unit tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Generate coverage report
npm run test:e2e     # Run end-to-end tests

# Database
npm run db:setup     # Set up database schema
npm run db:migrate   # Run database migrations
npm run db:seed      # Seed database with sample data
npm run db:reset     # Reset database (development only)

# Code Quality
npm run lint         # Run ESLint
npm run format       # Format code with Prettier
npm run type-check   # TypeScript type checking
```

### Development Workflow

1. **Start Database**: Ensure PostgreSQL with PostGIS is running
2. **Install Dependencies**: Run `npm install`
3. **Environment Setup**: Configure `.env` file
4. **Database Setup**: Run `npm run db:setup`
5. **Start Server**: Run `npm run dev`
6. **Test API**: Use Postman or curl to test endpoints

### Debugging

#### Enable Debug Logging
```env
LOG_LEVEL=debug
NODE_ENV=development
```

#### Database Query Logging
```typescript
// In connection.ts
const pool = new Pool({
  // ... other config
  log: (query, params) => {
    console.log('SQL Query:', query);
    console.log('Parameters:', params);
  }
});
```

#### API Request Logging
```typescript
// In server.ts
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`, req.body);
  next();
});
```

## 🔒 Security

### Authentication Security
- **JWT Tokens**: Stateless authentication with expiration
- **Password Hashing**: bcrypt with salt rounds
- **Rate Limiting**: Prevent brute force attacks
- **Token Refresh**: Secure token renewal mechanism

### Database Security
- **Parameterized Queries**: Prevent SQL injection
- **Connection Pooling**: Secure connection management
- **Input Validation**: Comprehensive data validation
- **Access Control**: Role-based permissions

### File Upload Security
- **File Type Validation**: Restrict to allowed formats
- **Size Limits**: Prevent large file uploads
- **Content Scanning**: Validate file contents
- **Secure Storage**: Isolated file storage location

## 📊 Monitoring & Logging

### Health Monitoring
The `/api/health` endpoint provides comprehensive system status:
```json
{
  "status": "healthy",
  "database": {
    "connected": true,
    "postgis": true,
    "version": "PostgreSQL 15.x"
  },
  "services": {
    "auth": "operational",
    "gis": "operational",
    "upload": "operational"
  },
  "performance": {
    "uptime": "2d 4h 30m",
    "memory": "245MB",
    "cpu": "12%"
  }
}
```

### Application Logging
- **Structured Logging**: JSON format with timestamps
- **Log Levels**: Error, Warn, Info, Debug
- **Log Rotation**: Automatic log file rotation
- **Error Tracking**: Comprehensive error information

### Performance Monitoring
- **Response Times**: Track API endpoint performance
- **Database Queries**: Monitor slow queries
- **Memory Usage**: Track memory consumption
- **Active Connections**: Monitor database connections

## 🚀 Deployment

### Production Configuration
```env
NODE_ENV=production
LOG_LEVEL=warn
DB_SSL=true
JWT_SECRET=super_secure_random_string_here
CORS_ORIGIN=https://your-domain.com
```

### Docker Deployment
```dockerfile
# Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3001
CMD ["npm", "start"]
```

### Docker Compose
```yaml
version: '3.8'
services:
  backend:
    build: .
    ports:
      - "3001:3001"
    environment:
      - DB_HOST=postgres
      - NODE_ENV=production
    depends_on:
      - postgres
  
  postgres:
    image: postgis/postgis:15-3.3
    environment:
      POSTGRES_DB: mapvue
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: your_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

### Cloud Deployment
Ready for deployment on:
- **AWS**: EC2, RDS, Elastic Beanstalk
- **Google Cloud**: App Engine, Cloud SQL
- **Azure**: App Service, Azure Database
- **Heroku**: With Heroku Postgres add-on
- **DigitalOcean**: App Platform, Managed Databases

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Install dependencies: `npm install`
4. Set up development database
5. Run tests: `npm test`
6. Make your changes
7. Add tests for new features
8. Submit a pull request

### Coding Standards
- **TypeScript**: Use strict type checking
- **ESLint**: Follow linting rules
- **Prettier**: Format code consistently
- **Testing**: Write tests for all new features
- **Documentation**: Update API docs and comments

---

**MapVue Backend - Powering professional GIS applications** 🗺️⚡