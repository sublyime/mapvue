# MapVue API Documentation

## Overview

MapVue provides a comprehensive REST API for managing GIS data, user authentication, file operations, and real-time collaboration. The API is built with Express.js, TypeScript, and PostgreSQL with PostGIS for spatial data handling.

**Base URL**: `http://localhost:3001/api`

## Authentication

### JWT Token Authentication
All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

### Authentication Endpoints

#### POST /api/auth/register
Register a new user account.

**Request Body:**
```json
{
  "username": "string",
  "email": "string",
  "password": "string",
  "fullName": "string"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "username": "string",
      "email": "string",
      "fullName": "string",
      "createdAt": "datetime"
    },
    "token": "jwt_token"
  }
}
```

#### POST /api/auth/login
Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "username": "string",
      "email": "string",
      "fullName": "string"
    },
    "token": "jwt_token"
  }
}
```

#### GET /api/auth/profile
Get current user profile (requires authentication).

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "username": "string",
    "email": "string",
    "fullName": "string",
    "createdAt": "datetime",
    "lastLogin": "datetime"
  }
}
```

## GIS Data Operations

### Projects

#### GET /api/gis/projects
Get all projects for the authenticated user.

**Query Parameters:**
- `limit` (optional): Number of results to return (default: 50)
- `offset` (optional): Number of results to skip (default: 0)
- `search` (optional): Search term for project name or description

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "string",
      "description": "string",
      "bounds": {
        "type": "Polygon",
        "coordinates": [[[lng, lat], [lng, lat], [lng, lat], [lng, lat]]]
      },
      "isPublic": boolean,
      "createdAt": "datetime",
      "updatedAt": "datetime",
      "userId": "uuid"
    }
  ],
  "pagination": {
    "total": number,
    "limit": number,
    "offset": number
  }
}
```

#### POST /api/gis/projects
Create a new project.

**Request Body:**
```json
{
  "name": "string",
  "description": "string",
  "bounds": {
    "type": "Polygon",
    "coordinates": [[[lng, lat], [lng, lat], [lng, lat], [lng, lat]]]
  },
  "isPublic": boolean
}
```

#### GET /api/gis/projects/:projectId
Get a specific project by ID.

#### PUT /api/gis/projects/:projectId
Update a project.

#### DELETE /api/gis/projects/:projectId
Delete a project and all associated layers and features.

### Layers

#### GET /api/gis/projects/:projectId/layers
Get all layers for a specific project.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "string",
      "description": "string",
      "layerType": "vector" | "raster" | "tile",
      "style": {
        "fill": {"color": "rgba(255,0,0,0.5)"},
        "stroke": {"color": "#FF0000", "width": 2},
        "image": {"radius": 5, "fill": {"color": "#FF0000"}}
      },
      "isVisible": boolean,
      "opacity": number,
      "zIndex": number,
      "bounds": {
        "type": "Polygon",
        "coordinates": [[[lng, lat], [lng, lat], [lng, lat], [lng, lat]]]
      },
      "createdAt": "datetime",
      "projectId": "uuid"
    }
  ]
}
```

#### POST /api/gis/projects/:projectId/layers
Create a new layer in a project.

**Request Body:**
```json
{
  "name": "string",
  "description": "string",
  "layerType": "vector" | "raster" | "tile",
  "style": object,
  "isVisible": boolean,
  "opacity": number,
  "zIndex": number
}
```

#### PUT /api/gis/layers/:layerId
Update a layer.

#### DELETE /api/gis/layers/:layerId
Delete a layer and all associated features.

### Features

#### GET /api/gis/layers/:layerId/features
Get all features in a specific layer.

**Query Parameters:**
- `bbox` (optional): Bounding box filter `minLng,minLat,maxLng,maxLat`
- `limit` (optional): Number of features to return
- `offset` (optional): Pagination offset

**Response:**
```json
{
  "success": true,
  "data": {
    "type": "FeatureCollection",
    "features": [
      {
        "type": "Feature",
        "id": "uuid",
        "geometry": {
          "type": "Point" | "LineString" | "Polygon" | "MultiPoint" | "MultiLineString" | "MultiPolygon",
          "coordinates": [lng, lat] | [[lng, lat], ...] | [[[lng, lat], ...], ...]
        },
        "properties": {
          "name": "string",
          "description": "string",
          "style": object,
          "customProperties": object,
          "createdAt": "datetime",
          "updatedAt": "datetime",
          "layerId": "uuid"
        }
      }
    ]
  }
}
```

#### POST /api/gis/layers/:layerId/features
Create a new feature in a layer.

**Request Body:**
```json
{
  "type": "Feature",
  "geometry": {
    "type": "Point",
    "coordinates": [lng, lat]
  },
  "properties": {
    "name": "string",
    "description": "string",
    "style": object,
    "customProperties": object
  }
}
```

#### PUT /api/gis/features/:featureId
Update a feature.

#### DELETE /api/gis/features/:featureId
Delete a feature.

### Spatial Queries

#### POST /api/gis/spatial/intersects
Find features that intersect with a given geometry.

**Request Body:**
```json
{
  "geometry": {
    "type": "Polygon",
    "coordinates": [[[lng, lat], [lng, lat], [lng, lat], [lng, lat]]]
  },
  "layerIds": ["uuid1", "uuid2"],
  "limit": number
}
```

#### POST /api/gis/spatial/within
Find features within a given distance of a point.

**Request Body:**
```json
{
  "point": [lng, lat],
  "distance": number,
  "units": "meters" | "kilometers" | "miles",
  "layerIds": ["uuid1", "uuid2"]
}
```

## File Operations

### File Upload

