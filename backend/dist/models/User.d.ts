import { User, CreateUserRequest, UpdateUserRequest, PaginationParams } from '../types/database';
export declare class UserModel {
    static create(userData: CreateUserRequest): Promise<User>;
    static findById(id: string): Promise<User | null>;
    static findByEmail(email: string): Promise<User | null>;
    static findByUsername(username: string): Promise<User | null>;
    static update(id: string, userData: UpdateUserRequest): Promise<User | null>;
    static updateLastLogin(id: string): Promise<void>;
    static verifyEmail(id: string): Promise<void>;
    static changePassword(id: string, newPassword: string): Promise<void>;
    static verifyPassword(user: User, password: string): Promise<boolean>;
    static softDelete(id: string): Promise<void>;
    static list(params?: PaginationParams): Promise<{
        users: User[];
        total: number;
    }>;
    static search(searchTerm: string, params?: PaginationParams): Promise<{
        users: User[];
        total: number;
    }>;
}
//# sourceMappingURL=User.d.ts.map