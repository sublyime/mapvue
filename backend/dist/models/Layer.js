"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LayerModel = void 0;
const connection_1 = require("../database/connection");
const getDatabase = () => {
    return (0, connection_1.initializeDatabase)();
};
class LayerModel {
    static async create(layerData, ownerId) {
        const query = `
      INSERT INTO layers (
        name, description, project_id, owner_id, type, source_type, source_url, 
        source_config, style_config, visible, opacity, min_zoom, max_zoom, 
        layer_order, is_public
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
    `;
        const values = [
            layerData.name,
            layerData.description || null,
            layerData.project_id || null,
            ownerId,
            layerData.type,
            layerData.source_type || null,
            layerData.source_url || null,
            layerData.source_config || {},
            layerData.style_config || {},
            layerData.visible !== undefined ? layerData.visible : true,
            layerData.opacity !== undefined ? layerData.opacity : 1.0,
            layerData.min_zoom !== undefined ? layerData.min_zoom : 0,
            layerData.max_zoom !== undefined ? layerData.max_zoom : 22,
            layerData.layer_order !== undefined ? layerData.layer_order : 0,
            layerData.is_public !== undefined ? layerData.is_public : false,
        ];
        const result = await getDatabase().query(query, values);
        return result.rows[0];
    }
    static async findById(id, userId) {
        let query = 'SELECT * FROM layers WHERE id = $1';
        const values = [id];
        if (userId) {
            query = `
        SELECT l.* FROM layers l
        LEFT JOIN projects p ON l.project_id = p.id
        LEFT JOIN project_collaborators pc ON p.id = pc.project_id AND pc.user_id = $2
        WHERE l.id = $1 
          AND (
            l.owner_id = $2 OR 
            l.is_public = true OR 
            p.is_public = true OR 
            p.owner_id = $2 OR 
            pc.user_id IS NOT NULL
          )
      `;
            values.push(userId);
        }
        else {
            query = `
        SELECT l.* FROM layers l
        LEFT JOIN projects p ON l.project_id = p.id
        WHERE l.id = $1 AND (l.is_public = true OR p.is_public = true)
      `;
        }
        const result = await getDatabase().query(query, values);
        return result.rows[0] || null;
    }
    static async update(id, layerData, userId) {
        const layer = await this.findById(id, userId);
        if (!layer || layer.owner_id !== userId) {
            return null;
        }
        const fields = [];
        const values = [];
        let paramCount = 1;
        if (layerData.name !== undefined) {
            fields.push(`name = $${paramCount++}`);
            values.push(layerData.name);
        }
        if (layerData.description !== undefined) {
            fields.push(`description = $${paramCount++}`);
            values.push(layerData.description);
        }
        if (layerData.source_url !== undefined) {
            fields.push(`source_url = $${paramCount++}`);
            values.push(layerData.source_url);
        }
        if (layerData.source_config !== undefined) {
            fields.push(`source_config = $${paramCount++}`);
            values.push(layerData.source_config);
        }
        if (layerData.style_config !== undefined) {
            fields.push(`style_config = $${paramCount++}`);
            values.push(layerData.style_config);
        }
        if (layerData.visible !== undefined) {
            fields.push(`visible = $${paramCount++}`);
            values.push(layerData.visible);
        }
        if (layerData.opacity !== undefined) {
            fields.push(`opacity = $${paramCount++}`);
            values.push(layerData.opacity);
        }
        if (layerData.min_zoom !== undefined) {
            fields.push(`min_zoom = $${paramCount++}`);
            values.push(layerData.min_zoom);
        }
        if (layerData.max_zoom !== undefined) {
            fields.push(`max_zoom = $${paramCount++}`);
            values.push(layerData.max_zoom);
        }
        if (layerData.layer_order !== undefined) {
            fields.push(`layer_order = $${paramCount++}`);
            values.push(layerData.layer_order);
        }
        if (layerData.is_public !== undefined) {
            fields.push(`is_public = $${paramCount++}`);
            values.push(layerData.is_public);
        }
        if (fields.length === 0) {
            return layer;
        }
        fields.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(id);
        const query = `
      UPDATE layers 
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;
        const result = await getDatabase().query(query, values);
        return result.rows[0] || null;
    }
    static async delete(id, userId) {
        const layer = await this.findById(id, userId);
        if (!layer || layer.owner_id !== userId) {
            return false;
        }
        const query = 'DELETE FROM layers WHERE id = $1 AND owner_id = $2';
        const result = await getDatabase().query(query, [id, userId]);
        return (result.rowCount ?? 0) > 0;
    }
    static async list(params, userId) {
        const { page = 1, limit = 20, project_id, owner_id, type, is_public } = params;
        const offset = (page - 1) * limit;
        let whereConditions = [];
        let queryParams = [];
        let paramCount = 1;
        if (userId) {
            whereConditions.push(`
        (l.owner_id = $${paramCount} OR l.is_public = true OR 
         p.is_public = true OR p.owner_id = $${paramCount} OR
         EXISTS (SELECT 1 FROM project_collaborators pc WHERE pc.project_id = p.id AND pc.user_id = $${paramCount}))
      `);
            queryParams.push(userId);
            paramCount++;
        }
        else {
            whereConditions.push('(l.is_public = true OR p.is_public = true)');
        }
        if (project_id) {
            whereConditions.push(`l.project_id = $${paramCount++}`);
            queryParams.push(project_id);
        }
        if (owner_id) {
            whereConditions.push(`l.owner_id = $${paramCount++}`);
            queryParams.push(owner_id);
        }
        if (type) {
            whereConditions.push(`l.type = $${paramCount++}`);
            queryParams.push(type);
        }
        if (is_public !== undefined) {
            whereConditions.push(`l.is_public = $${paramCount++}`);
            queryParams.push(is_public);
        }
        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
        const countQuery = `
      SELECT COUNT(*) 
      FROM layers l
      LEFT JOIN projects p ON l.project_id = p.id
      ${whereClause}
    `;
        const countResult = await getDatabase().query(countQuery, queryParams);
        const total = parseInt(countResult.rows[0].count);
        const dataQuery = `
      SELECT l.*, u.username as owner_username, p.name as project_name
      FROM layers l
      LEFT JOIN users u ON l.owner_id = u.id
      LEFT JOIN projects p ON l.project_id = p.id
      ${whereClause}
      ORDER BY l.layer_order ASC, l.updated_at DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;
        const result = await getDatabase().query(dataQuery, [...queryParams, limit, offset]);
        return { layers: result.rows, total };
    }
    static async getByProject(projectId, userId) {
        const { layers } = await this.list({ project_id: projectId }, userId);
        return layers;
    }
    static async getStats(id) {
        const query = `
      SELECT * FROM v_layer_stats WHERE id = $1
    `;
        const result = await getDatabase().query(query, [id]);
        return result.rows[0] || null;
    }
    static async updateOrder(layerId, newOrder, userId) {
        const layer = await this.findById(layerId, userId);
        if (!layer || layer.owner_id !== userId) {
            return false;
        }
        const query = 'UPDATE layers SET layer_order = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2';
        const result = await getDatabase().query(query, [newOrder, layerId]);
        return (result.rowCount ?? 0) > 0;
    }
    static async toggleVisibility(layerId, userId) {
        const layer = await this.findById(layerId, userId);
        if (!layer || layer.owner_id !== userId) {
            return null;
        }
        const query = `
      UPDATE layers 
      SET visible = NOT visible, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $1 
      RETURNING *
    `;
        const result = await getDatabase().query(query, [layerId]);
        return result.rows[0] || null;
    }
}
exports.LayerModel = LayerModel;
//# sourceMappingURL=Layer.js.map