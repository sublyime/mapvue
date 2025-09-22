#!/bin/bash
# Database setup script for MapVue
# This script creates the database and runs initial migrations

# Set default values
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-mapvue}
DB_USER=${DB_USER:-mapvue_user}
DB_PASSWORD=${DB_PASSWORD:-mapvue_password}
POSTGRES_USER=${POSTGRES_USER:-postgres}

echo "Setting up MapVue database..."

# Function to check if PostgreSQL is running
check_postgres() {
    if ! command -v psql &> /dev/null; then
        echo "Error: PostgreSQL is not installed or not in PATH"
        exit 1
    fi
    
    if ! pg_isready -h $DB_HOST -p $DB_PORT -U $POSTGRES_USER &> /dev/null; then
        echo "Error: PostgreSQL is not running on $DB_HOST:$DB_PORT"
        exit 1
    fi
    
    echo "PostgreSQL is running"
}

# Function to create database and user
create_database() {
    echo "Creating database and user..."
    
    # Create user if it doesn't exist
    psql -h $DB_HOST -p $DB_PORT -U $POSTGRES_USER -c "
        DO \$\$
        BEGIN
            IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '$DB_USER') THEN
                CREATE ROLE $DB_USER LOGIN PASSWORD '$DB_PASSWORD';
            END IF;
        END
        \$\$;
    " postgres

    # Create database if it doesn't exist
    psql -h $DB_HOST -p $DB_PORT -U $POSTGRES_USER -c "
        SELECT 'CREATE DATABASE $DB_NAME OWNER $DB_USER'
        WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$DB_NAME');
    " postgres | grep -q "CREATE DATABASE" && \
    psql -h $DB_HOST -p $DB_PORT -U $POSTGRES_USER -c "CREATE DATABASE $DB_NAME OWNER $DB_USER" postgres

    # Grant privileges
    psql -h $DB_HOST -p $DB_PORT -U $POSTGRES_USER -c "
        GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
        ALTER USER $DB_USER CREATEDB;
    " postgres

    echo "Database and user created successfully"
}

# Function to run migrations
run_migrations() {
    echo "Running database migrations..."
    
    # Run the initial migration
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f migrations/001_initial_schema.sql
    
    if [ $? -eq 0 ]; then
        echo "Migrations completed successfully"
    else
        echo "Error running migrations"
        exit 1
    fi
}

# Function to create sample data
create_sample_data() {
    echo "Creating sample data..."
    
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME << EOF
-- Create a sample admin user
INSERT INTO users (username, email, password_hash, first_name, last_name, role, email_verified)
VALUES (
    'admin',
    'admin@mapvue.local',
    '\$2b\$10\$rOzJJe1qMJ1pVr8qX1nLgOqO9XZvFZrH8KvGwJ5HZJ1X5V7J5V7J5V', -- 'admin123'
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

EOF

    echo "Sample data created successfully"
}

# Function to verify setup
verify_setup() {
    echo "Verifying database setup..."
    
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
        SELECT 
            'Users: ' || COUNT(*) as user_count
        FROM users;
        
        SELECT 
            'Projects: ' || COUNT(*) as project_count
        FROM projects;
        
        SELECT 
            'Layers: ' || COUNT(*) as layer_count
        FROM layers;
        
        SELECT 
            'Features: ' || COUNT(*) as feature_count
        FROM features;
        
        SELECT 'PostGIS Version: ' || PostGIS_Version() as postgis_version;
    "
    
    echo "Database setup verification completed"
}

# Main execution
main() {
    echo "MapVue Database Setup"
    echo "===================="
    echo "Host: $DB_HOST:$DB_PORT"
    echo "Database: $DB_NAME"
    echo "User: $DB_USER"
    echo ""
    
    check_postgres
    create_database
    run_migrations
    
    # Ask if user wants sample data
    read -p "Do you want to create sample data? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        create_sample_data
    fi
    
    verify_setup
    
    echo ""
    echo "Database setup completed successfully!"
    echo "Connection string: postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME"
}

# Run main function
main