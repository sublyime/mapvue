import React, { useEffect, useRef, useState } from 'react';
import Feature from 'ol/Feature';
import type Geometry from 'ol/geom/Geometry';
import Collection from 'ol/Collection';
import { Map, View } from 'ol';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Draw from 'ol/interaction/Draw';
import Select from 'ol/interaction/Select';
import Modify from 'ol/interaction/Modify';
import { Style, Fill, Stroke, Circle } from 'ol/style';
import { fromLonLat } from 'ol/proj';
import GeoJSON from 'ol/format/GeoJSON';
import KML from 'ol/format/KML';
import GPX from 'ol/format/GPX';
import Point from 'ol/geom/Point';
import { Pencil, Square, Minus, MousePointer, Edit, Upload, Download, FileText, Save, Database } from 'lucide-react';
import './App.css';
import { useLayers, useFeatures } from './hooks/useGIS';
import { LayerPanel } from './components/LayerPanel';
import LocateMeButton from './components/LocateMeButton';
import MapLayerControl from './components/MapLayerControl';
import RouteManager from './components/RouteManager';
import Toast from './components/Toast';
import useGeolocation from './hooks/useGeolocation';
import { useMapLayers } from './hooks/useMapLayers';
import type { GISFeature } from './services/gisApi';

interface DrawingTool {
  id: string;
  name: string;
  icon: React.ReactNode;
  type: 'Point' | 'LineString' | 'Polygon' | 'select' | 'modify';
}

