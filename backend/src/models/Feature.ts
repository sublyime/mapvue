import { db } from '../database/connection.js';
import {
  Feature,
  CreateFeatureRequest,
  UpdateFeatureRequest,
  FeatureQueryParams,
  BoundsQueryParams,
} from '../types/database.js';

export class FeatureModel {
  static async create(featureData: CreateFeatureRequest, ownerId: string): Promise<Feature> {
    const query = `
      INSERT INTO features (
        layer_id, owner_id, name, description, geometry, properties, style, is_visible
      )
      VALUES ($1, $2, $3, $4, ST_SetSRID(ST_GeomFromGeoJSON($5), 4326), $6, $7, $8)
      RETURNING id, layer_id, owner_id, name, description, 
                ST_AsGeoJSON(geometry)::json as geometry, 
                properties, style, is_visible, created_at, updated_at
    `;
    
    const values = [
      featureData.layer_id,
      ownerId,
      featureData.name || null,
      featureData.description || null,
      JSON.stringify(featureData.geometry),
      featureData.properties || {},
      featureData.style || {},
      featureData.is_visible !== undefined ? featureData.is_visible : true,
    ];
    
    const result = await db.query(query, values);
    return result.rows[0];
  }

  static async findById(id: string, userId?: string): Promise<Feature | null> {
    let query = `
      SELECT f.id, f.layer_id, f.owner_id, f.name, f.description, 
             ST_AsGeoJSON(f.geometry)::json as geometry, 
             f.properties, f.style, f.is_visible, f.created_at, f.updated_at
      FROM features f
      WHERE f.id = $1
    `;
    const values = [id];

    // Check access permissions through layer and project
    if (userId) {
      query = `
        SELECT f.id, f.layer_id, f.owner_id, f.name, f.description, 
               ST_AsGeoJSON(f.geometry)::json as geometry, 
               f.properties, f.style, f.is_visible, f.created_at, f.updated_at
        FROM features f
        LEFT JOIN layers l ON f.layer_id = l.id
        LEFT JOIN projects p ON l.project_id = p.id
        LEFT JOIN project_collaborators pc ON p.id = pc.project_id AND pc.user_id = $2
        WHERE f.id = $1 
          AND (
            f.owner_id = $2 OR 
            l.is_public = true OR 
            p.is_public = true OR 
            p.owner_id = $2 OR 
            l.owner_id = $2 OR
            pc.user_id IS NOT NULL
          )
      `;
      values.push(userId);
    } else {
      query = `
        SELECT f.id, f.layer_id, f.owner_id, f.name, f.description, 
               ST_AsGeoJSON(f.geometry)::json as geometry, 
               f.properties, f.style, f.is_visible, f.created_at, f.updated_at
        FROM features f
        LEFT JOIN layers l ON f.layer_id = l.id
        LEFT JOIN projects p ON l.project_id = p.id
        WHERE f.id = $1 AND (l.is_public = true OR p.is_public = true)
      `;
    }

    const result = await db.query(query, values);
    return result.rows[0] || null;
  }

