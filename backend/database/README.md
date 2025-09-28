# MapVue Database Setup Guide

## Overview
This guide covers the complete database setup for MapVue's macOS-style GIS web application, including PostgreSQL with PostGIS extension for advanced spatial data handling. The database supports the full-featured GIS application with route management, layer controls, drawing tools, GPS integration, and real-time collaboration.

## Prerequisites
1. PostgreSQL 15+ installed and running
2. PostGIS extension available (automatically installed with most PostgreSQL distributions)
3. Node.js 18+ and npm installed
4. PowerShell (Windows) or Bash (Linux/Mac) for automated setup scripts
5. Modern web browser for testing the application

## Database Schema
The MapVue database is designed to support a comprehensive GIS application with the following main tables:

### Core Tables
- **users**: User authentication, profiles, and preferences
- **projects**: GIS project containers with spatial bounds and metadata
- **layers**: Map layers within projects with styling and configuration
- **features**: Geometric features with full PostGIS spatial data support
- **project_collaborators**: Real-time collaboration and permission management
- **activity_logs**: Complete audit trail for all changes and user actions
- **file_uploads**: File upload tracking, metadata, and import history
- **routes**: Route planning data with waypoints and navigation information
- **gps_tracks**: GPS tracking data with time-series location information

### Advanced Spatial Features
- PostGIS geometry columns with SRID 4326 (WGS84) for global compatibility
- Advanced spatial indexes (GiST) for high-performance spatial queries
- Geographic bounds and extent calculations for map viewport management
- Spatial relationship functions (intersects, within, distance, buffer)
- Support for all OpenGIS geometry types (Point, LineString, Polygon, Multi*)
- Coordinate system transformation capabilities
- Spatial clustering and aggregation functions

### Real-time Collaboration Support
- Live editing with conflict resolution
- User presence tracking and session management
- Change notifications and event streaming
- Version control and change history
- Permission-based access control

## Setup Instructions

### Option 1: Automated Setup (Recommended)

Use the PowerShell setup script for complete automation:

```powershell
cd backend\database
.\setup.ps1
```

This script will:
- Check PostgreSQL connectivity
- Create the mapvue database 
- Set up all tables, indexes, and PostGIS extensions
- Create sample data (optional)
- Verify the setup

### Option 2: Manual Setup

If you prefer manual setup:

```sql
-- Connect as postgres superuser
psql -U postgres

-- Create database 
CREATE DATABASE mapvue OWNER postgres;
GRANT ALL PRIVILEGES ON DATABASE mapvue TO postgres;

-- Exit and connect to new database
\q
psql -U postgres -d mapvue

-- Enable PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Run the schema
\i migrations/001_initial_schema.sql
```

### Environment Configuration

Update your `backend/.env` file:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mapvue
DB_USER=postgres
DB_PASSWORD=your_postgres_password
```

### Step 1: Database Creation
Choose your platform and run the appropriate setup script:

#### Windows (PowerShell) - Secure Method:
```powershell
cd backend
# Option 1: Interactive secure password input
.\database\setup-secure.ps1

# Option 2: Using SecureString parameter
$securePass = ConvertTo-SecureString "your_password" -AsPlainText -Force
.\database\setup.ps1 -DbPassword $securePass

# Option 3: Using environment variables (less secure but convenient)
$env:DB_PASSWORD="your_password"
npm run db:setup
```

#### Windows (PowerShell) - Standard Method:
```powershell
cd backend
npm run db:setup
```

#### Linux/Mac (Bash):
```bash
cd backend
npm run db:setup-bash
```

### Security Best Practices
- Use the `setup-secure.ps1` script for interactive secure password input
- When using the `-DbPassword` parameter, always provide a SecureString
- Avoid hardcoding passwords in scripts or command history
- Set appropriate file permissions on configuration files
- Use environment variables for CI/CD environments

#### Manual Setup:
```sql
-- Connect to PostgreSQL as superuser
psql -U postgres

-- Create user and database
CREATE USER mapvue_user WITH PASSWORD 'mapvue_password';
CREATE DATABASE mapvue OWNER mapvue_user;
\q

-- Run migrations
psql -U mapvue_user -d mapvue -f database/migrations/001_initial_schema.sql
```

### Step 2: Environment Configuration
1. Copy `.env.example` to `.env`
2. Update database credentials:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mapvue
DB_USER=mapvue_user
DB_PASSWORD=mapvue_password
```

### Step 3: Install Dependencies
```bash
npm install
```

### Step 4: Start the Server
```bash
npm run dev
```

## Database Models and API Integration

### TypeScript Models
The backend includes comprehensive TypeScript models for:
- User management with authentication
- Project CRUD operations with access control
- Layer management with styling and configuration
- Feature storage with PostGIS spatial operations
- File upload processing and metadata

### API Endpoints
All models support full CRUD operations through REST API:
- `GET/POST/PUT/DELETE /api/auth/*` - Authentication
- `GET/POST/PUT/DELETE /api/gis/projects` - Project management
- `GET/POST/PUT/DELETE /api/gis/layers` - Layer management
- `GET/POST/PUT/DELETE /api/gis/features` - Feature operations
- `POST /api/upload/*` - File operations

### Spatial Queries
The database supports advanced spatial operations:
- Geometry intersection and bounds queries
- Feature search within map extents
- Distance calculations and buffering
- Spatial indexing for performance

## Verification

### Health Check
Visit `http://localhost:3001/health` to verify:
- Server status
- Database connectivity
- PostGIS extension availability

### Sample Data
The setup script can optionally create sample data including:
- Admin user (username: admin, password: admin123)
- Sample project with layers
- Example geographic features (Central Park, Times Square)

## Troubleshooting

### Common Issues

1. **PostgreSQL Connection Failed**
   - Ensure PostgreSQL is running
   - Check credentials in .env file
   - Verify database exists

2. **PostGIS Extension Missing**
   - Install PostGIS: `CREATE EXTENSION postgis;`
   - Check PostgreSQL version compatibility

3. **Permission Denied**
   - Grant user permissions: `GRANT ALL PRIVILEGES ON DATABASE mapvue TO mapvue_user;`
   - Check user roles and permissions

4. **Migration Errors**
   - Drop and recreate database if needed
   - Check for existing tables and conflicts

### Database Reset
To completely reset the database:
```sql
DROP DATABASE mapvue;
CREATE DATABASE mapvue OWNER mapvue_user;
```
Then re-run the setup script.

## Development Notes

### Database Connection
- Connection pooling configured for optimal performance
- Automatic reconnection handling
- Health checks and monitoring

### Spatial Data Handling
- All geometries stored in WGS84 (SRID 4326)
- GeoJSON format for API communication
- Efficient spatial indexing

### Security
- Parameterized queries prevent SQL injection
- Role-based access control
- Password hashing with bcrypt

### Performance
- Optimized indexes for common queries
- Connection pooling
- Prepared statements for frequent operations

## Next Steps

Once the database is set up:
1. Start the backend server: `npm run dev`
2. Verify the frontend can connect to the API
3. Test creating projects, layers, and features
4. Import GIS files (GeoJSON, KML, etc.)
5. Configure webhooks for real-time updates

The database schema is designed to scale and can be extended with additional tables and features as needed.