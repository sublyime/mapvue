import React, { useState, useEffect, useRef } from 'react';
import { Map, View } from 'ol';
import { fromLonLat } from 'ol/proj';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import { Draw, Modify, Select } from 'ol/interaction';
import { Pencil, Square, Minus, MousePointer, Edit } from 'lucide-react';
import GeoJSON from 'ol/format/GeoJSON';
import KML from 'ol/format/KML';
import GPX from 'ol/format/GPX';

import WindowizedApp from './components/WindowizedApp';
import { useLayers, useFeatures } from './hooks/useGIS';
import Toast from './components/Toast';
import type { GISFeature } from './services/gisApi';

interface DrawingTool {
  id: string;
  name: string;
  icon: React.ReactNode;
  type: 'Point' | 'LineString' | 'Polygon' | 'select' | 'modify';
}

const WindowizedMapVue: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<Map | null>(null);
  const vectorSourceRef = useRef<VectorSource>(new VectorSource());
  const layerSourcesRef = useRef<{[key: string]: VectorSource}>({});
  const currentInteractionRef = useRef<Draw | Modify | Select | null>(null);
  
  const [activeTool, setActiveTool] = useState<string>('none');
  const [featureCount, setFeatureCount] = useState({
    points: 0,
    lines: 0,
    polygons: 0
  });
  
  // Toast notification state
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  
  const [fileOperations, setFileOperations] = useState({
    isImporting: false,
    isExporting: false,
    importError: null as string | null,
    exportError: null as string | null,
    lastImportedFile: null as string | null
  });

  // Backend integration state
  const [currentLayerId, setCurrentLayerId] = useState<string | null>(null);
  const [backendSync, setBackendSync] = useState({
    enabled: false,
    autoSave: true,
    lastSaved: null as Date | null,
    saving: false,
    error: null as string | null
  });

  // Use backend hooks
  const { layers, createLayer, updateLayer, deleteLayer } = useLayers();
  const { bulkCreateFeatures } = useFeatures(currentLayerId || undefined);

  // Route management state
  const [routes, setRoutes] = useState<any[]>([]);
  const [currentRoute, setCurrentRoute] = useState<any | null>(null);

  const drawingTools: DrawingTool[] = [
    { id: 'point', name: 'Point', icon: <Pencil className="w-4 h-4" />, type: 'Point' },
    { id: 'line', name: 'Line', icon: <Minus className="w-4 h-4" />, type: 'LineString' },
    { id: 'polygon', name: 'Polygon', icon: <Square className="w-4 h-4" />, type: 'Polygon' },
    { id: 'select', name: 'Select', icon: <MousePointer className="w-4 h-4" />, type: 'select' },
    { id: 'modify', name: 'Modify', icon: <Edit className="w-4 h-4" />, type: 'modify' }
  ];

  // Event handlers
  const handleToolClick = (toolId: string) => {
    if (!mapInstanceRef.current) return;
    
    // Remove current interaction
    if (currentInteractionRef.current) {
      mapInstanceRef.current.removeInteraction(currentInteractionRef.current);
      currentInteractionRef.current = null;
    }
    
    setActiveTool(toolId);
    
    // Add new interaction based on tool
    let interaction: Draw | Modify | Select | null = null;
    
    switch (toolId) {
      case 'point':
        interaction = new Draw({
          source: vectorSourceRef.current,
          type: 'Point'
        });
        break;
      case 'line':
        interaction = new Draw({
          source: vectorSourceRef.current,
          type: 'LineString'
        });
        break;
      case 'polygon':
        interaction = new Draw({
          source: vectorSourceRef.current,
          type: 'Polygon'
        });
        break;
      case 'select':
        interaction = new Select();
        break;
      case 'modify':
        const selectForModify = new Select();
        interaction = new Modify({
          features: selectForModify.getFeatures()
        });
        // Add both select and modify interactions
        mapInstanceRef.current.addInteraction(selectForModify);
        break;
      case 'none':
      default:
        // No interaction for 'none' or unknown tools
        break;
    }
    
    if (interaction) {
      mapInstanceRef.current.addInteraction(interaction);
      currentInteractionRef.current = interaction;
      
      // Add event listeners for draw interactions
      if (interaction instanceof Draw) {
        interaction.on('drawend', () => {
          updateFeatureCount();
        });
      }
    }
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    console.log('handleFileImport called with file:', file?.name);
    if (!file) return;

    setFileOperations(prev => ({ ...prev, isImporting: true, importError: null }));

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const fileExtension = file.name.split('.').pop()?.toLowerCase();
        console.log('File extension:', fileExtension, 'Content length:', content?.length);
        
        let format;
        switch (fileExtension) {
          case 'geojson':
          case 'json':
            format = new GeoJSON();
            break;
          case 'kml':
            format = new KML();
            break;
          case 'gpx':
            format = new GPX();
            break;
          default:
            throw new Error(`Unsupported file format: ${fileExtension}`);
        }

        const features = format.readFeatures(content, {
          dataProjection: 'EPSG:4326',
          featureProjection: 'EPSG:3857'
        });

        console.log('Features parsed:', features.length);

        // Add imported features to the appropriate source
        const targetSource = currentLayerId ? layerSourcesRef.current[currentLayerId] : vectorSourceRef.current;
        if (targetSource) {
          targetSource.addFeatures(features);
          updateFeatureCount();
          console.log('Features added to map');
        }

        setFileOperations(prev => ({ 
          ...prev, 
          isImporting: false, 
          lastImportedFile: file.name,
          importError: null 
        }));
      } catch (error) {
        console.error('File import error:', error);
        setFileOperations(prev => ({ 
          ...prev, 
          isImporting: false, 
          importError: error instanceof Error ? error.message : 'Import failed'
        }));
      }
    };

    reader.onerror = () => {
      setFileOperations(prev => ({ 
        ...prev, 
        isImporting: false, 
        importError: 'Failed to read file'
      }));
    };

    reader.readAsText(file);
  };

  const handleExportToFormat = (formatType: string) => {
    console.log('handleExportToFormat called with format:', formatType);
    try {
      setFileOperations(prev => ({ ...prev, isExporting: true, exportError: null }));

      // Gather all features from visible layers
      let allFeatures: any[] = [];
      layers.forEach(layer => {
        if (layer.visible && layerSourcesRef.current[layer.id]) {
          allFeatures = allFeatures.concat(layerSourcesRef.current[layer.id].getFeatures());
        }
      });

      // Also include features from default source if it has any
      allFeatures = allFeatures.concat(vectorSourceRef.current.getFeatures());

      console.log('Total features to export:', allFeatures.length);

      if (allFeatures.length === 0) {
        throw new Error('No features to export');
      }

      let format;
      let filename;
      let mimeType;

      switch (formatType.toLowerCase()) {
        case 'geojson':
          format = new GeoJSON();
          filename = `export_${Date.now()}.geojson`;
          mimeType = 'application/json';
          break;
        case 'kml':
          format = new KML();
          filename = `export_${Date.now()}.kml`;
          mimeType = 'application/vnd.google-earth.kml+xml';
          break;
        case 'gpx':
          format = new GPX();
          filename = `export_${Date.now()}.gpx`;
          mimeType = 'application/gpx+xml';
          break;
        default:
          throw new Error(`Unsupported format: ${formatType}`);
      }

      const exportedData = format.writeFeatures(allFeatures, {
        dataProjection: 'EPSG:4326',
        featureProjection: 'EPSG:3857'
      });

      // Create download link
      const blob = new Blob([exportedData], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setFileOperations(prev => ({ ...prev, isExporting: false, exportError: null }));
    } catch (error) {
      setFileOperations(prev => ({ 
        ...prev, 
        isExporting: false, 
        exportError: error instanceof Error ? error.message : 'Export failed' 
      }));
    }
  };

  const handleToggleBackendSync = () => {
    setBackendSync(prev => ({ ...prev, enabled: !prev.enabled }));
  };

  const handleSaveToBackend = async () => {
    if (!backendSync.enabled || backendSync.saving) return;

    try {
      setBackendSync(prev => ({ ...prev, saving: true, error: null }));

      // Gather features from current layer or default source
      let features: any[] = [];
      if (currentLayerId && layerSourcesRef.current[currentLayerId]) {
        features = layerSourcesRef.current[currentLayerId].getFeatures();
      } else {
        features = vectorSourceRef.current.getFeatures();
      }

      if (features.length === 0) {
        setBackendSync(prev => ({ ...prev, saving: false }));
        return;
      }

      // Convert OpenLayers features to GIS features
      const format = new GeoJSON();
      const gisFeatures: GISFeature[] = features.map(feature => {
        const geojsonFeature = format.writeFeatureObject(feature, {
          dataProjection: 'EPSG:4326',
          featureProjection: 'EPSG:3857'
        });

        return {
          type: 'Feature',
          geometry: geojsonFeature.geometry,
          properties: {
            name: feature.get('name') || `${geojsonFeature.geometry.type} Feature`,
            description: feature.get('description') || '',
            style: feature.getStyle() ? 'custom' : 'default',
            ...geojsonFeature.properties
          }
        };
      });

      // Create or update layer
      if (!currentLayerId) {
        const newLayer = await createLayer({
          name: `Map Session ${new Date().toLocaleString()}`,
          type: 'vector' as const,
          visible: true,
          opacity: 1,
          features: gisFeatures
        });
        setCurrentLayerId(newLayer.id);
      } else {
        await bulkCreateFeatures(gisFeatures);
      }

      setBackendSync(prev => ({ 
        ...prev, 
        saving: false, 
        lastSaved: new Date(),
        error: null 
      }));
    } catch (error) {
      setBackendSync(prev => ({ 
        ...prev, 
        saving: false, 
        error: error instanceof Error ? error.message : 'Save failed' 
      }));
    }
  };

  const handleClearAllFeatures = () => {
    // Clear features from all sources
    vectorSourceRef.current.clear();
    Object.values(layerSourcesRef.current).forEach(source => {
      source.clear();
    });
    updateFeatureCount();
    
    // Also reset the active tool to none
    handleToolClick('none');
  };

  // Route management handlers
  const handleRouteCreate = (route: any) => {
    setRoutes(prev => [...prev, route]);
    setCurrentRoute(route);
    setToast({ message: `Route "${route.name}" created successfully`, type: 'success' });
  };

  const handleRouteUpdate = (route: any) => {
    setRoutes(prev => prev.map(r => r.id === route.id ? route : r));
    if (currentRoute?.id === route.id) {
      setCurrentRoute(route);
    }
    setToast({ message: `Route "${route.name}" updated`, type: 'info' });
  };

  const handleRouteDelete = (routeId: string) => {
    const routeToDelete = routes.find(r => r.id === routeId);
    setRoutes(prev => prev.filter(r => r.id !== routeId));
    if (currentRoute?.id === routeId) {
      setCurrentRoute(null);
    }
    setToast({ message: `Route "${routeToDelete?.name}" deleted`, type: 'info' });
  };

  const handleRouteImported = (route: any) => {
    setRoutes(prev => [...prev, route]);
    setToast({ message: `Route "${route.name}" imported successfully`, type: 'success' });
  };

  // Layer visibility handlers
  const handleLayerVisibilityToggle = (layerId: string) => {
    // Toggle layer visibility in the layers state
    updateLayer(layerId, { visible: !layers.find(l => l.id === layerId)?.visible });
  };

  const handleLayerToggle = (layerId: string) => {
    handleLayerVisibilityToggle(layerId);
  };

  const handleBaseLayerChange = (layerId: string) => {
    // Handle base layer changes - could be implemented based on your base layer system
    setToast({ message: `Base layer changed to ${layerId}`, type: 'info' });
  };

  const updateFeatureCount = () => {
    let points = 0, lines = 0, polygons = 0;

    // Count from all sources
    const allSources = [vectorSourceRef.current, ...Object.values(layerSourcesRef.current)];
    allSources.forEach(source => {
      source.getFeatures().forEach(feature => {
        const geometryType = feature.getGeometry()?.getType();
        switch (geometryType) {
          case 'Point':
            points++;
            break;
          case 'LineString':
            lines++;
            break;
          case 'Polygon':
            polygons++;
            break;
        }
      });
    });

    setFeatureCount({ points, lines, polygons });
  };

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Create base layer
    const baseLayer = new TileLayer({
      source: new OSM()
    });

    // Create vector layer
    const vectorLayer = new VectorLayer({
      source: vectorSourceRef.current
    });

    // Create map instance
    const map = new Map({
      target: mapRef.current,
      layers: [baseLayer, vectorLayer],
      view: new View({
        center: fromLonLat([-74.006, 40.7128]), // New York City
        zoom: 10
      })
    });

    mapInstanceRef.current = map;

    return () => {
      // Cleanup interactions
      if (currentInteractionRef.current) {
        map.removeInteraction(currentInteractionRef.current);
      }
      map.setTarget(undefined);
      mapInstanceRef.current = null;
    };
  }, []);

  // Initialize map reference from the App component
  useEffect(() => {
    // The map will be initialized by the App component
    // We'll get the reference through a callback or ref
    const timer = setTimeout(() => {
      // Try to get map instance from the App
      const mapElement = document.querySelector('.ol-viewport');
      if (mapElement) {
        const mapContainer = mapElement.parentElement as any;
        if (mapContainer && mapContainer.__ol_map__) {
          mapInstanceRef.current = mapContainer.__ol_map__;
        }
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <WindowizedApp
      map={mapInstanceRef.current}
      layers={layers}
      activeLayerId={currentLayerId}
      currentRoute={currentRoute}
      // Route management props
      onRouteCreate={handleRouteCreate}
      onRouteUpdate={handleRouteUpdate}
      onRouteDelete={handleRouteDelete}
      onRouteImported={handleRouteImported}
      // Drawing tools props
      drawingTools={drawingTools}
      activeTool={activeTool}
      featureCount={featureCount}
      backendSync={backendSync}
      onToolClick={handleToolClick}
      onToggleBackendSync={handleToggleBackendSync}
      onSaveToBackend={handleSaveToBackend}
      onClearAllFeatures={handleClearAllFeatures}
      // File operations props
      fileOperations={fileOperations}
      onFileImport={handleFileImport}
      onExportToFormat={handleExportToFormat}
      // Layer management props
      onLayerSelect={(layerId: string) => setCurrentLayerId(layerId)}
      onLayerCreate={createLayer}
      onLayerDelete={deleteLayer}
      onLayerUpdate={updateLayer}
      onLayerVisibilityToggle={handleLayerVisibilityToggle}
      onLayerToggle={handleLayerToggle}
      onBaseLayerChange={handleBaseLayerChange}
    >
      {/* Just the map container - no UI overlay */}
      <div className="w-full h-full relative">
        <div ref={mapRef} className="w-full h-full bg-gray-100" />
        {/* Toast notifications */}
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </div>
    </WindowizedApp>
  );
};

export default WindowizedMapVue;