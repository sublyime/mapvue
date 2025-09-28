import { Pool, PoolConfig } from 'pg';
import { DatabaseConfig } from '../types/database.js';

export class Database {
  private pool: Pool;
  private static instance: Database;

  constructor(config: DatabaseConfig) {
    const poolConfig: PoolConfig = {
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

    this.pool = new Pool(poolConfig);

    // Handle pool errors
    this.pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });
  }

  static getInstance(config?: DatabaseConfig): Database {
    if (!Database.instance) {
      if (!config) {
        throw new Error('Database configuration is required for first initialization');
      }
      Database.instance = new Database(config);
    }
    return Database.instance;
  }

  async query(text: string, params?: any[]) {
    const start = Date.now();
    try {
      const result = await this.pool.query(text, params);
      const duration = Date.now() - start;
      
      // Only log slow queries in production
      if (process.env.NODE_ENV === 'development' || duration > 1000) {
        console.log('Query executed', {
          text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
          duration: `${duration}ms`,
          rows: result.rowCount,
          slow: duration > 1000
        });
      }
      
      return result;
    } catch (error) {
      console.error('Database query error', { 
        text: text.substring(0, 100), 
        params: process.env.NODE_ENV === 'development' ? params : '[hidden]', 
        error: error instanceof Error ? error.message : error 
      });
      throw error;
    }
  }

  async queryWithCache(text: string, params?: any[], cacheKey?: string, ttl: number = 300) {
    // Simple in-memory cache implementation for common queries
    // In production, consider using Redis
    if (cacheKey && this.queryCache.has(cacheKey)) {
      const cached = this.queryCache.get(cacheKey)!;
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

  private queryCache = new Map<string, { result: any; timestamp: number }>();

  async getClient() {
    return await this.pool.connect();
  }

  async transaction<T>(callback: (client: any) => Promise<T>): Promise<T> {
    const client = await this.getClient();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async close() {
    await this.pool.end();
  }

  async healthCheck(): Promise<boolean> {
    try {
      const result = await this.query('SELECT 1 as healthy');
      return result.rows.length > 0 && result.rows[0].healthy === 1;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }

  async checkPostGIS(): Promise<boolean> {
    try {
      const result = await this.query('SELECT PostGIS_Version() as version');
      console.log('PostGIS version:', result.rows[0]?.version);
      return true;
    } catch (error) {
      console.error('PostGIS check failed:', error);
      return false;
    }
  }
}

// Database configuration from environment variables
export function getDatabaseConfig(): DatabaseConfig {
  return {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'mapvue',
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'ala1nna',
    ssl: process.env.DB_SSL === 'true',
    pool: {
      min: parseInt(process.env.DB_POOL_MIN || '2'),
      max: parseInt(process.env.DB_POOL_MAX || '10'),
      idle: parseInt(process.env.DB_POOL_IDLE || '30'),
    },
  };
}

// Initialize database connection
export function initializeDatabase(): Database {
  const config = getDatabaseConfig();
  return Database.getInstance(config);
}

// Export a default instance
export const db = initializeDatabase();