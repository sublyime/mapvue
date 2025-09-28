# MapVue Complete Setup Guide

This guide will walk you through setting up MapVue from scratch to a fully working GIS application.

## ✅ Working Configuration Confirmed

This guide reflects a **tested and working setup** as of September 27, 2025.

## Prerequisites

- **Node.js 18+** and npm
- **PostgreSQL 15+** with PostGIS extension
- **PowerShell** (Windows)
- **Git**

## Step-by-Step Setup

### 1. Clone and Install Dependencies

```bash
git clone https://github.com/sublyime/mapvue.git
cd mapvue
npm install
```

This will install all dependencies for both frontend and backend automatically.

### 2. Install PostgreSQL with PostGIS

1. Download PostgreSQL from: https://www.postgresql.org/download/windows/
2. During installation, **make sure to include PostGIS extension**
3. Set a password for the `postgres` superuser (remember this!)
4. Use default port `5432`

### 3. Automated Database Setup

Navigate to the database directory and run the setup script:

```powershell
cd backend\database
.\setup.ps1
```

The script will prompt for sample data creation. Type `y` if you want test data.

**Expected Output:**
```
✅ PostgreSQL is running
✅ Database created successfully  
✅ User privileges granted successfully
✅ Migrations completed successfully
✅ Database setup completed successfully!
```

### 4. Configure Environment Variables

The `.env` file should already be configured correctly, but verify it contains:

```env
# Database environment variables for MapVue
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mapvue
DB_USER=postgres
DB_PASSWORD=your_postgres_password_here
DB_SSL=false

# Application settings
PORT=3001
NODE_ENV=development
JWT_SECRET=your_jwt_secret_key_change_this_in_production

# CORS settings
CORS_ORIGIN=http://localhost:5173
```

Replace `your_postgres_password_here` with your actual PostgreSQL password.

### 5. Start the Application

From the root directory:

```bash
npm run dev
```

This starts both backend and frontend simultaneously.

**Expected Success Output:**
```
Backend:
✅ Database connection established successfully
🗺️ PostGIS extension detected and ready  
🚀 MapVue server running on port 3001

Frontend:  
➜  Local:   http://localhost:5173/
```

### 6. Verify Setup

Open your browser and navigate to:
- **Frontend**: http://localhost:5173/
- **Backend Health Check**: http://localhost:3001/health

## Troubleshooting

### Database Connection Issues

If you see `password authentication failed for user "postgres"`:

1. Check your `.env` file has the correct password
2. Verify PostgreSQL is running: `Get-Service postgresql*`
3. Test connection: `psql -U postgres -d postgres`

### Port Already in Use

If port 3001 or 5173 is busy:
```bash
# Kill any existing Node processes
Stop-Process -Name "node","nodemon" -Force -ErrorAction SilentlyContinue
npm run dev
```

### PostGIS Extension Missing

If PostGIS is not installed:
```sql
psql -U postgres -d mapvue
CREATE EXTENSION IF NOT EXISTS postgis;
SELECT PostGIS_Version();
```

## Features Ready After Setup

✅ **Database Features:**
- PostgreSQL with PostGIS for spatial data
- Complete schema with users, projects, layers, features
- Spatial indexes and geometry functions
- Sample data (if created)

✅ **Backend Features:**
- RESTful API with TypeScript
- JWT authentication system
- File upload for GIS formats (KML, GeoJSON, etc.)
- Real-time features with Socket.io
- Comprehensive security middleware

✅ **Frontend Features:**
- React 19 with TypeScript
- OpenLayers for GIS mapping
- Tailwind CSS styling
- Performance optimization hooks
- Real-time collaboration ready

## Next Steps

1. **Create a user account** through the API or frontend
2. **Import GIS data** using the file upload feature  
3. **Create projects and layers** to organize your data
4. **Start developing** your custom GIS features

## Development Workflow

- **Backend changes**: Auto-reload with nodemon
- **Frontend changes**: Hot module replacement with Vite  
- **Database changes**: Add migrations in `backend/database/migrations/`

## Production Deployment

For production deployment, see:
- Update JWT_SECRET to a secure value
- Set NODE_ENV=production
- Configure SSL/TLS for PostgreSQL
- Set up proper CORS origins
- Enable rate limiting

---

🎉 **Congratulations!** Your MapVue GIS application is now fully functional and ready for development.

*This setup guide reflects the exact working configuration tested on September 27, 2025.*