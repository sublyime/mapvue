# MapVue Database Setup Guide

## Overview
This guide covers the complete database setup for MapVue, including PostgreSQL with PostGIS extension for spatial data handling.

## Prerequisites
1. PostgreSQL 12+ installed and running
2. PostGIS extension available
3. Node.js and npm installed
4. PowerShell (Windows) or Bash (Linux/Mac)

## Database Schema
The MapVue database includes the following main tables:

### Core Tables
- **users**: User authentication and profile data
- **projects**: GIS project containers
- **layers**: Map layers within projects
- **features**: Geometric features with spatial data
- **project_collaborators**: Project sharing and permissions
- **activity_logs**: Audit trail for changes
- **file_uploads**: File upload tracking and metadata

### Spatial Features
- PostGIS geometry columns with SRID 4326 (WGS84)
- Spatial indexes for performance
- Geographic bounds and extent calculations
- Spatial query functions

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