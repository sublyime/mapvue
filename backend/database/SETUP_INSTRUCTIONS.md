# MapVue Database Setup Instructions

## PostgreSQL Installation Required

This system doesn't have PostgreSQL installed. Please follow these steps to set up the database:

### Step 1: Install PostgreSQL
1. Download PostgreSQL from: https://www.postgresql.org/download/windows/
2. Install PostgreSQL with PostGIS extension
3. Remember your postgres superuser password

### Step 2: Automated Setup (Recommended)
Use the PowerShell setup script for automatic database creation:

```powershell
cd backend\database
.\setup.ps1
```

This script will:
- Create the mapvue database
- Set up all tables and schema
- Configure PostGIS extensions
- Create sample data (optional)

### Step 2 Alternative: Manual Setup
If you prefer manual setup, run these commands:

```sql
-- Connect as postgres superuser
psql -U postgres

-- Create database (using postgres user as owner)
CREATE DATABASE mapvue OWNER postgres;
GRANT ALL PRIVILEGES ON DATABASE mapvue TO postgres;

-- Exit postgres session
\q

-- Connect to mapvue database and run migrations
psql -U postgres -d mapvue -f database/migrations/001_initial_schema.sql
```

### Step 3: Alternative Setup
If you have Docker installed, you can use PostgreSQL with PostGIS:

```bash
# Run PostgreSQL with PostGIS in Docker
docker run --name mapvue-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=mapvue \
  -p 5432:5432 \
  -d postgis/postgis:13-3.1

# Create mapvue user
docker exec -it mapvue-postgres psql -U postgres -d mapvue -c "
CREATE USER mapvue_user WITH PASSWORD 'mapvue_password';
GRANT ALL PRIVILEGES ON DATABASE mapvue TO mapvue_user;
"

# Run migrations
psql -h localhost -U mapvue_user -d mapvue -f database/migrations/001_initial_schema.sql
```

### Step 4: Update Environment
Update your .env file with your PostgreSQL credentials:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mapvue
DB_USER=postgres
DB_PASSWORD=your_postgres_password
```

**Note:** Replace `your_postgres_password` with your actual PostgreSQL superuser password.

### Step 5: Test Connection
Start the backend server to test the database connection:

```bash
npm run dev
```

Visit http://localhost:3001/health to verify database connectivity.

## Next Steps

Once PostgreSQL is installed and the database is set up:
1. The backend server will automatically connect to the database
2. All API endpoints will be functional
3. You can start creating projects, layers, and features
4. File import/export will work with spatial data

For any issues, check the troubleshooting section in database/README.md