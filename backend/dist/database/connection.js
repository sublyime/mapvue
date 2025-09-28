"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = exports.Database = void 0;
exports.getDatabaseConfig = getDatabaseConfig;
exports.initializeDatabase = initializeDatabase;
const pg_1 = require("pg");
class Database {
    constructor(config) {
        this.queryCache = new Map();
        const poolConfig = {
            host: config.host,
            port: config.port,
            database: config.database,
            user: config.username,
            password: config.password,
            ssl: config.ssl ? { rejectUnauthorized: false } : false,
            min: config.pool?.min || 2,
            max: config.pool?.max || 10,
            idleTimeoutMillis: (config.pool?.idle || 30) * 1000,
            connectionTimeoutMillis: 10000,
        };
        this.pool = new pg_1.Pool(poolConfig);
        this.pool.on('error', (err) => {
            console.error('Unexpected error on idle client', err);
        });
    }
    static getInstance(config) {
        if (!Database.instance) {
            if (!config) {
                throw new Error('Database configuration is required for first initialization');
            }
            Database.instance = new Database(config);
        }
        return Database.instance;
    }
    async query(text, params) {
        const start = Date.now();
        try {
            const result = await this.pool.query(text, params);
            const duration = Date.now() - start;
            if (process.env.NODE_ENV === 'development' || duration > 1000) {
                console.log('Query executed', {
                    text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
                    duration: `${duration}ms`,
                    rows: result.rowCount,
                    slow: duration > 1000
                });
            }
            return result;
        }
        catch (error) {
            console.error('Database query error', {
                text: text.substring(0, 100),
                params: process.env.NODE_ENV === 'development' ? params : '[hidden]',
                error: error instanceof Error ? error.message : error
            });
            throw error;
        }
    }
    async queryWithCache(text, params, cacheKey, ttl = 300) {
        if (cacheKey && this.queryCache.has(cacheKey)) {
            const cached = this.queryCache.get(cacheKey);
            if (Date.now() - cached.timestamp < ttl * 1000) {
                return cached.result;
            }
        }
        const result = await this.query(text, params);
        if (cacheKey) {
            this.queryCache.set(cacheKey, { result, timestamp: Date.now() });
        }
        return result;
    }
    async getClient() {
        return await this.pool.connect();
    }
    async transaction(callback) {
        const client = await this.getClient();
        try {
            await client.query('BEGIN');
            const result = await callback(client);
            await client.query('COMMIT');
            return result;
        }
        catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }
        finally {
            client.release();
        }
    }
    async close() {
        await this.pool.end();
    }
    async healthCheck() {
        try {
            const result = await this.query('SELECT 1 as healthy');
            return result.rows.length > 0 && result.rows[0].healthy === 1;
        }
        catch (error) {
            console.error('Database health check failed:', error);
            return false;
        }
    }
    async checkPostGIS() {
        try {
            const result = await this.query('SELECT PostGIS_Version() as version');
            console.log('PostGIS version:', result.rows[0]?.version);
            return true;
        }
        catch (error) {
            console.error('PostGIS check failed:', error);
            return false;
        }
    }
}
exports.Database = Database;
function getDatabaseConfig() {
    return {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'mapvue',
        username: process.env.DB_USER || 'mapvue_user',
        password: process.env.DB_PASSWORD || 'mapvue_password',
        ssl: process.env.DB_SSL === 'true',
        pool: {
            min: parseInt(process.env.DB_POOL_MIN || '2'),
            max: parseInt(process.env.DB_POOL_MAX || '10'),
            idle: parseInt(process.env.DB_POOL_IDLE || '30'),
        },
    };
}
function initializeDatabase() {
    const config = getDatabaseConfig();
    return Database.getInstance(config);
}
exports.db = initializeDatabase();
//# sourceMappingURL=connection.js.map