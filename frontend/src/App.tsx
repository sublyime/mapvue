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
import { Pencil, Square, Minus, MousePointer, Edit } from 'lucide-react';
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

      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 z-10 max-w-md">
        <h4 className="text-sm font-semibold text-gray-800 mb-2">Instructions:</h4>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• Select a drawing tool and click on the map to draw</li>
          <li>• Use Select tool to highlight features</li>
          <li>• Use Modify tool to edit existing features</li>
          <li>• Double-click to finish drawing lines/polygons</li>
        </ul>
      </div>
    </div>
  );
};

export default App;