import React, { useEffect, useRef, useState } from 'react';
import { Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import OSM from 'ol/source/OSM';
import Draw from 'ol/interaction/Draw';
import Select from 'ol/interaction/Select';
import Modify from 'ol/interaction/Modify';
import { Style, Fill, Stroke, Circle } from 'ol/style';
import { fromLonLat } from 'ol/proj';
import GeoJSON from 'ol/format/GeoJSON';
import KML from 'ol/format/KML';
import GPX from 'ol/format/GPX';
import { Pencil, Square, Minus, MousePointer, Edit, Upload, Download, FileText } from 'lucide-react';
import './App.css';

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
    const vectorSource = vectorSourceRef.current;
    if (!map || !vectorSource) return;

    removeAllInteractions();

    if (toolType === 'select') {
      const selectInteraction = new Select({
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
      const modifyInteraction = new Modify({
        source: vectorSource
      });
      map.addInteraction(modifyInteraction);
      modifyInteractionRef.current = modifyInteraction;
    } else if (['Point', 'LineString', 'Polygon'].includes(toolType)) {
      const drawInteraction = new Draw({
        source: vectorSource,
        type: toolType as any,
        style: createFeatureStyle(toolType)
      });

      drawInteraction.on('drawend', (event) => {
        const feature = event.feature;
        const geometry = feature.getGeometry();
        const geometryType = geometry?.getType();
        
        if (geometryType) {
          feature.setStyle(createFeatureStyle(geometryType));
          updateFeatureCount();
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

        // Apply styles to imported features
        features.forEach(feature => {
          const geometry = feature.getGeometry();
          const geometryType = geometry?.getType();
          if (geometryType) {
            feature.setStyle(createFeatureStyle(geometryType));
          }
        });

        vectorSourceRef.current.addFeatures(features);
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

  useEffect(() => {
    if (!mapRef.current) return;

    const vectorLayer = new VectorLayer({
      source: vectorSourceRef.current
    });

    const map = new Map({
      target: mapRef.current,
      layers: [
        new TileLayer({
          source: new OSM()
        }),
        vectorLayer
      ],
      view: new View({
        center: fromLonLat([-98.5795, 39.8283]),
        zoom: 4
      })
    });

    mapInstanceRef.current = map;

    return () => {
      map.setTarget(undefined);
    };
  }, []);

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
      
      <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-4 z-10 max-w-sm">
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
        </ul>
      </div>
    </div>
  );
};

export default App;