const App: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<Map | null>(null);
  const vectorSourceRef = useRef<VectorSource>(new VectorSource());
  const layerSourcesRef = useRef<{[key: string]: VectorSource}>({});
  const drawInteractionRef = useRef<Draw | null>(null);
  const selectInteractionRef = useRef<Select | null>(null);
  const modifyInteractionRef = useRef<Modify | null>(null);
  
  const [activeTool, setActiveTool] = useState<string>('none');
  const [featureCount, setFeatureCount] = useState({
    points: 0,
    lines: 0,
    polygons: 0
  });
  
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
  const { createFeature, bulkCreateFeatures } = useFeatures(currentLayerId || undefined);

  // Geolocation hook
  const { position, error: locationError, isLoading: isLocating, getCurrentPosition } = useGeolocation();
  const userLocationFeatureRef = useRef<Feature<Point> | null>(null);
  const userLocationSourceRef = useRef<VectorSource>(new VectorSource());
  const userLocationLayerRef = useRef<VectorLayer<VectorSource> | null>(null);

  // Map layers hook
  const { mapLayers, toggleLayer, changeBaseLayer } = useMapLayers(mapInstanceRef.current);

  // Toast notification state
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const drawingTools: DrawingTool[] = [
    { id: 'point', name: 'Point', icon: <Pencil className="w-4 h-4" />, type: 'Point' },
    { id: 'line', name: 'Line', icon: <Minus className="w-4 h-4" />, type: 'LineString' },
    { id: 'polygon', name: 'Polygon', icon: <Square className="w-4 h-4" />, type: 'Polygon' },
    { id: 'select', name: 'Select', icon: <MousePointer className="w-4 h-4" />, type: 'select' },
    { id: 'modify', name: 'Modify', icon: <Edit className="w-4 h-4" />, type: 'modify' }
  ];

  const createFeatureStyle = (type: string) => {
    const styles = {
      Point: new Style({
        image: new Circle({
          radius: 8,
          fill: new Fill({ color: '#3b82f6' }),
          stroke: new Stroke({ color: '#1e40af', width: 2 })
        })
      }),
      LineString: new Style({
        stroke: new Stroke({ color: '#ef4444', width: 3 })
      }),
      Polygon: new Style({
        fill: new Fill({ color: 'rgba(34, 197, 94, 0.3)' }),
        stroke: new Stroke({ color: '#16a34a', width: 2 })
      })
    };
    return styles[type as keyof typeof styles];
  };

  // Helper function to get or create vector source for layer
  const getLayerVectorSource = (layerId: string) => {
    if (!layerSourcesRef.current[layerId]) {
      layerSourcesRef.current[layerId] = new VectorSource();
    }
    return layerSourcesRef.current[layerId];
  };

  // Helper function to get active vector source

  // Get all visible vector sources (for modify/select)
  const getVisibleVectorSources = () => {
    const sources = [];
    layers.forEach(layer => {
      if (layer.visible) sources.push(getLayerVectorSource(layer.id));
    });
    // If no visible layers, fallback to default
    if (sources.length === 0) sources.push(vectorSourceRef.current);
    return sources;
  };

  const removeAllInteractions = () => {
    const map = mapInstanceRef.current;
    if (!map) return;

    [drawInteractionRef.current, selectInteractionRef.current, modifyInteractionRef.current].forEach(interaction => {
      if (interaction) {
        map.removeInteraction(interaction);
      }
    });
  };

  const activateDrawTool = (toolType: string) => {
    const map = mapInstanceRef.current;
    if (!map) return;

    removeAllInteractions();

    // For modify/select, use all visible sources
    if (toolType === 'select') {
      const selectInteraction = new Select({
        layers: map.getLayers().getArray().filter(l => l instanceof VectorLayer),
        style: (feature) => {
          const geometry = feature.getGeometry();
          const geometryType = geometry?.getType();
          if (geometryType) {
            const style = createFeatureStyle(geometryType);
            if (style && geometryType === 'Point') {
              return new Style({
                image: new Circle({
                  radius: 10,
                  fill: new Fill({ color: '#facc15' }),
                  stroke: new Stroke({ color: '#eab308', width: 3 })
                })
              });
            }
            return style;
          }
          return undefined;
        }
      });
      map.addInteraction(selectInteraction);
      selectInteractionRef.current = selectInteraction;
    } else if (toolType === 'modify') {
      // OpenLayers Modify only works with a single source, so create a combined source if needed
      const sources = getVisibleVectorSources();
      let modifyInteraction;
      if (sources.length === 1) {
        modifyInteraction = new Modify({ source: sources[0] });
      } else {
        // Combine all features into a single OpenLayers Collection for modification
        const allFeatures = sources.reduce<Feature<Geometry>[]>((arr, src) => arr.concat(src.getFeatures()), []);
        const featureCollection = new Collection(allFeatures);
        modifyInteraction = new Modify({ features: featureCollection });
      }
      map.addInteraction(modifyInteraction);
      modifyInteractionRef.current = modifyInteraction;
    } else if (['Point', 'LineString', 'Polygon'].includes(toolType)) {
      // Draw only on the current layer (or default)
      const activeSource = currentLayerId ? getLayerVectorSource(currentLayerId) : vectorSourceRef.current;
      const drawInteraction = new Draw({
        source: activeSource,
        type: toolType as any,
        style: createFeatureStyle(toolType)
      });

      drawInteraction.on('drawend', async (event) => {
        const feature = event.feature;
        const geometry = feature.getGeometry();
        const geometryType = geometry?.getType();
        if (geometryType) {
          // Apply layer-specific styling
          const activeLayer = layers.find(l => l.id === currentLayerId);
          if (activeLayer?.styleConfig) {
            const layerStyle = new Style({
              image: new Circle({
                radius: 8,
                fill: new Fill({ color: activeLayer.styleConfig.fillColor }),
                stroke: new Stroke({ 
                  color: activeLayer.styleConfig.strokeColor, 
                  width: activeLayer.styleConfig.strokeWidth 
                })
              }),
              stroke: new Stroke({ 
                color: activeLayer.styleConfig.strokeColor, 
                width: activeLayer.styleConfig.strokeWidth 
              }),
              fill: new Fill({ 
                color: activeLayer.styleConfig.fillColor + '4D' // Add transparency
              })
            });
            feature.setStyle(layerStyle);
          } else {
            feature.setStyle(createFeatureStyle(geometryType));
          }
          updateFeatureCount();
          // Auto-save to backend if layer is selected and sync is enabled
          if (currentLayerId && backendSync.enabled) {
            try {
              const format = new GeoJSON();
              const geojsonFeature = format.writeFeatureObject(feature, {
                dataProjection: 'EPSG:4326',
                featureProjection: 'EPSG:3857'
              });
              const gisFeature: GISFeature = {
                type: 'Feature',
                geometry: geojsonFeature.geometry,
                properties: {
                  name: `${geometryType} Feature`,
                  description: `Created on ${new Date().toLocaleString()}`,
                  layerId: currentLayerId,
                  style: 'layer-default'
                }
              };
              await createFeature(gisFeature);
            } catch (error) {
              console.warn('Failed to auto-save feature:', error);
            }
          }
        }
      });
      map.addInteraction(drawInteraction);
      drawInteractionRef.current = drawInteraction;
    }
  };

  const updateFeatureCount = () => {
    const vectorSource = vectorSourceRef.current;
    if (!vectorSource) return;

    const features = vectorSource.getFeatures();
    const counts = { points: 0, lines: 0, polygons: 0 };

    features.forEach(feature => {
      const geometryType = feature.getGeometry()?.getType();
      switch (geometryType) {
        case 'Point':
          counts.points++;
          break;
        case 'LineString':
          counts.lines++;
          break;
        case 'Polygon':
          counts.polygons++;
          break;
      }
    });

    setFeatureCount(counts);
  };

  const clearAllFeatures = () => {
  // Clear all features from all layer vector sources
  Object.values(layerSourcesRef.current).forEach(source => source.clear());
  vectorSourceRef.current.clear();
  updateFeatureCount();
  };

  // File Import Functions
  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileOperations(prev => ({ ...prev, isImporting: true, importError: null }));

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const fileExtension = file.name.split('.').pop()?.toLowerCase();
        
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

        // Add imported features to the current layer's vector source
        const targetSource = currentLayerId ? getLayerVectorSource(currentLayerId) : vectorSourceRef.current;
        features.forEach(feature => {
          const geometry = feature.getGeometry();
          const geometryType = geometry?.getType();
          if (geometryType) {
            feature.setStyle(createFeatureStyle(geometryType));
          }
        });
        targetSource.addFeatures(features);
        updateFeatureCount();

        setFileOperations(prev => ({ 
          ...prev, 
          isImporting: false, 
          lastImportedFile: file.name,
          importError: null 
        }));

        // Zoom to imported features
        const extent = vectorSourceRef.current.getExtent();
        if (mapInstanceRef.current) {
          mapInstanceRef.current.getView().fit(extent, { padding: [20, 20, 20, 20] });
        }
      } catch (error) {
        setFileOperations(prev => ({ 
          ...prev, 
          isImporting: false, 
          importError: error instanceof Error ? error.message : 'Import failed' 
        }));
      }
    };

    reader.readAsText(file);
    event.target.value = ''; // Reset input
  };

  // File Export Functions
  const exportToFormat = (formatType: 'geojson' | 'kml' | 'gpx') => {
    try {
      setFileOperations(prev => ({ ...prev, isExporting: true, exportError: null }));

      const features = vectorSourceRef.current.getFeatures();
      if (features.length === 0) {
        throw new Error('No features to export');
      }

      let format;
      let filename;
      let mimeType;

      switch (formatType) {
        case 'geojson':
          format = new GeoJSON();
          filename = 'mapvue-export.geojson';
          mimeType = 'application/geo+json';
          break;
        case 'kml':
          format = new KML();
          filename = 'mapvue-export.kml';
          mimeType = 'application/vnd.google-earth.kml+xml';
          break;
        case 'gpx':
          format = new GPX();
          filename = 'mapvue-export.gpx';
          mimeType = 'application/gpx+xml';
          break;
      }

      const exportedData = format.writeFeatures(features, {
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

  // Backend synchronization functions
  const saveToBackend = async () => {
    if (!backendSync.enabled || backendSync.saving) return;

    try {
      setBackendSync(prev => ({ ...prev, saving: true, error: null }));

      // Gather features only from the current layer's vector source
      let features: any[] = [];
      if (currentLayerId) {
        features = getLayerVectorSource(currentLayerId).getFeatures();
      } else {
        features = vectorSourceRef.current.getFeatures();
      }
      if (features.length === 0) return;

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

  const toggleBackendSync = () => {
    setBackendSync(prev => ({ ...prev, enabled: !prev.enabled }));
  };

  // Auto-save functionality
  useEffect(() => {
    if (backendSync.enabled && backendSync.autoSave) {
      const saveInterval = setInterval(() => {
        const features = vectorSourceRef.current.getFeatures();
        if (features.length > 0) {
          saveToBackend();
        }
      }, 30000); // Auto-save every 30 seconds

      return () => clearInterval(saveInterval);
    }
  }, [backendSync.enabled, backendSync.autoSave]);

  // Effect to manage layer visualization and update modify/select tools
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Remove all vector layers (except base layer)
    const layersToRemove: VectorLayer<any>[] = [];
    map.getLayers().forEach(layer => {
      if (layer instanceof VectorLayer) {
        layersToRemove.push(layer);
      }
    });
    layersToRemove.forEach(layer => map.removeLayer(layer));

    // Only add the default vector layer if there are features not associated with any layer
    if (vectorSourceRef.current.getFeatures().length > 0) {
      const defaultVectorLayer = new VectorLayer({
        source: vectorSourceRef.current,
        style: (feature) => {
          const geometryType = feature.getGeometry()?.getType();
          return geometryType ? createFeatureStyle(geometryType) : undefined;
        }
      });
      map.addLayer(defaultVectorLayer);
    }

    // Add a vector layer for each visible layer
    layers.forEach(layer => {
      if (layer.visible) {
        const layerSource = getLayerVectorSource(layer.id);
        const vectorLayer = new VectorLayer({
          source: layerSource,
          opacity: layer.opacity || 1,
          style: (feature) => {
            if (layer.styleConfig) {
              const geometryType = feature.getGeometry()?.getType();
              if (geometryType === 'Point') {
                return new Style({
                  image: new Circle({
                    radius: 8,
                    fill: new Fill({ color: layer.styleConfig.fillColor }),
                    stroke: new Stroke({ 
                      color: layer.styleConfig.strokeColor, 
                      width: layer.styleConfig.strokeWidth 
                    })
                  })
                });
              } else if (geometryType === 'LineString') {
                return new Style({
                  stroke: new Stroke({ 
                    color: layer.styleConfig.strokeColor, 
                    width: layer.styleConfig.strokeWidth 
                  })
                });
              } else if (geometryType === 'Polygon') {
                return new Style({
                  fill: new Fill({ 
                    color: layer.styleConfig.fillColor + '4D' // Add transparency
                  }),
                  stroke: new Stroke({ 
                    color: layer.styleConfig.strokeColor, 
                    width: layer.styleConfig.strokeWidth 
                  })
                });
              }
            }
            const geometryType = feature.getGeometry()?.getType();
            return geometryType ? createFeatureStyle(geometryType) : undefined;
          }
        });
        map.addLayer(vectorLayer);
      }
    });

    // Remove and re-add modify/select interactions to update their sources
    if (activeTool === 'modify' || activeTool === 'select') {
      removeAllInteractions();
      activateDrawTool(activeTool);
    }
  }, [layers, activeTool]);

  useEffect(() => {
    if (!mapRef.current) return;

    const vectorLayer = new VectorLayer({
      source: vectorSourceRef.current
    });

    // Create user location layer
    const userLocationLayer = new VectorLayer({
      source: userLocationSourceRef.current,
      style: new Style({
        image: new Circle({
          radius: 12,
          fill: new Fill({ color: '#3b82f6' }),
          stroke: new Stroke({ 
            color: '#ffffff', 
            width: 3 
          })
        })
      }),
      zIndex: 1000 // Ensure user location is always on top
    });

    const map = new Map({
      target: mapRef.current,
      layers: [
        vectorLayer,
        userLocationLayer
      ],
      view: new View({
        center: fromLonLat([-98.5795, 39.8283]),
        zoom: 4
      })
    });

    mapInstanceRef.current = map;
    userLocationLayerRef.current = userLocationLayer;

    return () => {
      map.setTarget(undefined);
    };
  }, []);

  // Handle user location
  const handleLocateMe = () => {
    getCurrentPosition();
  };

  // Effect to handle position updates
  useEffect(() => {
    if (position && mapInstanceRef.current) {
      const coordinates = fromLonLat([position.longitude, position.latitude]);
      
      // Remove existing user location feature
      if (userLocationFeatureRef.current) {
        userLocationSourceRef.current.removeFeature(userLocationFeatureRef.current);
      }

      // Create new user location feature
      const locationFeature = new Feature({
        geometry: new Point(coordinates)
      });

      userLocationFeatureRef.current = locationFeature;
      userLocationSourceRef.current.addFeature(locationFeature);

      // Center map on user location
      const view = mapInstanceRef.current.getView();
      view.animate({
        center: coordinates,
        zoom: 16, // Zoom to a reasonable level for user location
        duration: 1000
      });

      // Show success message
      showToast('Location found! Map centered on your position.', 'success');
    }
  }, [position]);

  // Effect to handle location errors
  useEffect(() => {
    if (locationError) {
      console.error('Location error:', locationError);
      showToast(locationError.message, 'error');
    }
  }, [locationError]);

  const handleToolClick = (toolId: string) => {
    if (activeTool === toolId) {
      setActiveTool('none');
      removeAllInteractions();
    } else {
      setActiveTool(toolId);
      const tool = drawingTools.find(t => t.id === toolId);
      if (tool) {
        activateDrawTool(tool.type);
      }
    }
  };

  return (
    <div className="w-full h-screen relative bg-gray-100">
      <div ref={mapRef} className="absolute inset-0" />
      
      {/* Map Controls - Layer Control and Locate Me Button */}
      <div className="absolute top-4 right-4 z-20 space-y-3">
        <MapLayerControl
          layers={mapLayers}
          onLayerToggle={toggleLayer}
          onBaseLayerChange={changeBaseLayer}
        />
        <LocateMeButton 
          onClick={handleLocateMe}
          isLoading={isLocating}
          disabled={!navigator.geolocation}
        />
      </div>
      
      {/* Left Side Controls */}
      <div className="absolute top-4 left-4 z-10 space-y-4">
        {/* Drawing Tools Panel */}
        <div className="bg-white rounded-lg shadow-lg p-4 max-w-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">MapVue Drawing Tools</h3>
        
        <div className="grid grid-cols-2 gap-2 mb-4">
          {drawingTools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => handleToolClick(tool.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-md border transition-all ${
                activeTool === tool.id
                  ? 'bg-blue-100 border-blue-300 text-blue-700'
                  : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
              }`}
            >
              {tool.icon}
              <span className="text-sm font-medium">{tool.name}</span>
            </button>
          ))}
        </div>

        <div className="space-y-3">
          <div className="p-3 bg-blue-50 rounded border border-blue-200">
            <div className="text-sm font-medium text-blue-800">
              Active Tool: {drawingTools.find(t => t.id === activeTool)?.name || 'None'}
            </div>
          </div>

          <div className="p-3 bg-green-50 rounded border border-green-200">
            <div className="text-sm font-medium text-green-800 mb-2">Features on Map:</div>
            <div className="space-y-1 text-sm text-green-700">
              <div>Points: {featureCount.points}</div>
              <div>Lines: {featureCount.lines}</div>
              <div>Polygons: {featureCount.polygons}</div>
            </div>
          </div>

          {/* Backend Sync Section */}
          <div className="p-3 bg-purple-50 rounded border border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-purple-800">Backend Sync</div>
              <button
                onClick={toggleBackendSync}
                className={`text-xs px-2 py-1 rounded ${
                  backendSync.enabled 
                    ? 'bg-purple-200 text-purple-800' 
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {backendSync.enabled ? 'ON' : 'OFF'}
              </button>
            </div>
            
            {backendSync.enabled && (
              <div className="space-y-2">
                <button
                  onClick={saveToBackend}
                  disabled={backendSync.saving || featureCount.points + featureCount.lines + featureCount.polygons === 0}
                  className="w-full flex items-center gap-2 px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs hover:bg-purple-200 disabled:bg-gray-100 disabled:text-gray-500"
                >
                  <Save className="w-3 h-3" />
                  {backendSync.saving ? 'Saving...' : 'Save to DB'}
                </button>
                
                {backendSync.lastSaved && (
                  <div className="text-xs text-purple-600">
                    Saved: {backendSync.lastSaved.toLocaleTimeString()}
                  </div>
                )}
                
                {backendSync.error && (
                  <div className="text-xs text-red-600">
                    Error: {backendSync.error}
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            onClick={clearAllFeatures}
            className="w-full px-3 py-2 bg-red-100 text-red-700 rounded-md border border-red-200 hover:bg-red-200 transition-colors text-sm font-medium"
          >
            Clear All Features
          </button>
        </div>
      </div>

      {/* File Operations Panel */}
      <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4 z-10 max-w-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">File Operations</h3>
        
        {/* Import Section */}
        <div className="space-y-3 mb-4">
          <div className="border-b border-gray-200 pb-2">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Import GIS Data</h4>
            <input
              type="file"
              accept=".geojson,.json,.kml,.gpx"
              onChange={handleFileImport}
              disabled={fileOperations.isImporting}
              className="hidden"
              id="file-import"
            />
            <label
              htmlFor="file-import"
              className={`flex items-center gap-2 px-3 py-2 rounded-md border cursor-pointer transition-all ${
                fileOperations.isImporting
                  ? 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span className="text-sm font-medium">
                {fileOperations.isImporting ? 'Importing...' : 'Import File'}
              </span>
            </label>
            <p className="text-xs text-gray-500 mt-1">
              Supports: GeoJSON, KML, GPX
            </p>
          </div>

          {/* Import Status */}
          {fileOperations.lastImportedFile && (
            <div className="p-2 bg-green-50 rounded border border-green-200">
              <div className="text-xs text-green-800">
                <FileText className="w-3 h-3 inline mr-1" />
                Imported: {fileOperations.lastImportedFile}
              </div>
            </div>
          )}

          {fileOperations.importError && (
            <div className="p-2 bg-red-50 rounded border border-red-200">
              <div className="text-xs text-red-800">
                Error: {fileOperations.importError}
              </div>
            </div>
          )}
        </div>

        {/* Export Section */}
        <div className="space-y-3">
          <div className="border-b border-gray-200 pb-2">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Export Data</h4>
            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={() => exportToFormat('geojson')}
                disabled={fileOperations.isExporting || featureCount.points + featureCount.lines + featureCount.polygons === 0}
                className="flex items-center gap-2 px-3 py-2 rounded-md border transition-all bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 disabled:bg-gray-100 disabled:border-gray-300 disabled:text-gray-500"
              >
                <Download className="w-4 h-4" />
                <span className="text-sm font-medium">Export GeoJSON</span>
              </button>
              
              <button
                onClick={() => exportToFormat('kml')}
                disabled={fileOperations.isExporting || featureCount.points + featureCount.lines + featureCount.polygons === 0}
                className="flex items-center gap-2 px-3 py-2 rounded-md border transition-all bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100 disabled:bg-gray-100 disabled:border-gray-300 disabled:text-gray-500"
              >
                <Download className="w-4 h-4" />
                <span className="text-sm font-medium">Export KML</span>
              </button>
              
              <button
                onClick={() => exportToFormat('gpx')}
                disabled={fileOperations.isExporting || featureCount.points + featureCount.lines + featureCount.polygons === 0}
                className="flex items-center gap-2 px-3 py-2 rounded-md border transition-all bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100 disabled:bg-gray-100 disabled:border-gray-300 disabled:text-gray-500"
              >
                <Download className="w-4 h-4" />
                <span className="text-sm font-medium">Export GPX</span>
              </button>
            </div>
          </div>

          {/* Export Status */}
          {fileOperations.isExporting && (
            <div className="p-2 bg-blue-50 rounded border border-blue-200">
              <div className="text-xs text-blue-800">
                Preparing download...
              </div>
            </div>
          )}

          {fileOperations.exportError && (
            <div className="p-2 bg-red-50 rounded border border-red-200">
              <div className="text-xs text-red-800">
                Error: {fileOperations.exportError}
              </div>
            </div>
          )}

          {featureCount.points + featureCount.lines + featureCount.polygons === 0 && (
            <div className="p-2 bg-yellow-50 rounded border border-yellow-200">
              <div className="text-xs text-yellow-800">
                No features to export. Draw something first!
              </div>
            </div>
          )}
        </div>

        {/* Backend Layers Section */}
        {backendSync.enabled && (
          <div className="space-y-3 border-t border-gray-200 pt-3">
            <div className="border-b border-gray-200 pb-2">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Saved Layers</h4>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {layers.length > 0 ? (
                  layers.slice(0, 5).map((layer) => (
                    <div key={layer.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs">
                      <div className="flex items-center gap-1">
                        <Database className="w-3 h-3 text-gray-500" />
                        <span className="truncate max-w-24">{layer.name}</span>
                      </div>
                      <button
                        onClick={() => {/* loadFromBackend(layer.id) */}}
                        className="px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                      >
                        Load
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-gray-500 text-center py-2">
                    No saved layers
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        </div>
        
        {/* Route Manager Panel */}
        <RouteManager 
          map={mapInstanceRef.current}
          onRouteCreate={(route) => {
            showToast(`Route "${route.name}" created successfully!`, 'success');
          }}
          onRouteDelete={() => {
            showToast('Route deleted successfully!', 'success');
          }}
        />
      </div>

      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 z-10 max-w-md">
        <h4 className="text-sm font-semibold text-gray-800 mb-2">Instructions:</h4>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• Select a drawing tool and click on the map to draw</li>
          <li>• Use Select tool to highlight features</li>
          <li>• Use Modify tool to edit existing features</li>
          <li>• Double-click to finish drawing lines/polygons</li>
          <li>• Import GeoJSON, KML, or GPX files to load existing data</li>
          <li>• Export your work in multiple GIS formats</li>
          <li>• Enable Backend Sync to save data to database</li>
          <li>• Use auto-save to automatically backup your work</li>
        </ul>
      </div>

      {/* Layer Management Panel */}
      <div className="absolute bottom-4 left-4 z-10">
        <LayerPanel
          layers={layers}
          activeLayerId={currentLayerId}
          onLayerSelect={setCurrentLayerId}
          onLayerCreate={async (layerData) => {
            try {
              const newLayer = await createLayer(layerData);
              setCurrentLayerId(newLayer.id);
            } catch (error) {
              console.error('Failed to create layer:', error);
            }
          }}
          onLayerUpdate={async (layerId, layerData) => {
            try {
              await updateLayer(layerId, layerData);
            } catch (error) {
              console.error('Failed to update layer:', error);
            }
          }}
          onLayerDelete={async (layerId) => {
            try {
              await deleteLayer(layerId);
              if (currentLayerId === layerId) {
                setCurrentLayerId(null);
              }
            } catch (error) {
              console.error('Failed to delete layer:', error);
            }
          }}
          onLayerVisibilityToggle={async (layerId) => {
            try {
              const layer = layers.find(l => l.id === layerId);
              if (layer) {
                await updateLayer(layerId, { visible: !layer.visible });
              }
            } catch (error) {
              console.error('Failed to toggle layer visibility:', error);
            }
          }}
        />
      </div>
      
      {/* Toast Notifications */}
      {toast && (
        <Toast 
          {...toast} 
          onClose={() => setToast(null)} 
        />
      )}
    </div>
  );
};

export default App;