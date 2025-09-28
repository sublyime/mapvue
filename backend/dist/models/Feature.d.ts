import { Feature, CreateFeatureRequest, UpdateFeatureRequest, FeatureQueryParams, BoundsQueryParams } from '../types/database';
export declare class FeatureModel {
    static create(featureData: CreateFeatureRequest, ownerId: string): Promise<Feature>;
    static findById(id: string, userId?: string): Promise<Feature | null>;
    static update(id: string, featureData: UpdateFeatureRequest, userId: string): Promise<Feature | null>;
    static delete(id: string, userId: string): Promise<boolean>;
    static list(params: FeatureQueryParams, userId?: string): Promise<{
        features: Feature[];
        total: number;
    }>;
    static getByLayer(layerId: string, userId?: string): Promise<Feature[]>;
    static getInBounds(bounds: BoundsQueryParams, userId?: string): Promise<Feature[]>;
    static search(searchTerm: string, layerId?: string, userId?: string): Promise<Feature[]>;
    static bulkCreate(featuresData: CreateFeatureRequest[], ownerId: string): Promise<Feature[]>;
    static bulkDelete(ids: string[], userId: string): Promise<number>;
    static getExtent(layerId: string): Promise<{
        bounds: number[];
    } | null>;
}
//# sourceMappingURL=Feature.d.ts.map