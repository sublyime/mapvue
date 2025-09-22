import { useState, useEffect, useCallback } from 'react';
import { gisApi } from '../services/gisApi';
import type { GISLayer, GISFeature, GISProject } from '../services/gisApi';

// Custom hook for projects
export function useProjects() {
  const [projects, setProjects] = useState<GISProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await gisApi.getProjects();
      setProjects(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  }, []);

  const createProject = useCallback(async (projectData: Partial<GISProject>) => {
    try {
      const newProject = await gisApi.createProject(projectData);
      setProjects(prev => [newProject, ...prev]);
      return newProject;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project');
      throw err;
    }
  }, []);

  const updateProject = useCallback(async (id: string, projectData: Partial<GISProject>) => {
    try {
      const updatedProject = await gisApi.updateProject(id, projectData);
      setProjects(prev => prev.map(p => p.id === id ? updatedProject : p));
      return updatedProject;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update project');
      throw err;
    }
  }, []);

  const deleteProject = useCallback(async (id: string) => {
    try {
      await gisApi.deleteProject(id);
      setProjects(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete project');
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return {
    projects,
    loading,
    error,
    refetch: fetchProjects,
    createProject,
    updateProject,
    deleteProject
  };
}

// Custom hook for layers
export function useLayers(projectId?: string) {
  const [layers, setLayers] = useState<GISLayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLayers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await gisApi.getLayers(projectId);
      setLayers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch layers');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const createLayer = useCallback(async (layerData: Partial<GISLayer>) => {
    try {
      const newLayer = await gisApi.createLayer(layerData);
      setLayers(prev => [newLayer, ...prev]);
      return newLayer;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create layer');
      throw err;
    }
  }, []);

  const updateLayer = useCallback(async (id: string, layerData: Partial<GISLayer>) => {
    try {
      const updatedLayer = await gisApi.updateLayer(id, layerData);
      setLayers(prev => prev.map(l => l.id === id ? updatedLayer : l));
      return updatedLayer;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update layer');
      throw err;
    }
  }, []);

  const deleteLayer = useCallback(async (id: string) => {
    try {
      await gisApi.deleteLayer(id);
      setLayers(prev => prev.filter(l => l.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete layer');
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchLayers();
  }, [fetchLayers]);

  return {
    layers,
    loading,
    error,
    refetch: fetchLayers,
    createLayer,
    updateLayer,
    deleteLayer
  };
}

// Custom hook for features
export function useFeatures(layerId?: string) {
  const [features, setFeatures] = useState<GISFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFeatures = useCallback(async () => {
    if (!layerId) {
      setFeatures([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await gisApi.getFeatures(layerId);
      setFeatures(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch features');
    } finally {
      setLoading(false);
    }
  }, [layerId]);

  const createFeature = useCallback(async (feature: GISFeature) => {
    if (!layerId) throw new Error('Layer ID is required');
    
    try {
      const newFeature = await gisApi.createFeature(layerId, feature);
      setFeatures(prev => [newFeature, ...prev]);
      return newFeature;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create feature');
      throw err;
    }
  }, [layerId]);

  const updateFeature = useCallback(async (featureId: string, featureData: Partial<GISFeature>) => {
    if (!layerId) throw new Error('Layer ID is required');
    
    try {
      const updatedFeature = await gisApi.updateFeature(layerId, featureId, featureData);
      setFeatures(prev => prev.map(f => f.id === featureId ? updatedFeature : f));
      return updatedFeature;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update feature');
      throw err;
    }
  }, [layerId]);

  const deleteFeature = useCallback(async (featureId: string) => {
    if (!layerId) throw new Error('Layer ID is required');
    
    try {
      await gisApi.deleteFeature(layerId, featureId);
      setFeatures(prev => prev.filter(f => f.id !== featureId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete feature');
      throw err;
    }
  }, [layerId]);

  const bulkCreateFeatures = useCallback(async (newFeatures: GISFeature[]) => {
    if (!layerId) throw new Error('Layer ID is required');
    
    try {
      const createdFeatures = await gisApi.bulkCreateFeatures(layerId, newFeatures);
      setFeatures(prev => [...createdFeatures, ...prev]);
      return createdFeatures;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create features');
      throw err;
    }
  }, [layerId]);

  useEffect(() => {
    fetchFeatures();
  }, [fetchFeatures]);

  return {
    features,
    loading,
    error,
    refetch: fetchFeatures,
    createFeature,
    updateFeature,
    deleteFeature,
    bulkCreateFeatures
  };
}

// Custom hook for file operations
export function useFileOperations() {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const uploadFile = useCallback(async (file: File, projectId?: string) => {
    try {
      setUploading(true);
      setUploadError(null);
      const layer = await gisApi.uploadGISFile(file, projectId);
      return layer;
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to upload file';
      setUploadError(error);
      throw new Error(error);
    } finally {
      setUploading(false);
    }
  }, []);

  const exportLayer = useCallback(async (layerId: string, format: 'geojson' | 'kml' | 'gpx') => {
    try {
      const blob = await gisApi.exportLayer(layerId, format);
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `layer-export.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to export layer');
    }
  }, []);

  return {
    uploading,
    uploadError,
    uploadFile,
    exportLayer
  };
}