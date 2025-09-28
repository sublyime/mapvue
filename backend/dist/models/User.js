"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModel = void 0;
const connection_1 = require("../database/connection");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const getDatabase = () => {
    return (0, connection_1.initializeDatabase)();
};
class UserModel {
    static async create(userData) {
        const hashedPassword = await bcryptjs_1.default.hash(userData.password, 10);
        const query = `
      INSERT INTO users (username, email, password_hash, first_name, last_name)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
        const values = [
            userData.username,
            userData.email,
            hashedPassword,
            userData.first_name || null,
            userData.last_name || null,
        ];
        const result = await getDatabase().query(query, values);
        return result.rows[0];
    }
    static async findById(id) {
        const query = 'SELECT * FROM users WHERE id = $1 AND is_active = true';
        const result = await getDatabase().query(query, [id]);
        return result.rows[0] || null;
    }
    static async findByEmail(email) {
        const query = 'SELECT * FROM users WHERE email = $1 AND is_active = true';
        const result = await getDatabase().query(query, [email]);
        return result.rows[0] || null;
    }
    static async findByUsername(username) {
        const query = 'SELECT * FROM users WHERE username = $1 AND is_active = true';
        const result = await getDatabase().query(query, [username]);
        return result.rows[0] || null;
    }
    static async update(id, userData) {
        const fields = [];
        const values = [];
        let paramCount = 1;
        if (userData.first_name !== undefined) {
            fields.push(`first_name = $${paramCount++}`);
            values.push(userData.first_name);
        }
        if (userData.last_name !== undefined) {
            fields.push(`last_name = $${paramCount++}`);
            values.push(userData.last_name);
        }
        if (userData.avatar_url !== undefined) {
            fields.push(`avatar_url = $${paramCount++}`);
            values.push(userData.avatar_url);
        }
        if (fields.length === 0) {
            return await this.findById(id);
        }
        fields.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(id);
        const query = `
      UPDATE users 
      SET ${fields.join(', ')}
      WHERE id = $${paramCount} AND is_active = true
      RETURNING *
    `;
        const result = await getDatabase().query(query, values);
        return result.rows[0] || null;
    }
    static async updateLastLogin(id) {
        const query = 'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1';
        await getDatabase().query(query, [id]);
    }
    static async verifyEmail(id) {
        const query = 'UPDATE users SET email_verified = true WHERE id = $1';
        await getDatabase().query(query, [id]);
    }
    static async changePassword(id, newPassword) {
        const hashedPassword = await bcryptjs_1.default.hash(newPassword, 10);
        const query = 'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2';
        await getDatabase().query(query, [hashedPassword, id]);
    }
    static async verifyPassword(user, password) {
        return await bcryptjs_1.default.compare(password, user.password_hash);
    }
    static async softDelete(id) {
        const query = 'UPDATE users SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1';
        await getDatabase().query(query, [id]);
    }
    static async list(params = {}) {
        const { page = 1, limit = 20 } = params;
        const offset = (page - 1) * limit;
        const countQuery = 'SELECT COUNT(*) FROM users WHERE is_active = true';
        const countResult = await getDatabase().query(countQuery);
        const total = parseInt(countResult.rows[0].count);
        const query = `
      SELECT id, username, email, first_name, last_name, avatar_url, role, 
             email_verified, last_login, created_at, updated_at
      FROM users 
      WHERE is_active = true
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `;
        const result = await getDatabase().query(query, [limit, offset]);
        return { users: result.rows, total };
    }
    static async search(searchTerm, params = {}) {
        const { page = 1, limit = 20 } = params;
        const offset = (page - 1) * limit;
        const searchPattern = `%${searchTerm}%`;
        const countQuery = `
      SELECT COUNT(*) 
      FROM users 
      WHERE is_active = true 
        AND (username ILIKE $1 OR email ILIKE $1 OR first_name ILIKE $1 OR last_name ILIKE $1)
    `;
        const countResult = await getDatabase().query(countQuery, [searchPattern]);
        const total = parseInt(countResult.rows[0].count);
        const query = `
      SELECT id, username, email, first_name, last_name, avatar_url, role, 
             email_verified, last_login, created_at, updated_at
      FROM users 
      WHERE is_active = true 
        AND (username ILIKE $1 OR email ILIKE $1 OR first_name ILIKE $1 OR last_name ILIKE $1)
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;
        const result = await getDatabase().query(query, [searchPattern, limit, offset]);
        return { users: result.rows, total };
    }
}
exports.UserModel = UserModel;
//# sourceMappingURL=User.js.map