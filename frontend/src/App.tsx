import React, { useEffect, useRef, useState } from 'react';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Draw, Modify, Select, Snap } from 'ol/interaction';
import { fromLonLat } from 'ol/proj';
import { Circle as CircleStyle, Fill, Stroke, Style } from 'ol/style';
import { GeoJSON } from 'ol/format';
import { 
  Map as MapIcon, 
  Square, 
  Circle, 
  MousePointer, 
  Pencil, 
  Trash2, 
  Download, 
  Upload, 
  Layers
} from 'lucide-react';
import './App.css';

interface DrawingTool {
  id: string;
  name: string;
  icon: React.ReactNode;
  type: 'Point' | 'LineString' | 'Polygon' | 'Circle' | 'Select' | 'Modify';
}

const drawingTools: DrawingTool[] = [
  { id: 'select', name: 'Select', icon: <MousePointer size={20} />, type: 'Select' },
  { id: 'point', name: 'Point', icon: <Circle size={20} />, type: 'Point' },
  { id: 'line', name: 'Line', icon: <Pencil size={20} />, type: 'LineString' },
  { id: 'polygon', name: 'Polygon', icon: <Square size={20} />, type: 'Polygon' },
  { id: 'modify', name: 'Edit', icon: <Pencil size={20} />, type: 'Modify' },
];

