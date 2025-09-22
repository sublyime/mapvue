-- MapVue Database Schema
-- PostgreSQL with PostGIS extension for spatial data

-- Enable PostGIS extension for spatial operations
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table for authentication and user management
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    avatar_url TEXT,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'user', 'viewer')),
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Projects table for organizing GIS data
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_public BOOLEAN DEFAULT false,
    bounds GEOMETRY(POLYGON, 4326), -- Bounding box for the project
    default_zoom INTEGER DEFAULT 10,
    default_center GEOMETRY(POINT, 4326),
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Layers table for organizing features
CREATE TABLE layers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('vector', 'raster', 'tile', 'wms', 'wmts')),
    source_type VARCHAR(20) CHECK (source_type IN ('file', 'url', 'database', 'service')),
    source_url TEXT,
    source_config JSONB DEFAULT '{}',
    style_config JSONB DEFAULT '{}',
    visible BOOLEAN DEFAULT true,
    opacity DECIMAL(3,2) DEFAULT 1.00 CHECK (opacity >= 0 AND opacity <= 1),
    min_zoom INTEGER DEFAULT 0,
    max_zoom INTEGER DEFAULT 22,
    layer_order INTEGER DEFAULT 0,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Features table for storing geometric data
CREATE TABLE features (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    layer_id UUID NOT NULL REFERENCES layers(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255),
    description TEXT,
    geometry GEOMETRY(GEOMETRY, 4326) NOT NULL, -- Spatial column with SRID 4326 (WGS84)
    properties JSONB DEFAULT '{}',
    style JSONB DEFAULT '{}',
    is_visible BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Project collaborators for sharing projects
CREATE TABLE project_collaborators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'viewer' CHECK (role IN ('owner', 'editor', 'viewer')),
    permissions JSONB DEFAULT '{}',
    invited_by UUID REFERENCES users(id),
    invited_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    accepted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(project_id, user_id)
);

-- Activity log for tracking changes
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    layer_id UUID REFERENCES layers(id) ON DELETE CASCADE,
    feature_id UUID REFERENCES features(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL, -- 'create', 'update', 'delete', 'import', 'export', etc.
    entity_type VARCHAR(20) NOT NULL, -- 'project', 'layer', 'feature', 'user'
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- File uploads table for tracking imported files
CREATE TABLE file_uploads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    layer_id UUID REFERENCES layers(id) ON DELETE CASCADE,
    original_filename VARCHAR(255) NOT NULL,
    stored_filename VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100),
    file_path TEXT NOT NULL,
    processing_status VARCHAR(20) DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
    processing_error TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_active ON users(is_active);

CREATE INDEX idx_projects_owner ON projects(owner_id);
CREATE INDEX idx_projects_public ON projects(is_public);
CREATE INDEX idx_projects_bounds ON projects USING GIST(bounds);

CREATE INDEX idx_layers_project ON layers(project_id);
CREATE INDEX idx_layers_owner ON layers(owner_id);
CREATE INDEX idx_layers_type ON layers(type);
CREATE INDEX idx_layers_visible ON layers(visible);

CREATE INDEX idx_features_layer ON features(layer_id);
CREATE INDEX idx_features_owner ON features(owner_id);
CREATE INDEX idx_features_geometry ON features USING GIST(geometry);
CREATE INDEX idx_features_visible ON features(is_visible);
CREATE INDEX idx_features_properties ON features USING GIN(properties);

CREATE INDEX idx_project_collaborators_project ON project_collaborators(project_id);
CREATE INDEX idx_project_collaborators_user ON project_collaborators(user_id);

CREATE INDEX idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_project ON activity_logs(project_id);
CREATE INDEX idx_activity_logs_action ON activity_logs(action);
CREATE INDEX idx_activity_logs_created ON activity_logs(created_at);

CREATE INDEX idx_file_uploads_user ON file_uploads(user_id);
CREATE INDEX idx_file_uploads_project ON file_uploads(project_id);
CREATE INDEX idx_file_uploads_status ON file_uploads(processing_status);

-- Create updated_at triggers for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_layers_updated_at BEFORE UPDATE ON layers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_features_updated_at BEFORE UPDATE ON features
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create views for common queries
CREATE VIEW v_project_stats AS
SELECT 
    p.id,
    p.name,
    p.owner_id,
    COUNT(DISTINCT l.id) as layer_count,
    COUNT(DISTINCT f.id) as feature_count,
    COUNT(DISTINCT pc.user_id) as collaborator_count,
    p.created_at,
    p.updated_at
FROM projects p
LEFT JOIN layers l ON p.id = l.project_id
LEFT JOIN features f ON l.id = f.layer_id
LEFT JOIN project_collaborators pc ON p.id = pc.project_id
GROUP BY p.id, p.name, p.owner_id, p.created_at, p.updated_at;

CREATE VIEW v_layer_stats AS
SELECT 
    l.id,
    l.name,
    l.project_id,
    l.owner_id,
    l.type,
    COUNT(f.id) as feature_count,
    ST_Extent(f.geometry) as extent,
    l.created_at,
    l.updated_at
FROM layers l
LEFT JOIN features f ON l.id = f.layer_id
GROUP BY l.id, l.name, l.project_id, l.owner_id, l.type, l.created_at, l.updated_at;

-- Create spatial functions for common operations
CREATE OR REPLACE FUNCTION get_features_in_bounds(
    layer_id_param UUID,
    bounds_geometry GEOMETRY
) RETURNS TABLE (
    id UUID,
    name VARCHAR(255),
    geometry GEOMETRY,
    properties JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT f.id, f.name, f.geometry, f.properties
    FROM features f
    WHERE f.layer_id = layer_id_param
    AND ST_Intersects(f.geometry, bounds_geometry);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION search_features(
    search_term TEXT,
    project_id_param UUID DEFAULT NULL
) RETURNS TABLE (
    id UUID,
    layer_id UUID,
    name VARCHAR(255),
    description TEXT,
    geometry GEOMETRY,
    properties JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT f.id, f.layer_id, f.name, f.description, f.geometry, f.properties
    FROM features f
    JOIN layers l ON f.layer_id = l.id
    WHERE (project_id_param IS NULL OR l.project_id = project_id_param)
    AND (
        f.name ILIKE '%' || search_term || '%' OR
        f.description ILIKE '%' || search_term || '%' OR
        f.properties::text ILIKE '%' || search_term || '%'
    );
END;
$$ LANGUAGE plpgsql;