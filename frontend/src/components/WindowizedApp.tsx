import React, { useEffect } from 'react';
import { WindowManagerProvider, useWindowManager } from '../contexts/WindowManagerContext';
import WindowRenderer from './WindowRenderer';
import MacOSDock from './MacOSDock';
import {
  RouteManagerWindow,
  LayerPanelWindow,
  MapLayerControlWindow,
  LocationTrackerWindow,
  GPSIntegrationWindow,
  SettingsWindow,
  DrawingToolsWindow,
  GISToolsWindow,
  FileOperationsWindow
} from './WindowComponents';
import type { Map } from 'ol';
import type { RouteData } from './RouteManager';

interface WindowizedAppProps {
  map: Map | null;
  children?: React.ReactNode;
  // Props for the various windows
  layers?: any[];  // GIS layers from backend
  mapLayers?: any[];  // Base map layers (OpenStreetMap, Satellite, etc.)
  activeLayerId?: string | null;
  onLayerSelect?: (layerId: string) => void;
  onLayerCreate?: (layerData: any) => void;
  onLayerDelete?: (layerId: string) => void;
  onLayerUpdate?: (layerId: string, layerData: any) => void;
  onLayerVisibilityToggle?: (layerId: string) => void;
  onLayerToggle?: (layerId: string) => void;
  onBaseLayerChange?: (layerId: string) => void;
  onRouteCreate?: (route: RouteData) => void;
  onRouteUpdate?: (route: RouteData) => void;
  onRouteDelete?: (routeId: string) => void;
  onRouteImported?: (route: RouteData) => void;
  currentRoute?: RouteData | null;
  // Drawing tools props
  drawingTools?: any[];
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
  // File operations props
  fileOperations?: {
    isImporting: boolean;
    isExporting: boolean;
    lastImportedFile: string | null;
    importError: string | null;
    exportError: string | null;
  };
  onFileImport?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onExportToFormat?: (format: string) => void;
  // GIS Tools props
  gisTools?: {
    activeTool: string;
    measurements: {
      distance: string | null;
      area: string | null;
      coordinates: string | null;
    };
  };
  onMeasureDistance?: () => void;
  onMeasureArea?: () => void;
  onCoordinatePicker?: () => void;
  onClearMeasurements?: () => void;
  onZoomToExtent?: () => void;
}

// Component to register all windows
const WindowRegistrar: React.FC<WindowizedAppProps> = (props) => {
  const windowManager = useWindowManager();
  const [initialized, setInitialized] = React.useState(false);

  useEffect(() => {
    if (initialized) return;

    // Register all available windows
    const windowConfigs = [
      {
        id: 'route-manager',
        title: 'Route Manager',
        component: <RouteManagerWindow 
          map={props.map}
          onRouteCreate={props.onRouteCreate}
          onRouteUpdate={props.onRouteUpdate}
          onRouteDelete={props.onRouteDelete}
        />,
        initialState: {
          width: 450,
          height: 600,
          x: 20,
          y: 20
        },
        persistent: true,
        allowMultiple: false
      },
      {
        id: 'layer-panel',
        title: 'Layer Panel',
        component: <LayerPanelWindow 
          layers={props.layers}
          activeLayerId={props.activeLayerId}
          onLayerSelect={props.onLayerSelect}
          onLayerCreate={props.onLayerCreate}
          onLayerDelete={props.onLayerDelete}
          onLayerUpdate={props.onLayerUpdate}
          onLayerVisibilityToggle={props.onLayerVisibilityToggle}
        />,
        initialState: {
          width: 350,
          height: 500,
          x: 500,
          y: 20
        },
        persistent: true,
        allowMultiple: false
      },
      {
        id: 'map-layers',
        title: 'Map Layers',
        component: <MapLayerControlWindow 
          layers={props.mapLayers}
          onLayerToggle={props.onLayerToggle}
          onBaseLayerChange={props.onBaseLayerChange}
        />,
        initialState: {
          width: 320,
          height: 400,
          x: 880,
          y: 20
        },
        persistent: false,
        allowMultiple: false
      },
      {
        id: 'location-tracker',
        title: 'Location Tracker',
        component: <LocationTrackerWindow 
          onRouteUpdate={props.onRouteUpdate}
          onRecordingComplete={props.onRouteCreate}
        />,
        initialState: {
          width: 380,
          height: 450,
          x: 100,
          y: 100
        },
        persistent: false,
        allowMultiple: false
      },
      {
        id: 'gps-integration',
        title: 'GPS Devices',
        component: <GPSIntegrationWindow 
          onRouteImported={props.onRouteImported}
          currentRoute={props.currentRoute}
        />,
        initialState: {
          width: 400,
          height: 500,
          x: 150,
          y: 150
        },
        persistent: false,
        allowMultiple: false
      },
      {
        id: 'drawing-tools',
        title: 'Drawing Tools',
        component: <DrawingToolsWindow 
          drawingTools={props.drawingTools}
          activeTool={props.activeTool}
          featureCount={props.featureCount}
          backendSync={props.backendSync}
          onToolClick={props.onToolClick}
          onToggleBackendSync={props.onToggleBackendSync}
          onSaveToBackend={props.onSaveToBackend}
          onClearAllFeatures={props.onClearAllFeatures}
        />,
        initialState: {
          width: 300,
          height: 400,
          x: 250,
          y: 250
        },
        persistent: false,
        allowMultiple: false
      },
      {
        id: 'file-operations',
        title: 'File Operations',
        component: <FileOperationsWindow 
          fileOperations={props.fileOperations}
          onFileImport={props.onFileImport}
          onExportToFormat={props.onExportToFormat}
        />,
        initialState: {
          width: 350,
          height: 380,
          x: 320,
          y: 320
        },
        persistent: false,
        allowMultiple: false
      },
      {
        id: 'settings',
        title: 'Settings',
        component: <SettingsWindow />,
        initialState: {
          width: 450,
          height: 550,
          x: 200,
          y: 100
        },
        persistent: false,
        allowMultiple: false
      },
      {
        id: 'tools',
        title: 'GIS Tools',
        component: <GISToolsWindow 
          map={props.map}
          activeTool={props.gisTools?.activeTool || 'none'}
          measurements={props.gisTools?.measurements || { distance: null, area: null, coordinates: null }}
          onMeasureDistance={props.onMeasureDistance}
          onMeasureArea={props.onMeasureArea}
          onCoordinatePicker={props.onCoordinatePicker}
          onClearMeasurements={props.onClearMeasurements}
          onZoomToExtent={props.onZoomToExtent}
        />,
        initialState: {
          width: 300,
          height: 500,
          x: 300,
          y: 200
        },
        persistent: false,
        allowMultiple: false
      }
    ];

    // Register all windows
    windowConfigs.forEach(config => {
      windowManager.registerWindow(config);
    });

    // Don't auto-open any windows on startup - let users open them via dock
    // This ensures all windows start completely closed/minimized

    setInitialized(true);
  }, [initialized, windowManager, props]);

  return null;
};

const WindowizedApp: React.FC<WindowizedAppProps> = (props) => {
  return (
    <WindowManagerProvider>
      <div className="relative w-full h-full">
        {/* Register all windows */}
        <WindowRegistrar {...props} />
        
        {/* Main application content */}
        <div className="w-full h-full">
          {props.children}
        </div>
        
        {/* Render all windows */}
        <WindowRenderer />
        
        {/* MacOS-style Dock */}
        <MacOSDock />
      </div>
    </WindowManagerProvider>
  );
};

export default WindowizedApp;