  static async update(id: string, featureData: UpdateFeatureRequest, userId: string): Promise<Feature | null> {
    // First check if user has permission to update
    const feature = await this.findById(id, userId);
    if (!feature || feature.owner_id !== userId) {
      return null;
    }

    const fields = [];
    const values = [];
    let paramCount = 1;

    if (featureData.name !== undefined) {
      fields.push(`name = $${paramCount++}`);
      values.push(featureData.name);
    }
    if (featureData.description !== undefined) {
      fields.push(`description = $${paramCount++}`);
      values.push(featureData.description);
    }
    if (featureData.geometry !== undefined) {
      fields.push(`geometry = ST_SetSRID(ST_GeomFromGeoJSON($${paramCount++}), 4326)`);
      values.push(JSON.stringify(featureData.geometry));
    }
    if (featureData.properties !== undefined) {
      fields.push(`properties = $${paramCount++}`);
      values.push(featureData.properties);
    }
    if (featureData.style !== undefined) {
      fields.push(`style = $${paramCount++}`);
      values.push(featureData.style);
    }
    if (featureData.is_visible !== undefined) {
      fields.push(`is_visible = $${paramCount++}`);
      values.push(featureData.is_visible);
    }

    if (fields.length === 0) {
      return feature;
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `
      UPDATE features 
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, layer_id, owner_id, name, description, 
                ST_AsGeoJSON(geometry)::json as geometry, 
                properties, style, is_visible, created_at, updated_at
    `;

    const result = await db.query(query, values);
    return result.rows[0] || null;
  }

  static async delete(id: string, userId: string): Promise<boolean> {
    // Check if user is owner
    const feature = await this.findById(id, userId);
    if (!feature || feature.owner_id !== userId) {
      return false;
    }

    const query = 'DELETE FROM features WHERE id = $1 AND owner_id = $2';
    const result = await db.query(query, [id, userId]);
    return result.rowCount > 0;
  }

  static async list(params: FeatureQueryParams, userId?: string): Promise<{ features: Feature[]; total: number }> {
    const { page = 1, limit = 100, layer_id, bounds, search } = params;
    const offset = (page - 1) * limit;

    let whereConditions = [];
    let queryParams = [];
    let paramCount = 1;

    // Base access control
    if (userId) {
      whereConditions.push(`
        (f.owner_id = $${paramCount} OR l.is_public = true OR 
         p.is_public = true OR p.owner_id = $${paramCount} OR l.owner_id = $${paramCount} OR
         EXISTS (SELECT 1 FROM project_collaborators pc WHERE pc.project_id = p.id AND pc.user_id = $${paramCount}))
      `);
      queryParams.push(userId);
      paramCount++;
    } else {
      whereConditions.push('(l.is_public = true OR p.is_public = true)');
    }

    if (layer_id) {
      whereConditions.push(`f.layer_id = $${paramCount++}`);
      queryParams.push(layer_id);
    }

    if (bounds) {
      // Parse bounds as GeoJSON or WKT
      try {
        const boundsGeometry = JSON.parse(bounds);
        whereConditions.push(`ST_Intersects(f.geometry, ST_SetSRID(ST_GeomFromGeoJSON($${paramCount++}), 4326))`);
        queryParams.push(JSON.stringify(boundsGeometry));
      } catch {
        // Try as comma-separated bbox: minx,miny,maxx,maxy
        const coords = bounds.split(',').map(Number);
        if (coords.length === 4) {
          whereConditions.push(`ST_Intersects(f.geometry, ST_MakeEnvelope($${paramCount}, $${paramCount + 1}, $${paramCount + 2}, $${paramCount + 3}, 4326))`);
          queryParams.push(...coords);
          paramCount += 4;
        }
      }
    }

    if (search) {
      whereConditions.push(`(f.name ILIKE $${paramCount} OR f.description ILIKE $${paramCount} OR f.properties::text ILIKE $${paramCount})`);
      queryParams.push(`%${search}%`);
      paramCount++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Count query
    const countQuery = `
      SELECT COUNT(*) 
      FROM features f
      LEFT JOIN layers l ON f.layer_id = l.id
      LEFT JOIN projects p ON l.project_id = p.id
      ${whereClause}
    `;
    const countResult = await db.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].count);

    // Data query
    const dataQuery = `
      SELECT f.id, f.layer_id, f.owner_id, f.name, f.description, 
             ST_AsGeoJSON(f.geometry)::json as geometry, 
             f.properties, f.style, f.is_visible, f.created_at, f.updated_at,
             l.name as layer_name, u.username as owner_username
      FROM features f
      LEFT JOIN layers l ON f.layer_id = l.id
      LEFT JOIN projects p ON l.project_id = p.id
      LEFT JOIN users u ON f.owner_id = u.id
      ${whereClause}
      ORDER BY f.created_at DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;
    
    const result = await db.query(dataQuery, [...queryParams, limit, offset]);
    return { features: result.rows, total };
  }

  static async getByLayer(layerId: string, userId?: string): Promise<Feature[]> {
    const { features } = await this.list({ layer_id: layerId }, userId);
    return features;
  }

  static async getInBounds(bounds: BoundsQueryParams, userId?: string): Promise<Feature[]> {
    const boundsString = `${bounds.minx},${bounds.miny},${bounds.maxx},${bounds.maxy}`;
    const { features } = await this.list({ bounds: boundsString }, userId);
    return features;
  }

  static async search(searchTerm: string, layerId?: string, userId?: string): Promise<Feature[]> {
    const { features } = await this.list({ search: searchTerm, layer_id: layerId }, userId);
    return features;
  }

  static async bulkCreate(featuresData: CreateFeatureRequest[], ownerId: string): Promise<Feature[]> {
    if (featuresData.length === 0) return [];

    const values = [];
    const valueStrings = [];
    let paramCount = 1;

    for (const featureData of featuresData) {
      valueStrings.push(`($${paramCount}, $${paramCount + 1}, $${paramCount + 2}, $${paramCount + 3}, ST_SetSRID(ST_GeomFromGeoJSON($${paramCount + 4}), 4326), $${paramCount + 5}, $${paramCount + 6}, $${paramCount + 7})`);
      values.push(
        featureData.layer_id,
        ownerId,
        featureData.name || null,
        featureData.description || null,
        JSON.stringify(featureData.geometry),
        featureData.properties || {},
        featureData.style || {},
        featureData.is_visible !== undefined ? featureData.is_visible : true
      );
      paramCount += 8;
    }

    const query = `
      INSERT INTO features (
        layer_id, owner_id, name, description, geometry, properties, style, is_visible
      )
      VALUES ${valueStrings.join(', ')}
      RETURNING id, layer_id, owner_id, name, description, 
                ST_AsGeoJSON(geometry)::json as geometry, 
                properties, style, is_visible, created_at, updated_at
    `;

    const result = await db.query(query, values);
    return result.rows;
  }

  static async bulkDelete(ids: string[], userId: string): Promise<number> {
    if (ids.length === 0) return 0;

    const placeholders = ids.map((_, index) => `$${index + 2}`).join(', ');
    const query = `DELETE FROM features WHERE owner_id = $1 AND id IN (${placeholders})`;
    
    const result = await db.query(query, [userId, ...ids]);
    return result.rowCount;
  }

  static async getExtent(layerId: string): Promise<{ bounds: number[] } | null> {
    const query = `
      SELECT ST_Extent(geometry) as extent
      FROM features 
      WHERE layer_id = $1 AND is_visible = true
    `;
    
    const result = await db.query(query, [layerId]);
    const extent = result.rows[0]?.extent;
    
    if (!extent) return null;

    // Parse PostgreSQL box format: BOX(minx miny,maxx maxy)
    const match = extent.match(/BOX\(([^\s]+)\s+([^\s]+),([^\s]+)\s+([^\s]+)\)/);
    if (match) {
      return {
        bounds: [
          parseFloat(match[1]), // minx
          parseFloat(match[2]), // miny
          parseFloat(match[3]), // maxx
          parseFloat(match[4])  // maxy
        ]
      };
    }

    return null;
  }
}