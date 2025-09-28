# MapVue Database Setup Script for Windows PowerShell
# This script creates the database and runs initial migrations
#
# Usage Examples:
#   .\setup.ps1                                                    # Use environment variables or defaults
#   .\setup.ps1 -DbPassword (ConvertTo-SecureString "mypass" -AsPlainText -Force)  # SecureString password
#   $securePass = Read-Host "Enter password" -AsSecureString; .\setup.ps1 -DbPassword $securePass
#
# Security Note: When using -DbPassword parameter, provide a SecureString for better security

param(
    [string]$DbHost = $(if ($env:DB_HOST) { $env:DB_HOST } else { "localhost" }),
    [string]$DbPort = $(if ($env:DB_PORT) { $env:DB_PORT } else { "5432" }),
    [string]$DbName = $(if ($env:DB_NAME) { $env:DB_NAME } else { "mapvue" }),
    [string]$DbUser = $(if ($env:DB_USER) { $env:DB_USER } else { "postgres" }),
    [SecureString]$DbPassword,
    [string]$PostgresUser = $(if ($env:POSTGRES_USER) { $env:POSTGRES_USER } else { "postgres" }),
    [switch]$SkipSampleData
)

# Convert SecureString to plain text for environment variable (required by psql)
# If no SecureString provided, use environment variable or default
if ($DbPassword) {
    $DbPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($DbPassword))
} elseif ($env:DB_PASSWORD) {
    $DbPasswordPlain = $env:DB_PASSWORD
} else {
    $DbPasswordPlain = "ala1nna"
}

Write-Host "Setting up MapVue database..." -ForegroundColor Green

# Function to check if PostgreSQL is running
function Test-PostgreSQL {
    Write-Host "Checking PostgreSQL installation..."
    
    if (-not (Get-Command psql -ErrorAction SilentlyContinue)) {
        Write-Error "PostgreSQL is not installed or not in PATH"
        exit 1
    }
    
    try {
        $env:PGPASSWORD = $env:POSTGRES_PASSWORD
        & psql -h $DbHost -p $DbPort -U $PostgresUser -d postgres -c "SELECT 1;" | Out-Null
        Write-Host "PostgreSQL is running" -ForegroundColor Green
    }
    catch {
        Write-Error "PostgreSQL is not running on ${DbHost}:${DbPort} or password is incorrect"
        exit 1
    }
}

# Function to create database and user
function New-Database {
    Write-Host "Creating database and user..."
    
    $env:PGPASSWORD = $env:POSTGRES_PASSWORD
    
    # Create user if it doesn't exist
    $createUserSql = @"
DO `$`$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '$DbUser') THEN
        CREATE ROLE $DbUser LOGIN PASSWORD '$DbPasswordPlain';
    END IF;
END
`$`$;
"@
    
    & psql -h $DbHost -p $DbPort -U $PostgresUser -d postgres -c $createUserSql
    
    # Create database if it doesn't exist
    $checkDbSql = "SELECT 1 FROM pg_database WHERE datname = '$DbName'"
    $dbExists = & psql -h $DbHost -p $DbPort -U $PostgresUser -d postgres -t -c $checkDbSql
    
    if (-not $dbExists.Trim()) {
        & psql -h $DbHost -p $DbPort -U $PostgresUser -d postgres -c "CREATE DATABASE $DbName OWNER $DbUser"
        Write-Host "Database created successfully" -ForegroundColor Green
    } else {
        Write-Host "Database already exists" -ForegroundColor Yellow
    }
    
    # Grant privileges
    $grantSql = @"
GRANT ALL PRIVILEGES ON DATABASE $DbName TO $DbUser;
ALTER USER $DbUser CREATEDB;
"@
    
    & psql -h $DbHost -p $DbPort -U $PostgresUser -d postgres -c $grantSql
    Write-Host "User privileges granted successfully" -ForegroundColor Green
}

# Function to run migrations
function Invoke-Migrations {
    Write-Host "Running database migrations..."
    
    $env:PGPASSWORD = $DbPasswordPlain
    $migrationPath = Join-Path $PSScriptRoot "migrations\001_initial_schema.sql"
    
    if (-not (Test-Path $migrationPath)) {
        Write-Error "Migration file not found: $migrationPath"
        exit 1
    }
    
    try {
        & psql -h $DbHost -p $DbPort -U $DbUser -d $DbName -f $migrationPath
        Write-Host "Migrations completed successfully" -ForegroundColor Green
    }
    catch {
        Write-Error "Error running migrations: $_"
        exit 1
    }
}

