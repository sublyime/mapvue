import React, { useState, useRef, useEffect } from 'react';
import { Route, Plus, X, Navigation, Save, Play, Pause, RotateCcw, Smartphone } from 'lucide-react';
import type { Map } from 'ol';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Feature from 'ol/Feature';
import LineString from 'ol/geom/LineString';
import Point from 'ol/geom/Point';
import { Style, Fill, Stroke, Circle } from 'ol/style';
import { fromLonLat, toLonLat } from 'ol/proj';
import DeviceExport from './DeviceExport';
import GPSIntegration from './GPSIntegration';
import LocationTracker from './LocationTracker';

export interface RoutePoint {
  id: string;
  name: string;
  coordinates: [number, number]; // [longitude, latitude]
  elevation?: number;
  type: 'start' | 'waypoint' | 'end';
}

export interface RouteData {
  id: string;
  name: string;
  description: string;
  points: RoutePoint[];
  distance?: number; // in meters
  duration?: number; // in seconds
  elevation?: {
    gain: number;
    loss: number;
    min: number;
    max: number;
  };
  createdAt: Date;
  modifiedAt: Date;
}

interface RouteManagerProps {
  map: Map | null;
  onRouteCreate?: (route: RouteData) => void;
  onRouteUpdate?: (route: RouteData) => void;
  onRouteDelete?: (routeId: string) => void;
}