function App() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<Map | null>(null);
  const vectorSourceRef = useRef<VectorSource | null>(null);
  const drawInteractionRef = useRef<Draw | null>(null);
  const selectInteractionRef = useRef<Select | null>(null);
  const modifyInteractionRef = useRef<Modify | null>(null);
  const snapInteractionRef = useRef<Snap | null>(null);
  
  const [activeTool, setActiveTool] = useState<string>('select');
  const [features, setFeatures] = useState<any[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Create vector source for drawings
    const vectorSource = new VectorSource();
    vectorSourceRef.current = vectorSource;

    // Create vector layer for drawings
    const vectorLayer = new VectorLayer({
      source: vectorSource,
      style: new Style({
        fill: new Fill({
          color: 'rgba(255, 255, 255, 0.2)',
        }),
        stroke: new Stroke({
          color: '#ffcc33',
          width: 2,
        }),
        image: new CircleStyle({
          radius: 7,
          fill: new Fill({
            color: '#ffcc33',
          }),
        }),
      }),
    });

    // Create map
    const map = new Map({
      target: mapRef.current,
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
        vectorLayer,
      ],
      view: new View({
        center: fromLonLat([-74.0059, 40.7128]), // New York City
        zoom: 10,
      }),
    });

    mapInstanceRef.current = map;

    // Add snap interaction
    const snap = new Snap({ source: vectorSource });
    snapInteractionRef.current = snap;
    map.addInteraction(snap);

    return () => {
      map.setTarget(undefined);
    };
  }, []);

  // Handle tool changes
  useEffect(() => {
    if (!mapInstanceRef.current || !vectorSourceRef.current) return;

    const map = mapInstanceRef.current;

    // Remove existing interactions
    if (drawInteractionRef.current) {
      map.removeInteraction(drawInteractionRef.current);
      drawInteractionRef.current = null;
    }
    if (selectInteractionRef.current) {
      map.removeInteraction(selectInteractionRef.current);
      selectInteractionRef.current = null;
    }
    if (modifyInteractionRef.current) {
      map.removeInteraction(modifyInteractionRef.current);
      modifyInteractionRef.current = null;
    }

    const tool = drawingTools.find(t => t.id === activeTool);
    if (!tool) return;

    if (tool.type === 'Select') {
      // Add select interaction
      const select = new Select();
      selectInteractionRef.current = select;
      map.addInteraction(select);
    } else if (tool.type === 'Modify') {
      // Add modify interaction
      const select = new Select();
      const modify = new Modify({ features: select.getFeatures() });
      
      selectInteractionRef.current = select;
      modifyInteractionRef.current = modify;
      
      map.addInteraction(select);
      map.addInteraction(modify);
    } else {
      // Add draw interaction
      const draw = new Draw({
        source: vectorSourceRef.current,
        type: tool.type as any,
      });

      draw.on('drawend', (event) => {
        const feature = event.feature;
        const geometry = feature.getGeometry();
        
        if (geometry) {
          const format = new GeoJSON();
          const geoJsonFeature = format.writeFeatureObject(feature);
          
          setFeatures(prev => [...prev, {
            id: Date.now().toString(),
            type: 'Feature',
            geometry: geoJsonFeature.geometry,
            properties: {
              name: `${tool.name} Feature`,
              type: tool.type,
              createdAt: new Date().toISOString(),
            }
          }]);
        }
      });

      drawInteractionRef.current = draw;
      map.addInteraction(draw);
    }
  }, [activeTool]);

  const handleToolClick = (toolId: string) => {
    setActiveTool(toolId);
  };

  const clearFeatures = () => {
    if (vectorSourceRef.current) {
      vectorSourceRef.current.clear();
      setFeatures([]);
    }
  };

  const deleteSelectedFeature = () => {
    if (selectInteractionRef.current) {
      const selectedFeatures = selectInteractionRef.current.getFeatures();
      selectedFeatures.forEach(feature => {
        if (vectorSourceRef.current) {
          vectorSourceRef.current.removeFeature(feature);
        }
      });
      selectedFeatures.clear();
      
      // Update features state (simplified - in real app would track by ID)
      if (selectedFeatures.getLength() > 0) {
        setFeatures(prev => prev.slice(0, -1));
      }
    }
  };

  const exportFeatures = () => {
    if (features.length === 0) {
      alert('No features to export');
      return;
    }

    const geoJson = {
      type: 'FeatureCollection',
      features: features
    };

    const dataStr = JSON.stringify(geoJson, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/geo+json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'mapvue-features.geojson';
    link.click();
    
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const geoJson = JSON.parse(e.target?.result as string);
        
        if (geoJson.type === 'FeatureCollection') {
          const format = new GeoJSON();
          const features = format.readFeatures(geoJson, {
            featureProjection: 'EPSG:3857',
          });
          
          if (vectorSourceRef.current) {
            vectorSourceRef.current.addFeatures(features);
          }
          
          setFeatures(prev => [...prev, ...geoJson.features]);
        }
      } catch (error) {
        alert('Failed to parse GeoJSON file');
        console.error('GeoJSON parsing error:', error);
      }
    };
    
    reader.readAsText(file);
    event.target.value = ''; // Reset input
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-md border-b z-20">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <MapIcon className="text-blue-600" size={28} />
            <h1 className="text-xl font-bold text-gray-800">MapVue</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <Layers size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Sidebar */}
        {sidebarOpen && (
          <div className="w-80 bg-white shadow-lg overflow-y-auto">
          <div className="p-4">
            <h2 className="text-lg font-semibold mb-4">Drawing Tools</h2>
            
            {/* Drawing Tools */}
            <div className="grid grid-cols-2 gap-2 mb-6">
              {drawingTools.map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => handleToolClick(tool.id)}
                  className={`p-3 rounded-lg border-2 transition-all duration-200 flex flex-col items-center gap-2 ${
                    activeTool === tool.id
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                >
                  {tool.icon}
                  <span className="text-sm font-medium">{tool.name}</span>
                </button>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 mb-6">
              <button
                onClick={clearFeatures}
                className="w-full p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <Trash2 size={16} />
                Clear All
              </button>
              
              <button
                onClick={deleteSelectedFeature}
                className="w-full p-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <Trash2 size={16} />
                Delete Selected
              </button>
              
              <button
                onClick={exportFeatures}
                className="w-full p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <Download size={16} />
                Export GeoJSON
              </button>
              
              <label className="w-full p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer">
                <Upload size={16} />
                Import GeoJSON
                <input
                  type="file"
                  accept=".geojson,.json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Features List */}
            <div>
              <h3 className="text-md font-semibold mb-2">Features ({features.length})</h3>
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {features.map((feature, index) => (
                  <div
                    key={feature.id || index}
                    className="p-2 bg-gray-50 rounded border text-sm"
                  >
                    <div className="font-medium">{feature.properties?.name || `Feature ${index + 1}`}</div>
                    <div className="text-gray-500 text-xs">
                      Type: {feature.properties?.type || feature.geometry?.type}
                    </div>
                  </div>
                ))}
                {features.length === 0 && (
                  <div className="text-gray-500 text-sm italic text-center py-4">
                    No features yet. Start drawing!
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

        {/* Map Container */}
        <div className="flex-1 relative">
          <div
            ref={mapRef}
            className="w-full h-full"
            style={{ background: '#f0f0f0' }}
          />
        
        {/* Map Controls */}
        <div className="absolute top-20 right-4 bg-white rounded-lg shadow-lg p-2">
          <div className="text-xs text-gray-600 mb-1">Active Tool:</div>
          <div className="text-sm font-medium text-blue-600">
            {drawingTools.find(t => t.id === activeTool)?.name}
          </div>
        </div>

        {/* Instructions */}
        {activeTool && (
          <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 max-w-xs">
            <div className="text-sm">
              {activeTool === 'select' && 'Click on features to select them'}
              {activeTool === 'point' && 'Click on the map to add points'}
              {activeTool === 'line' && 'Click to start a line, click again to add points, double-click to finish'}
              {activeTool === 'polygon' && 'Click to start a polygon, click to add vertices, double-click to finish'}
              {activeTool === 'modify' && 'Select a feature first, then drag its vertices to edit'}
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}

export default App;
