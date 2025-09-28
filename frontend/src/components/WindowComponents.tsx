import React from 'react';
import RouteManager from './RouteManager';
import LocationTracker from './LocationTracker';
import GPSIntegration from './GPSIntegration';
import { LayerPanel } from './LayerPanel';
import MapLayerControl from './MapLayerControl';
import { Pencil, Square, Minus, MousePointer, Edit, Upload, Download, FileText, Save } from 'lucide-react';
import type { Map } from 'ol';
import type { RouteData } from './RouteManager';

interface DrawingTool {
  id: string;
  name: string;
  icon: React.ReactNode;
  type: 'Point' | 'LineString' | 'Polygon' | 'select' | 'modify';
}

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

// Drawing Tools Window
interface DrawingToolsWindowProps {
  drawingTools?: DrawingTool[];
  activeTool?: string;
  featureCount?: { points: number; lines: number; polygons: number };
  backendSync?: {
    enabled: boolean;
    saving: boolean;
    lastSaved: Date | null;
    error: string | null;
  };
  onToolClick?: (toolId: string) => void;
  onToggleBackendSync?: () => void;
  onSaveToBackend?: () => void;
  onClearAllFeatures?: () => void;
}

export const DrawingToolsWindow: React.FC<DrawingToolsWindowProps> = ({
  drawingTools = [
    { id: 'point', name: 'Point', icon: <Pencil className="w-4 h-4" />, type: 'Point' },
    { id: 'line', name: 'Line', icon: <Minus className="w-4 h-4" />, type: 'LineString' },
    { id: 'polygon', name: 'Polygon', icon: <Square className="w-4 h-4" />, type: 'Polygon' },
    { id: 'select', name: 'Select', icon: <MousePointer className="w-4 h-4" />, type: 'select' },
    { id: 'modify', name: 'Modify', icon: <Edit className="w-4 h-4" />, type: 'modify' }
  ],
  activeTool = 'none',
  featureCount = { points: 0, lines: 0, polygons: 0 },
  backendSync = { enabled: false, saving: false, lastSaved: null, error: null },
  onToolClick = () => {},
  onToggleBackendSync = () => {},
  onSaveToBackend = () => {},
  onClearAllFeatures = () => {}
}) => {
  return (
    <div className="h-full p-4 overflow-y-auto">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">MapVue Drawing Tools</h3>
        
        {/* Drawing Tools Grid */}
        <div className="grid grid-cols-2 gap-2">
          {drawingTools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => onToolClick(tool.id)}
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

        {/* Active Tool Status */}
        <div className="p-3 bg-blue-50 rounded border border-blue-200">
          <div className="text-sm font-medium text-blue-800">
            Active Tool: {drawingTools.find(t => t.id === activeTool)?.name || 'None'}
          </div>
        </div>

        {/* Feature Count */}
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
              onClick={onToggleBackendSync}
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
                onClick={onSaveToBackend}
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

        {/* Clear All Button */}
        <button
          onClick={onClearAllFeatures}
          className="w-full px-3 py-2 bg-red-100 text-red-700 rounded-md border border-red-200 hover:bg-red-200 transition-colors text-sm font-medium"
        >
          Clear All Features
        </button>
      </div>
    </div>
  );
};

// File Operations Window
interface FileOperationsWindowProps {
  fileOperations?: {
    isImporting: boolean;
    isExporting: boolean;
    lastImportedFile: string | null;
    importError: string | null;
    exportError: string | null;
  };
  featureCount?: { points: number; lines: number; polygons: number };
  onFileImport?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onExportToFormat?: (format: string) => void;
}

export const FileOperationsWindow: React.FC<FileOperationsWindowProps> = ({
  fileOperations = {
    isImporting: false,
    isExporting: false,
    lastImportedFile: null,
    importError: null,
    exportError: null
  },
  featureCount = { points: 0, lines: 0, polygons: 0 },
  onFileImport = () => {},
  onExportToFormat = () => {}
}) => {
  return (
    <div className="h-full p-4 overflow-y-auto">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">File Operations</h3>
        
        {/* Import Section */}
        <div className="space-y-3">
          <div className="border-b border-gray-200 pb-2">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Import GIS Data</h4>
            <input
              type="file"
              accept=".geojson,.json,.kml,.gpx"
              onChange={onFileImport}
              disabled={fileOperations.isImporting}
              className="hidden"
              id="file-import-window"
            />
            <label
              htmlFor="file-import-window"
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
                onClick={() => onExportToFormat('geojson')}
                disabled={fileOperations.isExporting || featureCount.points + featureCount.lines + featureCount.polygons === 0}
                className="flex items-center gap-2 px-3 py-2 rounded-md border transition-all bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 disabled:bg-gray-100 disabled:border-gray-300 disabled:text-gray-500"
              >
                <Download className="w-4 h-4" />
                <span className="text-sm font-medium">Export GeoJSON</span>
              </button>
              
              <button
                onClick={() => onExportToFormat('kml')}
                disabled={fileOperations.isExporting || featureCount.points + featureCount.lines + featureCount.polygons === 0}
                className="flex items-center gap-2 px-3 py-2 rounded-md border transition-all bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100 disabled:bg-gray-100 disabled:border-gray-300 disabled:text-gray-500"
              >
                <Download className="w-4 h-4" />
                <span className="text-sm font-medium">Export KML</span>
              </button>
              
              <button
                onClick={() => onExportToFormat('gpx')}
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
    </div>
  );
};