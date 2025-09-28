import { Project, CreateProjectRequest, UpdateProjectRequest, ProjectQueryParams, ProjectStats } from '../types/database';
export declare class ProjectModel {
    static create(projectData: CreateProjectRequest, ownerId: string): Promise<Project>;
    static findById(id: string, userId?: string): Promise<Project | null>;
    static update(id: string, projectData: UpdateProjectRequest, userId: string): Promise<Project | null>;
    static delete(id: string, userId: string): Promise<boolean>;
    static list(params: ProjectQueryParams, userId?: string): Promise<{
        projects: Project[];
        total: number;
    }>;
    static getStats(id: string): Promise<ProjectStats | null>;
    static getUserProjects(userId: string, params?: ProjectQueryParams): Promise<{
        projects: Project[];
        total: number;
    }>;
    static getPublicProjects(params?: ProjectQueryParams): Promise<{
        projects: Project[];
        total: number;
    }>;
    static getSharedProjects(userId: string, params?: ProjectQueryParams): Promise<{
        projects: Project[];
        total: number;
    }>;
}
//# sourceMappingURL=Project.d.ts.map