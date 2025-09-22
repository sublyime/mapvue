import { apiClient } from './api';

// GIS Data Types
export interface GISFeature {
  id?: string;
  type: 'Feature';
  geometry: any; // More flexible geometry type
  properties: {
    name?: string;
    description?: string;
    style?: any;
    [key: string]: any;
  };
}

export interface GISLayer {
  id: string;
  name: string;
  type: 'vector' | 'raster' | 'tile';
  features?: GISFeature[];
  url?: string;
  styleConfig?: any;
  visible: boolean;
  opacity: number;
  projectId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GISProject {
  id: string;
  name: string;
  description?: string;
  bounds?: number[];
  layers: GISLayer[];
  createdAt: string;
  updatedAt: string;
}

// GIS API Service
export class GISApiService {
  // Projects
  async getProjects(): Promise<GISProject[]> {
    const response = await apiClient.get<{ projects: GISProject[] }>('/api/gis/projects');
    return response.projects;
  }

  async getProject(id: string): Promise<GISProject> {
    const response = await apiClient.get<{ project: GISProject }>(`/api/gis/projects/${id}`);
    return response.project;
  }

  async createProject(data: Partial<GISProject>): Promise<GISProject> {
    const response = await apiClient.post<{ project: GISProject }>('/api/gis/projects', data);
    return response.project;
  }

  async updateProject(id: string, data: Partial<GISProject>): Promise<GISProject> {
    const response = await apiClient.put<{ project: GISProject }>(`/api/gis/projects/${id}`, data);
    return response.project;
  }

  async deleteProject(id: string): Promise<void> {
    await apiClient.delete(`/api/gis/projects/${id}`);
  }

  // Layers
  async getLayers(projectId?: string): Promise<GISLayer[]> {
    const url = projectId ? `/api/gis/layers?project_id=${projectId}` : '/api/gis/layers';
    const response = await apiClient.get<{ layers: GISLayer[] }>(url);
    return response.layers;
  }

  async getLayer(id: string): Promise<GISLayer> {
    const response = await apiClient.get<{ layer: GISLayer }>(`/api/gis/layers/${id}`);
    return response.layer;
  }

  async createLayer(data: Partial<GISLayer>): Promise<GISLayer> {
    const response = await apiClient.post<{ layer: GISLayer }>('/api/gis/layers', data);
    return response.layer;
  }

  async updateLayer(id: string, data: Partial<GISLayer>): Promise<GISLayer> {
    const response = await apiClient.put<{ layer: GISLayer }>(`/api/gis/layers/${id}`, data);
    return response.layer;
  }

  async deleteLayer(id: string): Promise<void> {
    await apiClient.delete(`/api/gis/layers/${id}`);
  }

  // Features
  async getFeatures(layerId: string): Promise<GISFeature[]> {
    const response = await apiClient.get<{ features: GISFeature[] }>(`/api/gis/layers/${layerId}/features`);
    return response.features;
  }

  async createFeature(layerId: string, feature: GISFeature): Promise<GISFeature> {
    const response = await apiClient.post<{ feature: GISFeature }>(`/api/gis/layers/${layerId}/features`, feature);
    return response.feature;
  }

  async updateFeature(layerId: string, featureId: string, feature: Partial<GISFeature>): Promise<GISFeature> {
    const response = await apiClient.put<{ feature: GISFeature }>(`/api/gis/layers/${layerId}/features/${featureId}`, feature);
    return response.feature;
  }

  async deleteFeature(layerId: string, featureId: string): Promise<void> {
    await apiClient.delete(`/api/gis/layers/${layerId}/features/${featureId}`);
  }

  async bulkCreateFeatures(layerId: string, features: GISFeature[]): Promise<GISFeature[]> {
    const response = await apiClient.post<{ features: GISFeature[] }>(`/api/gis/layers/${layerId}/features/bulk`, { features });
    return response.features;
  }

  // File Operations
  async uploadGISFile(file: File, projectId?: string): Promise<GISLayer> {
    const response = await apiClient.uploadFile<{ layer: GISLayer }>('/api/upload/gis', file, { projectId });
    return response.layer;
  }

  async exportLayer(layerId: string, format: 'geojson' | 'kml' | 'gpx'): Promise<Blob> {
    const response = await fetch(`${apiClient['baseURL']}/api/gis/layers/${layerId}/export?format=${format}`, {
      method: 'GET',
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error(`Export failed: ${response.statusText}`);
    }
    
    return response.blob();
  }

  // Search and Query
  async searchFeatures(query: string, bounds?: number[]): Promise<GISFeature[]> {
    const params = new URLSearchParams({ q: query });
    if (bounds) {
      params.append('bounds', bounds.join(','));
    }
    
    const response = await apiClient.get<{ features: GISFeature[] }>(`/api/gis/search?${params}`);
    return response.features;
  }

  async getFeaturesInBounds(bounds: number[]): Promise<GISFeature[]> {
    const response = await apiClient.get<{ features: GISFeature[] }>(`/api/gis/features/bounds?bounds=${bounds.join(',')}`);
    return response.features;
  }
}

// Create singleton instance
export const gisApi = new GISApiService();
export default gisApi;