const RouteManager: React.FC<RouteManagerProps> = ({
  map,
  onRouteCreate,
  onRouteDelete
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'planning' | 'tracking' | 'devices'>('planning');
  const [isCreating, setIsCreating] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [currentRoute, setCurrentRoute] = useState<RouteData | null>(null);
  const [savedRoutes, setSavedRoutes] = useState<RouteData[]>([]);
  const [newRouteName, setNewRouteName] = useState('');

  const routeLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
  const routeSourceRef = useRef<VectorSource>(new VectorSource());
  const waypointsRef = useRef<RoutePoint[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize route layer
  useEffect(() => {
    if (!map) return;

    const routeSource = routeSourceRef.current;
    const routeLayer = new VectorLayer({
      source: routeSource,
      style: (feature) => {
        const geometryType = feature.getGeometry()?.getType();
        
        if (geometryType === 'LineString') {
          return new Style({
            stroke: new Stroke({
              color: '#3b82f6',
              width: 4,
              lineDash: [10, 10]
            })
          });
        } else if (geometryType === 'Point') {
          const pointType = feature.get('pointType');
          let color = '#3b82f6';
          
          if (pointType === 'start') color = '#10b981';
          else if (pointType === 'end') color = '#ef4444';
          
          return new Style({
            image: new Circle({
              radius: 8,
              fill: new Fill({ color }),
              stroke: new Stroke({
                color: '#ffffff',
                width: 2
              })
            })
          });
        }
        return new Style();
      },
      zIndex: 500
    });

    map.addLayer(routeLayer);
    routeLayerRef.current = routeLayer;

    return () => {
      map.removeLayer(routeLayer);
    };
  }, [map]);

  // Handle map clicks for route creation
  useEffect(() => {
    if (!map || !isCreating) return;

    const handleMapClick = (event: any) => {
      const coordinate = toLonLat(event.coordinate);
      const newPoint: RoutePoint = {
        id: `waypoint_${Date.now()}`,
        name: `Point ${waypointsRef.current.length + 1}`,
        coordinates: [coordinate[0], coordinate[1]] as [number, number],
        type: waypointsRef.current.length === 0 ? 'start' : 'waypoint'
      };

      waypointsRef.current.push(newPoint);
      updateRouteVisualization();
    };

    map.on('click', handleMapClick);

    return () => {
      map.un('click', handleMapClick);
    };
  }, [map, isCreating]);

  const updateRouteVisualization = () => {
    if (!routeSourceRef.current) return;

    const source = routeSourceRef.current;
    source.clear();

    if (waypointsRef.current.length === 0) return;

    // Add waypoint markers
    waypointsRef.current.forEach((point, index) => {
      const isLast = index === waypointsRef.current.length - 1;
      const pointType = index === 0 ? 'start' : (isLast && waypointsRef.current.length > 1) ? 'end' : 'waypoint';
      
      const feature = new Feature({
        geometry: new Point(fromLonLat(point.coordinates)),
        pointType,
        routePointId: point.id
      });

      source.addFeature(feature);
    });

    // Add route line if we have multiple points
    if (waypointsRef.current.length > 1) {
      const coordinates = waypointsRef.current.map(p => fromLonLat(p.coordinates));
      const lineFeature = new Feature({
        geometry: new LineString(coordinates)
      });
      source.addFeature(lineFeature);
    }
  };

  const startRouteCreation = () => {
    setIsCreating(true);
    setNewRouteName(`Route ${savedRoutes.length + 1}`);
    waypointsRef.current = [];
    updateRouteVisualization();
  };

  const finishRouteCreation = () => {
    if (waypointsRef.current.length < 2) {
      alert('A route must have at least 2 points');
      return;
    }

    // Mark the last point as 'end'
    if (waypointsRef.current.length > 0) {
      waypointsRef.current[waypointsRef.current.length - 1].type = 'end';
    }

    const newRoute: RouteData = {
      id: `route_${Date.now()}`,
      name: newRouteName || `Route ${savedRoutes.length + 1}`,
      description: `Route with ${waypointsRef.current.length} waypoints`,
      points: [...waypointsRef.current],
      createdAt: new Date(),
      modifiedAt: new Date()
    };

    setSavedRoutes(prev => [...prev, newRoute]);
    setCurrentRoute(newRoute);
    setIsCreating(false);
    onRouteCreate?.(newRoute);

    updateRouteVisualization();
  };

  const cancelRouteCreation = () => {
    setIsCreating(false);
    waypointsRef.current = [];
    updateRouteVisualization();
  };

  const startRecording = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser');
      return;
    }

    setIsRecording(true);
    waypointsRef.current = [];
    
    // Start recording position every 5 seconds
    recordingIntervalRef.current = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newPoint: RoutePoint = {
            id: `recorded_${Date.now()}`,
            name: `Recorded Point ${waypointsRef.current.length + 1}`,
            coordinates: [position.coords.longitude, position.coords.latitude],
            elevation: position.coords.altitude || undefined,
            type: waypointsRef.current.length === 0 ? 'start' : 'waypoint'
          };

          waypointsRef.current.push(newPoint);
          updateRouteVisualization();
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }, 5000);
  };

  const stopRecording = () => {
    setIsRecording(false);
    
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }

    if (waypointsRef.current.length > 0) {
      waypointsRef.current[waypointsRef.current.length - 1].type = 'end';
      
      const recordedRoute: RouteData = {
        id: `recorded_${Date.now()}`,
        name: `Recorded Route ${new Date().toLocaleTimeString()}`,
        description: `Recorded route with ${waypointsRef.current.length} points`,
        points: [...waypointsRef.current],
        createdAt: new Date(),
        modifiedAt: new Date()
      };

      setSavedRoutes(prev => [...prev, recordedRoute]);
      setCurrentRoute(recordedRoute);
      onRouteCreate?.(recordedRoute);
    }
  };

  const loadRoute = (route: RouteData) => {
    setCurrentRoute(route);
    waypointsRef.current = [...route.points];
    updateRouteVisualization();
  };

  const clearRoute = () => {
    waypointsRef.current = [];
    setCurrentRoute(null);
    updateRouteVisualization();
  };

  // Handle route updates from LocationTracker
  const handleLiveRouteUpdate = (route: RouteData) => {
    setCurrentRoute(route);
    waypointsRef.current = [...route.points];
    updateRouteVisualization();
  };

  // Handle completed recordings from LocationTracker
  const handleRecordingComplete = (route: RouteData) => {
    setSavedRoutes(prev => [...prev, route]);
    setCurrentRoute(route);
    setIsRecording(false);
    onRouteCreate?.(route);
  };

  // Handle route imported from GPS device
  const handleRouteImported = (route: RouteData) => {
    setSavedRoutes(prev => [...prev, route]);
    setCurrentRoute(route);
    waypointsRef.current = [...route.points];
    updateRouteVisualization();
  };

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 min-w-80">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-t-lg"
      >
        <div className="flex items-center gap-2">
          <Route className="w-5 h-5 text-gray-700" />
          <span className="text-sm font-medium text-gray-800">Route Planning</span>
        </div>
        <div className="text-xs text-gray-500">
          {savedRoutes.length} saved routes
        </div>
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="border-t border-gray-200">
          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('planning')}
              className={`flex-1 px-3 py-2 text-xs font-medium ${
                activeTab === 'planning'
                  ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <Route className="w-3 h-3 inline mr-1" />
              Planning
            </button>
            <button
              onClick={() => setActiveTab('tracking')}
              className={`flex-1 px-3 py-2 text-xs font-medium ${
                activeTab === 'tracking'
                  ? 'bg-green-50 text-green-700 border-b-2 border-green-500'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <Navigation className="w-3 h-3 inline mr-1" />
              Tracking
            </button>
            <button
              onClick={() => setActiveTab('devices')}
              className={`flex-1 px-3 py-2 text-xs font-medium ${
                activeTab === 'devices'
                  ? 'bg-purple-50 text-purple-700 border-b-2 border-purple-500'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <Smartphone className="w-3 h-3 inline mr-1" />
              Devices
            </button>
          </div>

          <div className="p-3">
            {/* Planning Tab */}
            {activeTab === 'planning' && (
              <div className="space-y-4">
                {/* Route Creation Controls */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Create Route
                  </h4>
                  
                  {!isCreating && !isRecording ? (
                    <div className="flex gap-2">
                      <button
                        onClick={startRouteCreation}
                        className="flex-1 flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 text-sm"
                      >
                        <Plus className="w-4 h-4" />
                        Plan Route
                      </button>
                      <button
                        onClick={startRecording}
                        className="flex-1 flex items-center gap-2 px-3 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 text-sm"
                      >
                        <Play className="w-4 h-4" />
                        Record
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {isCreating && (
                        <div>
                          <input
                            type="text"
                            value={newRouteName}
                            onChange={(e) => setNewRouteName(e.target.value)}
                            placeholder="Route name"
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          />
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={finishRouteCreation}
                              className="flex-1 flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-sm"
                            >
                              <Save className="w-3 h-3" />
                              Save
                            </button>
                            <button
                              onClick={cancelRouteCreation}
                              className="flex-1 flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm"
                            >
                              <X className="w-3 h-3" />
                              Cancel
                            </button>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Click on map to add waypoints ({waypointsRef.current.length} added)
                          </div>
                        </div>
                      )}

                      {isRecording && (
                        <div>
                          <div className="flex items-center gap-2 p-2 bg-red-50 rounded border border-red-200">
                            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                            <span className="text-sm text-red-800">Recording route... ({waypointsRef.current.length} points)</span>
                          </div>
                          <button
                            onClick={stopRecording}
                            className="w-full flex items-center gap-2 px-3 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 text-sm mt-2"
                          >
                            <Pause className="w-4 h-4" />
                            Stop Recording
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Current Route Info */}
                {currentRoute && (
                  <div className="border-t border-gray-200 pt-4">
                    <h4 className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
                      Current Route
                    </h4>
                    <div className="p-2 bg-blue-50 rounded border border-blue-200">
                      <div className="text-sm font-medium text-blue-800">{currentRoute.name}</div>
                      <div className="text-xs text-blue-600">{currentRoute.points.length} waypoints</div>
                      
                      {/* Device Export Component */}
                      <div className="mt-3">
                        <DeviceExport 
                          route={currentRoute}
                          onExport={(format, device) => {
                            // Optional callback for tracking exports
                            console.log(`Exported ${currentRoute.name} as ${format} for ${device}`);
                          }}
                        />
                      </div>
                      
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={clearRoute}
                          className="flex-1 flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200"
                        >
                          <RotateCcw className="w-3 h-3" />
                          Clear
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Saved Routes */}
                {savedRoutes.length > 0 && (
                  <div className="border-t border-gray-200 pt-4">
                    <h4 className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
                      Saved Routes
                    </h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {savedRoutes.map((route) => (
                        <div
                          key={route.id}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs hover:bg-gray-100"
                        >
                          <div className="flex-1">
                            <div className="font-medium text-gray-800">{route.name}</div>
                            <div className="text-gray-500">{route.points.length} points</div>
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => loadRoute(route)}
                              className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                              title="Load route"
                            >
                              <Navigation className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => {
                                setSavedRoutes(prev => prev.filter(r => r.id !== route.id));
                                onRouteDelete?.(route.id);
                              }}
                              className="p-1 text-red-600 hover:bg-red-100 rounded"
                              title="Delete route"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tracking Tab */}
            {activeTab === 'tracking' && (
              <LocationTracker
                onRouteUpdate={handleLiveRouteUpdate}
                onRecordingComplete={handleRecordingComplete}
                isRecording={isRecording}
                onRecordingChange={setIsRecording}
              />
            )}

            {/* Devices Tab */}
            {activeTab === 'devices' && (
              <GPSIntegration
                onRouteImported={handleRouteImported}
                currentRoute={currentRoute}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RouteManager;