import React from 'react';
import RouteManager from './RouteManager';
import LocationTracker from './LocationTracker';
import GPSIntegration from './GPSIntegration';
import { LayerPanel } from './LayerPanel';
import MapLayerControl from './MapLayerControl';
import type { Map } from 'ol';
import type { RouteData } from './RouteManager';

// Window-wrapped Route Manager
interface RouteManagerWindowProps {
  map: Map | null;
  onRouteCreate?: (route: RouteData) => void;
  onRouteUpdate?: (route: RouteData) => void;
  onRouteDelete?: (routeId: string) => void;
}

export const RouteManagerWindow: React.FC<RouteManagerWindowProps> = (props) => {
  return (
    <div className="h-full">
      <RouteManager {...props} />
    </div>
  );
};

// Window-wrapped Layer Panel
interface LayerPanelWindowProps {
  // Layer panel props - made optional for window context
  layers?: any[];
  activeLayerId?: string | null;
  onLayerSelect?: (layerId: string) => void;
  onLayerCreate?: (layerData: any) => void;
  onLayerDelete?: (layerId: string) => void;
  onLayerUpdate?: (layerId: string, layerData: any) => void;
  onLayerVisibilityToggle?: (layerId: string) => void;
}

export const LayerPanelWindow: React.FC<LayerPanelWindowProps> = ({
  layers = [],
  activeLayerId = null,
  onLayerSelect = () => {},
  onLayerCreate = () => {},
  onLayerDelete = () => {},
  onLayerUpdate = () => {},
  onLayerVisibilityToggle = () => {},
  ...props
}) => {
  return (
    <div className="h-full p-4">
      <LayerPanel 
        layers={layers}
        activeLayerId={activeLayerId}
        onLayerSelect={onLayerSelect}
        onLayerCreate={onLayerCreate}
        onLayerDelete={onLayerDelete}
        onLayerUpdate={onLayerUpdate}
        onLayerVisibilityToggle={onLayerVisibilityToggle}
        {...props} 
      />
    </div>
  );
};

// Window-wrapped Map Layer Control
interface MapLayerControlWindowProps {
  layers?: any[];
  onLayerToggle?: (layerId: string) => void;
  onBaseLayerChange?: (layerId: string) => void;
}

export const MapLayerControlWindow: React.FC<MapLayerControlWindowProps> = ({
  layers = [],
  onLayerToggle = () => {},
  onBaseLayerChange = () => {}
}) => {
  return (
    <div className="h-full">
      <MapLayerControl 
        layers={layers}
        onLayerToggle={onLayerToggle}
        onBaseLayerChange={onBaseLayerChange}
      />
    </div>
  );
};

// Window-wrapped Location Tracker
interface LocationTrackerWindowProps {
  onRouteUpdate?: (route: RouteData) => void;
  onRecordingComplete?: (route: RouteData) => void;
}

export const LocationTrackerWindow: React.FC<LocationTrackerWindowProps> = (props) => {
  return (
    <div className="h-full">
      <LocationTracker {...props} />
    </div>
  );
};

// Window-wrapped GPS Integration
interface GPSIntegrationWindowProps {
  onRouteImported?: (route: RouteData) => void;
  currentRoute?: RouteData | null;
}

export const GPSIntegrationWindow: React.FC<GPSIntegrationWindowProps> = (props) => {
  return (
    <div className="h-full">
      <GPSIntegration {...props} />
    </div>
  );
};

// Settings Window (placeholder)
export const SettingsWindow: React.FC = () => {
  return (
    <div className="h-full p-4">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">Application Settings</h3>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded border">
            <div>
              <div className="font-medium text-gray-700">Auto-save Routes</div>
              <div className="text-sm text-gray-500">Automatically save routes as you create them</div>
            </div>
            <input type="checkbox" className="toggle" defaultChecked />
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded border">
            <div>
              <div className="font-medium text-gray-700">High Accuracy GPS</div>
              <div className="text-sm text-gray-500">Use high accuracy mode for location tracking</div>
            </div>
            <input type="checkbox" className="toggle" defaultChecked />
          </div>

          <div className="space-y-2">
            <label className="block font-medium text-gray-700">Default Map Layer</label>
            <select className="w-full p-2 border border-gray-300 rounded">
              <option>OpenStreetMap</option>
              <option>USGS Topographic</option>
              <option>Esri World Imagery</option>
              <option>Esri World Terrain</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block font-medium text-gray-700">Recording Interval (seconds)</label>
            <input 
              type="number" 
              className="w-full p-2 border border-gray-300 rounded" 
              defaultValue={5} 
              min={1} 
              max={60} 
            />
          </div>
        </div>

        <div className="pt-4 border-t border-gray-200">
          <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

// Tools Panel Window
export const ToolsPanelWindow: React.FC = () => {
  return (
    <div className="h-full p-4">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">GIS Tools</h3>
        
        <div className="grid grid-cols-2 gap-3">
          <button className="p-3 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm">
            Measure Distance
          </button>
          <button className="p-3 bg-green-100 text-green-700 rounded hover:bg-green-200 text-sm">
            Measure Area
          </button>
          <button className="p-3 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 text-sm">
            Draw Polygon
          </button>
          <button className="p-3 bg-orange-100 text-orange-700 rounded hover:bg-orange-200 text-sm">
            Add Marker
          </button>
          <button className="p-3 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm">
            Draw Line
          </button>
          <button className="p-3 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 text-sm">
            Add Text
          </button>
        </div>

        <div className="pt-4 border-t border-gray-200">
          <h4 className="font-medium text-gray-700 mb-2">Quick Actions</h4>
          <div className="space-y-2">
            <button className="w-full p-2 text-left bg-gray-100 rounded hover:bg-gray-200 text-sm">
              Clear All Drawings
            </button>
            <button className="w-full p-2 text-left bg-gray-100 rounded hover:bg-gray-200 text-sm">
              Export to KML
            </button>
            <button className="w-full p-2 text-left bg-gray-100 rounded hover:bg-gray-200 text-sm">
              Import GPS File
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};