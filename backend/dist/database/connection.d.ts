import { DatabaseConfig } from '../types/database.js';
export declare class Database {
    private pool;
    private static instance;
    constructor(config: DatabaseConfig);
    static getInstance(config?: DatabaseConfig): Database;
    query(text: string, params?: any[]): Promise<import("pg").QueryResult<any>>;
    queryWithCache(text: string, params?: any[], cacheKey?: string, ttl?: number): Promise<any>;
    private queryCache;
    getClient(): Promise<import("pg").PoolClient>;
    transaction<T>(callback: (client: any) => Promise<T>): Promise<T>;
    close(): Promise<void>;
    healthCheck(): Promise<boolean>;
    checkPostGIS(): Promise<boolean>;
}
export declare function getDatabaseConfig(): DatabaseConfig;
export declare function initializeDatabase(): Database;
export declare const db: Database;
//# sourceMappingURL=connection.d.ts.map