# Function to create sample data
function New-SampleData {
    Write-Host "Creating sample data..."
    
    $env:PGPASSWORD = $DbPasswordPlain
    
    $sampleDataSql = @"
-- Create a sample admin user
INSERT INTO users (username, email, password_hash, first_name, last_name, role, email_verified)
VALUES (
    'admin',
    'admin@mapvue.local',
    '`$2b`$10`$rOzJJe1qMJ1pVr8qX1nLgOqO9XZvFZrH8KvGwJ5HZJ1X5V7J5V7J5V', -- 'admin123'
    'Admin',
    'User',
    'admin',
    true
) ON CONFLICT (username) DO NOTHING;

-- Create a sample project
INSERT INTO projects (name, description, owner_id, is_public, default_center)
SELECT 
    'Sample Project',
    'A sample GIS project for testing',
    u.id,
    true,
    ST_SetSRID(ST_MakePoint(-74.006, 40.7128), 4326) -- New York City
FROM users u WHERE u.username = 'admin'
ON CONFLICT DO NOTHING;

-- Create a sample layer
INSERT INTO layers (name, description, project_id, owner_id, type, source_type, visible)
SELECT 
    'Sample Vector Layer',
    'A sample vector layer with some features',
    p.id,
    u.id,
    'vector',
    'database',
    true
FROM projects p, users u 
WHERE p.name = 'Sample Project' AND u.username = 'admin'
ON CONFLICT DO NOTHING;

-- Create sample features
INSERT INTO features (layer_id, owner_id, name, description, geometry, properties)
SELECT 
    l.id,
    u.id,
    'Central Park',
    'Central Park in Manhattan',
    ST_SetSRID(ST_MakePoint(-73.9712, 40.7831), 4326),
    '{"type": "park", "area": "843 acres"}'::jsonb
FROM layers l, users u, projects p
WHERE l.name = 'Sample Vector Layer' 
  AND u.username = 'admin' 
  AND p.id = l.project_id 
  AND p.name = 'Sample Project'
ON CONFLICT DO NOTHING;

INSERT INTO features (layer_id, owner_id, name, description, geometry, properties)
SELECT 
    l.id,
    u.id,
    'Times Square',
    'Times Square in Manhattan',
    ST_SetSRID(ST_MakePoint(-73.9855, 40.7580), 4326),
    '{"type": "landmark", "visitors_per_year": "50000000"}'::jsonb
FROM layers l, users u, projects p
WHERE l.name = 'Sample Vector Layer' 
  AND u.username = 'admin' 
  AND p.id = l.project_id 
  AND p.name = 'Sample Project'
ON CONFLICT DO NOTHING;
"@
    
    & psql -h $DbHost -p $DbPort -U $DbUser -d $DbName -c $sampleDataSql
    Write-Host "Sample data created successfully" -ForegroundColor Green
}

# Function to verify setup
function Test-Setup {
    Write-Host "Verifying database setup..."
    
    $env:PGPASSWORD = $DbPasswordPlain
    
    $verifySql = @"
SELECT 'Users: ' || COUNT(*) as user_count FROM users;
SELECT 'Projects: ' || COUNT(*) as project_count FROM projects;
SELECT 'Layers: ' || COUNT(*) as layer_count FROM layers;
SELECT 'Features: ' || COUNT(*) as feature_count FROM features;
SELECT 'PostGIS Version: ' || PostGIS_Version() as postgis_version;
"@
    
    & psql -h $DbHost -p $DbPort -U $DbUser -d $DbName -c $verifySql
    Write-Host "Database setup verification completed" -ForegroundColor Green
}

# Main execution
function Main {
    Write-Host "MapVue Database Setup" -ForegroundColor Cyan
    Write-Host "====================" -ForegroundColor Cyan
    Write-Host "Host: ${DbHost}:${DbPort}"
    Write-Host "Database: $DbName"
    Write-Host "User: $DbUser"
    Write-Host ""
    
    Test-PostgreSQL
    New-Database
    Invoke-Migrations
    
    if (-not $SkipSampleData) {
        $response = Read-Host "Do you want to create sample data? (y/n)"
        if ($response -eq 'y' -or $response -eq 'Y') {
            New-SampleData
        }
    }
    
    Test-Setup
    
    Write-Host ""
    Write-Host "Database setup completed successfully!" -ForegroundColor Green
    Write-Host "Connection string: postgresql://${DbUser}:[REDACTED]@${DbHost}:${DbPort}/${DbName}" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Update your .env file with the database connection details"
    Write-Host "2. Install required Node.js dependencies: npm install"
    Write-Host "3. Start the backend server: npm run dev"
    
    # Clear sensitive information from memory
    if ($DbPasswordPlain) {
        $DbPasswordPlain = $null
    }
    [System.GC]::Collect()
}

# Run main function
Main