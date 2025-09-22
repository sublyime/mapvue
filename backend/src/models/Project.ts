import { initializeDatabase } from '../database/connection';
import {
  Project,
  CreateProjectRequest,
  UpdateProjectRequest,
  ProjectQueryParams,
  ProjectStats,
} from '../types/database';

// Helper function to get database instance
const getDatabase = () => {
  return initializeDatabase();
};

export class ProjectModel {
  static async create(projectData: CreateProjectRequest, ownerId: string): Promise<Project> {
    const query = `
      INSERT INTO projects (name, description, owner_id, is_public, bounds, default_zoom, default_center, settings)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    
    const values = [
      projectData.name,
      projectData.description || null,
      ownerId,
      projectData.is_public || false,
      projectData.bounds ? JSON.stringify(projectData.bounds) : null,
      projectData.default_zoom || 10,
      projectData.default_center ? JSON.stringify(projectData.default_center) : null,
      projectData.settings || {},
    ];
    
    const result = await getDatabase().query(query, values);
    return result.rows[0];
  }

  static async findById(id: string, userId?: string): Promise<Project | null> {
    let query = 'SELECT * FROM projects WHERE id = $1';
    const values = [id];

    // If userId is provided, check if user has access (owner or collaborator or public)
    if (userId) {
      query = `
        SELECT p.* FROM projects p
        LEFT JOIN project_collaborators pc ON p.id = pc.project_id AND pc.user_id = $2
        WHERE p.id = $1 
          AND (p.owner_id = $2 OR p.is_public = true OR pc.user_id IS NOT NULL)
      `;
      values.push(userId);
    }

    const result = await getDatabase().query(query, values);
    return result.rows[0] || null;
  }

  static async update(id: string, projectData: UpdateProjectRequest, userId: string): Promise<Project | null> {
    // First check if user has permission to update
    const project = await this.findById(id, userId);
    if (!project || project.owner_id !== userId) {
      return null;
    }

    const fields = [];
    const values = [];
    let paramCount = 1;

    if (projectData.name !== undefined) {
      fields.push(`name = $${paramCount++}`);
      values.push(projectData.name);
    }
    if (projectData.description !== undefined) {
      fields.push(`description = $${paramCount++}`);
      values.push(projectData.description);
    }
    if (projectData.is_public !== undefined) {
      fields.push(`is_public = $${paramCount++}`);
      values.push(projectData.is_public);
    }
    if (projectData.bounds !== undefined) {
      fields.push(`bounds = $${paramCount++}`);
      values.push(projectData.bounds ? JSON.stringify(projectData.bounds) : null);
    }
    if (projectData.default_zoom !== undefined) {
      fields.push(`default_zoom = $${paramCount++}`);
      values.push(projectData.default_zoom);
    }
    if (projectData.default_center !== undefined) {
      fields.push(`default_center = $${paramCount++}`);
      values.push(projectData.default_center ? JSON.stringify(projectData.default_center) : null);
    }
    if (projectData.settings !== undefined) {
      fields.push(`settings = $${paramCount++}`);
      values.push(projectData.settings);
    }

    if (fields.length === 0) {
      return project;
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `
      UPDATE projects 
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await getDatabase().query(query, values);
    return result.rows[0] || null;
  }

  static async delete(id: string, userId: string): Promise<boolean> {
    // Check if user is owner
    const project = await this.findById(id, userId);
    if (!project || project.owner_id !== userId) {
      return false;
    }

    const query = 'DELETE FROM projects WHERE id = $1 AND owner_id = $2';
    const result = await getDatabase().query(query, [id, userId]);
    return result.rowCount > 0;
  }

  static async list(params: ProjectQueryParams, userId?: string): Promise<{ projects: Project[]; total: number }> {
    const { page = 1, limit = 20, owner_id, is_public, search } = params;
    const offset = (page - 1) * limit;

    let whereConditions = [];
    let queryParams = [];
    let paramCount = 1;

    // Base access control
    if (userId) {
      whereConditions.push(`
        (p.owner_id = $${paramCount} OR p.is_public = true OR 
         EXISTS (SELECT 1 FROM project_collaborators pc WHERE pc.project_id = p.id AND pc.user_id = $${paramCount}))
      `);
      queryParams.push(userId);
      paramCount++;
    } else {
      whereConditions.push('p.is_public = true');
    }

    if (owner_id) {
      whereConditions.push(`p.owner_id = $${paramCount++}`);
      queryParams.push(owner_id);
    }

    if (is_public !== undefined) {
      whereConditions.push(`p.is_public = $${paramCount++}`);
      queryParams.push(is_public);
    }

    if (search) {
      whereConditions.push(`(p.name ILIKE $${paramCount} OR p.description ILIKE $${paramCount})`);
      queryParams.push(`%${search}%`);
      paramCount++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Count query
    const countQuery = `
      SELECT COUNT(*) 
      FROM projects p
      ${whereClause}
    `;
    const countResult = await getDatabase().query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].count);

    // Data query
    const dataQuery = `
      SELECT p.*, u.username as owner_username
      FROM projects p
      LEFT JOIN users u ON p.owner_id = u.id
      ${whereClause}
      ORDER BY p.updated_at DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;
    
    const result = await getDatabase().query(dataQuery, [...queryParams, limit, offset]);
    return { projects: result.rows, total };
  }

  static async getStats(id: string): Promise<ProjectStats | null> {
    const query = `
      SELECT * FROM v_project_stats WHERE id = $1
    `;
    const result = await getDatabase().query(query, [id]);
    return result.rows[0] || null;
  }

  static async getUserProjects(userId: string, params: ProjectQueryParams = {}): Promise<{ projects: Project[]; total: number }> {
    return this.list({ ...params, owner_id: userId }, userId);
  }

  static async getPublicProjects(params: ProjectQueryParams = {}): Promise<{ projects: Project[]; total: number }> {
    return this.list({ ...params, is_public: true });
  }

  static async getSharedProjects(userId: string, params: ProjectQueryParams = {}): Promise<{ projects: Project[]; total: number }> {
    const { page = 1, limit = 20 } = params;
    const offset = (page - 1) * limit;

    const countQuery = `
      SELECT COUNT(DISTINCT p.id)
      FROM projects p
      INNER JOIN project_collaborators pc ON p.id = pc.project_id
      WHERE pc.user_id = $1 AND p.owner_id != $1
    `;
    const countResult = await getDatabase().query(countQuery, [userId]);
    const total = parseInt(countResult.rows[0].count);

    const dataQuery = `
      SELECT DISTINCT p.*, u.username as owner_username, pc.role as user_role
      FROM projects p
      INNER JOIN project_collaborators pc ON p.id = pc.project_id
      LEFT JOIN users u ON p.owner_id = u.id
      WHERE pc.user_id = $1 AND p.owner_id != $1
      ORDER BY p.updated_at DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await getDatabase().query(dataQuery, [userId, limit, offset]);
    return { projects: result.rows, total };
  }
}
