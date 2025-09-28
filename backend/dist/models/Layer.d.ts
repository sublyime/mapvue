import { Layer, CreateLayerRequest, UpdateLayerRequest, LayerQueryParams, LayerStats } from '../types/database';
export declare class LayerModel {
    static create(layerData: CreateLayerRequest, ownerId: string): Promise<Layer>;
    static findById(id: string, userId?: string): Promise<Layer | null>;
    static update(id: string, layerData: UpdateLayerRequest, userId: string): Promise<Layer | null>;
    static delete(id: string, userId: string): Promise<boolean>;
    static list(params: LayerQueryParams, userId?: string): Promise<{
        layers: Layer[];
        total: number;
    }>;
    static getByProject(projectId: string, userId?: string): Promise<Layer[]>;
    static getStats(id: string): Promise<LayerStats | null>;
    static updateOrder(layerId: string, newOrder: number, userId: string): Promise<boolean>;
    static toggleVisibility(layerId: string, userId: string): Promise<Layer | null>;
}
//# sourceMappingURL=Layer.d.ts.map