#### POST /api/upload/gis
Upload and import GIS files (GeoJSON, KML, GPX, Shapefile).

**Content-Type**: `multipart/form-data`

**Form Data:**
- `file`: The GIS file to upload
- `projectId`: Target project ID
- `layerName`: Name for the new layer (optional)
- `preserveStyles`: Boolean to preserve original styling (optional)

**Response:**
```json
{
  "success": true,
  "data": {
    "layerId": "uuid",
    "layerName": "string",
    "featuresImported": number,
    "bounds": {
      "type": "Polygon",
      "coordinates": [[[lng, lat], [lng, lat], [lng, lat], [lng, lat]]]
    }
  }
}
```

#### GET /api/upload/formats
Get supported file formats and their specifications.

**Response:**
```json
{
  "success": true,
  "data": {
    "formats": [
      {
        "name": "GeoJSON",
        "extensions": [".geojson", ".json"],
        "mimeTypes": ["application/geo+json", "application/json"],
        "maxSize": "10MB",
        "features": ["preserves_properties", "supports_styling"]
      },
      {
        "name": "KML",
        "extensions": [".kml"],
        "mimeTypes": ["application/vnd.google-earth.kml+xml"],
        "maxSize": "10MB",
        "features": ["preserves_styling", "supports_descriptions"]
      }
    ]
  }
}
```

### File Export

#### GET /api/gis/export/layer/:layerId/:format
Export a layer in the specified format.

**Path Parameters:**
- `layerId`: UUID of the layer to export
- `format`: Export format (`geojson`, `kml`, `gpx`)

**Query Parameters:**
- `filename` (optional): Custom filename for download
- `includeStyles` (optional): Include styling information (boolean)

**Response**: File download with appropriate MIME type

#### GET /api/gis/export/project/:projectId/:format
Export an entire project in the specified format.

## Health Check

#### GET /api/health
Check API and database connectivity.

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "datetime",
    "database": {
      "connected": true,
      "postgis": true,
      "version": "PostgreSQL 15.x"
    },
    "services": {
      "upload": "operational",
      "auth": "operational",
      "gis": "operational"
    }
  }
}
```

## Error Handling

All API responses follow a consistent error format:

### Success Response Format
```json
{
  "success": true,
  "data": {...}
}
```

### Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {...},
    "timestamp": "datetime"
  }
}
```

### Common Error Codes

#### Authentication Errors
- `AUTH_TOKEN_MISSING` (401) - No authorization token provided
- `AUTH_TOKEN_INVALID` (401) - Invalid or expired token
- `AUTH_INSUFFICIENT_PERMISSIONS` (403) - User lacks required permissions

#### Validation Errors
- `VALIDATION_ERROR` (400) - Request data validation failed
- `INVALID_GEOMETRY` (400) - Invalid GeoJSON geometry
- `INVALID_FILE_FORMAT` (400) - Unsupported file format

#### Resource Errors
- `RESOURCE_NOT_FOUND` (404) - Requested resource doesn't exist
- `PROJECT_NOT_FOUND` (404) - Project ID not found
- `LAYER_NOT_FOUND` (404) - Layer ID not found
- `FEATURE_NOT_FOUND` (404) - Feature ID not found

#### Server Errors
- `DATABASE_ERROR` (500) - Database operation failed
- `FILE_UPLOAD_ERROR` (500) - File upload processing failed
- `SPATIAL_QUERY_ERROR` (500) - Spatial operation failed

## Rate Limiting

The API implements rate limiting to prevent abuse:

- **General endpoints**: 100 requests per minute per IP
- **Authentication endpoints**: 5 requests per minute per IP
- **File upload endpoints**: 10 requests per hour per user
- **Spatial query endpoints**: 50 requests per minute per user

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## WebSocket Events (Real-time)

MapVue supports real-time collaboration through Socket.io WebSocket connections.

### Connection
```javascript
const socket = io('http://localhost:3001', {
  auth: {
    token: 'jwt_token'
  }
});
```

### Events

#### Join Project Room
```javascript
socket.emit('join-project', { projectId: 'uuid' });
```

#### Feature Updates
```javascript
// Listen for feature changes
socket.on('feature-updated', (data) => {
  // data: { featureId, geometry, properties, userId }
});

// Broadcast feature changes
socket.emit('update-feature', {
  featureId: 'uuid',
  geometry: {...},
  properties: {...}
});
```

#### Layer Updates
```javascript
// Listen for layer changes
socket.on('layer-updated', (data) => {
  // data: { layerId, style, visibility, opacity, userId }
});
```

#### User Presence
```javascript
// User joined project
socket.on('user-joined', (data) => {
  // data: { userId, username, projectId }
});

// User left project
socket.on('user-left', (data) => {
  // data: { userId, projectId }
});
```

## SDK and Client Libraries

### JavaScript/TypeScript Client
```typescript
import { MapVueAPI } from '@mapvue/api-client';

const api = new MapVueAPI({
  baseURL: 'http://localhost:3001/api',
  token: 'jwt_token'
});

// Get projects
const projects = await api.projects.list();

// Create feature
const feature = await api.features.create(layerId, {
  type: 'Feature',
  geometry: { type: 'Point', coordinates: [-74.006, 40.7128] },
  properties: { name: 'New York City' }
});
```

### React Hooks
```typescript
import { useProjects, useLayer, useFeatures } from '@mapvue/react-hooks';

function MapComponent() {
  const { projects, loading } = useProjects();
  const { features } = useFeatures(layerId);
  
  return (
    <div>
      {/* Render map and features */}
    </div>
  );
}
```

---

**For more information and examples, visit the [MapVue GitHub repository](https://github.com/sublyime/mapvue)**