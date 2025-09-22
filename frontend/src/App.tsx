import React, { useEffect, useRef, useState } from 'react';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import { 
  Map as MapIcon, 
  Square, 
  Circle, 
  MousePointer, 
  Pencil, 
  Layers
} from 'lucide-react';
import './App.css';

interface DrawingTool {
  id: string;
  name: string;
  icon: React.ReactNode;
}

const drawingTools: DrawingTool[] = [
  { id: 'select', name: 'Select', icon: <MousePointer size={20} /> },
  { id: 'point', name: 'Point', icon: <Circle size={20} /> },
  { id: 'line', name: 'Line', icon: <Pencil size={20} /> },
  { id: 'polygon', name: 'Polygon', icon: <Square size={20} /> },
];

function App() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<Map | null>(null);
  const [activeTool, setActiveTool] = useState<string>('select');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Initialize map with EXACT same config as working SimpleMap
  useEffect(() => {
    if (!mapRef.current) return;

    // Clean up any existing map instance
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setTarget(undefined);
      mapInstanceRef.current = null;
    }

    console.log('🗺️ Initializing MapVue with working config...');

    const map = new Map({
      target: mapRef.current,
      layers: [
        new TileLayer({
          source: new OSM()
        })
      ],
      view: new View({
        center: [0, 0],
        zoom: 2
      })
    });

    mapInstanceRef.current = map;
    console.log('✅ MapVue created successfully');

    // Multiple size updates to ensure proper rendering
    setTimeout(() => {
      map.updateSize();
      console.log('📏 MapVue size updated (100ms)');
    }, 100);

    setTimeout(() => {
      map.updateSize();
      console.log('📏 MapVue size updated (500ms)');
    }, 500);

    return () => {
      if (map) {
        map.setTarget(undefined);
      }
    };
  }, []);

  // Force map resize when sidebar toggles
  useEffect(() => {
    if (mapInstanceRef.current) {
      setTimeout(() => {
        mapInstanceRef.current?.updateSize();
        console.log('🔄 Map resized due to sidebar change');
      }, 250);
    }
  }, [sidebarOpen]);

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        margin: 0,
        padding: 0,
        overflow: 'hidden',
        transform: 'translate3d(0, 0, 0)',
        backgroundColor: '#f3f4f6'
      }}
    >
      {/* Header - Fixed height */}
      <div 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '60px',
          backgroundColor: 'white',
          borderBottom: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
          zIndex: 10
        }}
      >
        <div className="flex items-center justify-between px-4" style={{ height: '100%' }}>
          <div className="flex items-center gap-3">
            <MapIcon className="text-blue-600" size={28} />
            <h1 className="text-xl font-bold text-gray-800">MapVue</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (mapInstanceRef.current) {
                  mapInstanceRef.current.updateSize();
                  console.log('🔄 Map refreshed');
                }
              }}
              className="px-3 py-1 rounded bg-blue-500 text-white text-sm"
            >
              Refresh Map
            </button>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200"
            >
              <Layers size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Sidebar - Fixed positioning */}
      {sidebarOpen && (
        <div 
          style={{
            position: 'absolute',
            top: '60px',
            left: 0,
            width: '320px',
            height: 'calc(100vh - 60px)',
            backgroundColor: 'white',
            boxShadow: '4px 0 6px -1px rgb(0 0 0 / 0.1)',
            overflowY: 'auto',
            zIndex: 5
          }}
        >
          <div style={{ padding: '12px' }}>
            <h2 className="text-lg font-semibold mb-4">Tools</h2>
            
            <div className="grid grid-cols-2 gap-2 mb-4">
              {drawingTools.map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => setActiveTool(tool.id)}
                  className={`p-3 rounded border-2 flex flex-col items-center gap-2 ${
                    activeTool === tool.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200'
                  }`}
                >
                  {tool.icon}
                  <span className="text-sm">{tool.name}</span>
                </button>
              ))}
            </div>

            <div className="p-3 bg-green-50 rounded border border-green-200">
              <div className="text-sm font-medium text-green-800">🎉 Map Working!</div>
              <div className="text-xs text-green-600 mt-1">
                OpenLayers is now displaying properly. Drawing tools will be added next.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Map Container - Absolute positioning */}
      <div 
        style={{
          position: 'absolute',
          top: '60px',
          left: sidebarOpen ? '320px' : '0',
          right: 0,
          bottom: 0,
          overflow: 'hidden'
        }}
      >
        <div
          ref={mapRef}
          className="map-container"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100%',
            height: '100%',
            margin: 0,
            padding: 0
          }}
        />
      </div>
    </div>
  );
}

export default App;