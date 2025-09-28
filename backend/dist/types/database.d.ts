export interface GeoJSONGeometry {
    type: string;
    coordinates: any;
}
export interface GeoJSONPoint extends GeoJSONGeometry {
    type: 'Point';
    coordinates: [number, number];
}
export interface GeoJSONPolygon extends GeoJSONGeometry {
    type: 'Polygon';
    coordinates: number[][][];
}
export type GeoJSON = GeoJSONGeometry | GeoJSONPoint | GeoJSONPolygon;
export interface User {
    id: string;
    username: string;
    email: string;
    password_hash: string;
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
    role: 'admin' | 'user' | 'viewer';
    is_active: boolean;
    email_verified: boolean;
    last_login?: Date;
    created_at: Date;
    updated_at: Date;
}
export interface GeoJSONGeometry {
    type: string;
    coordinates: any;
}
export interface GeoJSONPoint extends GeoJSONGeometry {
    type: 'Point';
    coordinates: [number, number];
}
export interface GeoJSONPolygon extends GeoJSONGeometry {
    type: 'Polygon';
    coordinates: number[][][];
}
export interface Project {
    id: string;
    name: string;
    description?: string;
    owner_id: string;
    is_public: boolean;
    bounds?: GeoJSONPolygon;
    default_zoom: number;
    default_center?: GeoJSONPoint;
    settings: Record<string, any>;
    created_at: Date;
    updated_at: Date;
}
export interface Layer {
    id: string;
    name: string;
    description?: string;
    project_id?: string;
    owner_id: string;
    type: 'vector' | 'raster' | 'tile' | 'wms' | 'wmts';
    source_type?: 'file' | 'url' | 'database' | 'service';
    source_url?: string;
    source_config: Record<string, any>;
    style_config: Record<string, any>;
    visible: boolean;
    opacity: number;
    min_zoom: number;
    max_zoom: number;
    layer_order: number;
    is_public: boolean;
    created_at: Date;
    updated_at: Date;
}
export interface Feature {
    id: string;
    layer_id: string;
    owner_id: string;
    name?: string;
    description?: string;
    geometry: GeoJSONGeometry;
    properties: Record<string, any>;
    style: Record<string, any>;
    is_visible: boolean;
    created_at: Date;
    updated_at: Date;
}
export interface ProjectCollaborator {
    id: string;
    project_id: string;
    user_id: string;
    role: 'owner' | 'editor' | 'viewer';
    permissions: Record<string, any>;
    invited_by?: string;
    invited_at: Date;
    accepted_at?: Date;
    created_at: Date;
}
export interface ActivityLog {
    id: string;
    user_id?: string;
    project_id?: string;
    layer_id?: string;
    feature_id?: string;
    action: string;
    entity_type: 'project' | 'layer' | 'feature' | 'user';
    details: Record<string, any>;
    ip_address?: string;
    user_agent?: string;
    created_at: Date;
}
export interface FileUpload {
    id: string;
    user_id: string;
    project_id?: string;
    layer_id?: string;
    original_filename: string;
    stored_filename: string;
    file_type: string;
    file_size: number;
    mime_type?: string;
    file_path: string;
    processing_status: 'pending' | 'processing' | 'completed' | 'failed';
    processing_error?: string;
    metadata: Record<string, any>;
    created_at: Date;
    processed_at?: Date;
}
export interface ProjectStats {
    id: string;
    name: string;
    owner_id: string;
    layer_count: number;
    feature_count: number;
    collaborator_count: number;
    created_at: Date;
    updated_at: Date;
}
export interface LayerStats {
    id: string;
    name: string;
    project_id?: string;
    owner_id: string;
    type: string;
    feature_count: number;
    extent?: GeoJSONPolygon;
    created_at: Date;
    updated_at: Date;
}
export interface CreateUserRequest {
    username: string;
    email: string;
    password: string;
    first_name?: string;
    last_name?: string;
}
export interface UpdateUserRequest {
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
}
export interface CreateProjectRequest {
    name: string;
    description?: string;
    is_public?: boolean;
    bounds?: GeoJSONPolygon;
    default_zoom?: number;
    default_center?: GeoJSONPoint;
    settings?: Record<string, any>;
}
export interface UpdateProjectRequest {
    name?: string;
    description?: string;
    is_public?: boolean;
    bounds?: GeoJSONPolygon;
    default_zoom?: number;
    default_center?: GeoJSONPoint;
    settings?: Record<string, any>;
}
export interface CreateLayerRequest {
    name: string;
    description?: string;
    project_id?: string;
    type: 'vector' | 'raster' | 'tile' | 'wms' | 'wmts';
    source_type?: 'file' | 'url' | 'database' | 'service';
    source_url?: string;
    source_config?: Record<string, any>;
    style_config?: Record<string, any>;
    visible?: boolean;
    opacity?: number;
    min_zoom?: number;
    max_zoom?: number;
    layer_order?: number;
    is_public?: boolean;
}
export interface UpdateLayerRequest {
    name?: string;
    description?: string;
    source_url?: string;
    source_config?: Record<string, any>;
    style_config?: Record<string, any>;
    visible?: boolean;
    opacity?: number;
    min_zoom?: number;
    max_zoom?: number;
    layer_order?: number;
    is_public?: boolean;
}
export interface CreateFeatureRequest {
    layer_id: string;
    name?: string;
    description?: string;
    geometry: GeoJSONGeometry;
    properties?: Record<string, any>;
    style?: Record<string, any>;
    is_visible?: boolean;
}
export interface UpdateFeatureRequest {
    name?: string;
    description?: string;
    geometry?: GeoJSONGeometry;
    properties?: Record<string, any>;
    style?: Record<string, any>;
    is_visible?: boolean;
}
export interface AddCollaboratorRequest {
    user_id: string;
    role: 'editor' | 'viewer';
    permissions?: Record<string, any>;
}
export interface UpdateCollaboratorRequest {
    role?: 'editor' | 'viewer';
    permissions?: Record<string, any>;
}
export interface PaginationParams {
    page?: number;
    limit?: number;
}
export interface ProjectQueryParams extends PaginationParams {
    owner_id?: string;
    is_public?: boolean;
    search?: string;
}
export interface LayerQueryParams extends PaginationParams {
    project_id?: string;
    owner_id?: string;
    type?: string;
    is_public?: boolean;
}
export interface FeatureQueryParams extends PaginationParams {
    layer_id?: string;
    bounds?: string;
    search?: string;
}
export interface ActivityLogQueryParams extends PaginationParams {
    user_id?: string;
    project_id?: string;
    action?: string;
    entity_type?: string;
    start_date?: string;
    end_date?: string;
}
export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        total_pages: number;
    };
}
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
        details?: any;
    };
}
export interface DatabaseConfig {
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
    ssl?: boolean;
    pool?: {
        min: number;
        max: number;
        idle: number;
    };
}
export interface SpatialQueryParams {
    geometry: GeoJSONGeometry;
    operation: 'intersects' | 'contains' | 'within' | 'touches' | 'crosses';
    buffer?: number;
}
export interface BoundsQueryParams {
    minx: number;
    miny: number;
    maxx: number;
    maxy: number;
}
export interface FileProcessingResult {
    features: Feature[];
    layer_info: {
        name: string;
        type: string;
        feature_count: number;
        bounds?: GeoJSONPolygon;
    };
    errors?: string[];
}
export interface WebhookEvent {
    id: string;
    event_type: string;
    entity_type: string;
    entity_id: string;
    user_id?: string;
    project_id?: string;
    data: Record<string, any>;
    timestamp: Date;
}
export interface WebhookSubscription {
    id: string;
    user_id: string;
    project_id?: string;
    url: string;
    event_types: string[];
    secret?: string;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
}
//# sourceMappingURL=database.d.ts.map