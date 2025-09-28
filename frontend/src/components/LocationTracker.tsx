import React, { useState, useEffect, useCallback } from 'react';
import { MapPin, Play, Square, Navigation, Wifi, Signal } from 'lucide-react';
import type { RouteData } from './RouteManager';

interface LocationTrackerProps {
  onRouteUpdate?: (route: RouteData) => void;
  onRecordingComplete?: (route: RouteData) => void;
  isRecording?: boolean;
  onRecordingChange?: (recording: boolean) => void;
}

interface TrackPoint {
  latitude: number;
  longitude: number;
  timestamp: Date;
  altitude?: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
}

interface LocationState {
  available: boolean;
  permission: 'prompt' | 'granted' | 'denied';
  accuracy: 'high' | 'low';
  source: 'gps' | 'network' | 'passive';
}

const LocationTracker: React.FC<LocationTrackerProps> = ({
  onRouteUpdate,
  onRecordingComplete,
  isRecording = false,
  onRecordingChange
}) => {
  const [locationState, setLocationState] = useState<LocationState>({
    available: false,
    permission: 'prompt',
    accuracy: 'high',
    source: 'gps'
  });
  
  const [currentPosition, setCurrentPosition] = useState<TrackPoint | null>(null);
  const [trackPoints, setTrackPoints] = useState<TrackPoint[]>([]);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [recordingStartTime, setRecordingStartTime] = useState<Date | null>(null);
  const [distance, setDistance] = useState(0);
  const [duration, setDuration] = useState(0);
  const [averageSpeed, setAverageSpeed] = useState(0);

  // Check location availability on mount
  useEffect(() => {
    const checkLocationSupport = async () => {
      if (!('geolocation' in navigator)) {
        setLocationState(prev => ({ ...prev, available: false }));
        return;
      }

      try {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        setLocationState(prev => ({
          ...prev,
          available: true,
          permission: permission.state
        }));

        permission.addEventListener('change', () => {
          setLocationState(prev => ({ ...prev, permission: permission.state }));
        });
      } catch (error) {
        setLocationState(prev => ({ ...prev, available: true, permission: 'prompt' }));
      }
    };

    checkLocationSupport();
  }, []);

  // Calculate distance between two points (Haversine formula)
  const calculateDistance = useCallback((lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371000; // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }, []);

  // Update route statistics
  const updateStats = useCallback((points: TrackPoint[]) => {
    if (points.length < 2) return;

    let totalDistance = 0;
    for (let i = 1; i < points.length; i++) {
      const dist = calculateDistance(
        points[i-1].latitude, points[i-1].longitude,
        points[i].latitude, points[i].longitude
      );
      totalDistance += dist;
    }

    setDistance(totalDistance);

    if (recordingStartTime) {
      const dur = (Date.now() - recordingStartTime.getTime()) / 1000;
      setDuration(dur);
      
      if (dur > 0) {
        setAverageSpeed((totalDistance / dur) * 3.6); // Convert m/s to km/h
      }
    }
  }, [calculateDistance, recordingStartTime]);

  // Handle new position update
  const handlePositionUpdate = useCallback((position: GeolocationPosition) => {
    const newPoint: TrackPoint = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      timestamp: new Date(),
      altitude: position.coords.altitude || undefined,
      accuracy: position.coords.accuracy,
      speed: position.coords.speed || undefined,
      heading: position.coords.heading || undefined
    };

    setCurrentPosition(newPoint);

    if (isRecording) {
      setTrackPoints(prev => {
        const updated = [...prev, newPoint];
        updateStats(updated);
        
        // Convert to RouteData and notify parent
        const routeData: RouteData = {
          id: 'live-recording',
          name: `Live Recording - ${recordingStartTime?.toLocaleTimeString() || 'Unknown'}`,
          description: `Live route recorded from ${recordingStartTime?.toLocaleDateString() || 'unknown date'}`,
          points: updated.map((point, index) => ({
            id: `point-${index}`,
            name: `Point ${index + 1}`,
            coordinates: [point.longitude, point.latitude] as [number, number],
            elevation: point.altitude,
            type: index === 0 ? 'start' as const : 
                  index === updated.length - 1 ? 'end' as const : 
                  'waypoint' as const
          })),
          distance: distance,
          duration: duration,
          createdAt: recordingStartTime || new Date(),
          modifiedAt: new Date()
        };

        onRouteUpdate?.(routeData);
        
        return updated;
      });
    }
  }, [isRecording, distance, duration, averageSpeed, recordingStartTime, onRouteUpdate, updateStats]);

  // Handle geolocation errors
  const handlePositionError = useCallback((error: GeolocationPositionError) => {
    console.error('Location error:', error);
    let source: LocationState['source'] = 'gps';
    
    switch (error.code) {
      case error.PERMISSION_DENIED:
        setLocationState(prev => ({ ...prev, permission: 'denied' }));
        break;
      case error.POSITION_UNAVAILABLE:
        source = 'network';
        break;
      case error.TIMEOUT:
        source = 'passive';
        break;
    }
    
    setLocationState(prev => ({ ...prev, source }));
  }, []);

  // Start location tracking
  const startTracking = useCallback(() => {
    if (!locationState.available || locationState.permission === 'denied') return;

    const options: PositionOptions = {
      enableHighAccuracy: locationState.accuracy === 'high',
      timeout: 10000,
      maximumAge: 1000
    };

    const id = navigator.geolocation.watchPosition(
      handlePositionUpdate,
      handlePositionError,
      options
    );

    setWatchId(id);
  }, [locationState, handlePositionUpdate, handlePositionError]);

  // Stop location tracking
  const stopTracking = useCallback(() => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
  }, [watchId]);

  // Start recording
  const startRecording = useCallback(() => {
    setRecordingStartTime(new Date());
    setTrackPoints([]);
    setDistance(0);
    setDuration(0);
    setAverageSpeed(0);
    onRecordingChange?.(true);
    
    if (!watchId) {
      startTracking();
    }
  }, [onRecordingChange, startTracking, watchId]);

  // Stop recording
  const stopRecording = useCallback(() => {
    onRecordingChange?.(false);
    
    if (trackPoints.length > 0 && recordingStartTime) {
      const finalRoute: RouteData = {
        id: `recorded-${Date.now()}`,
        name: `Recorded Route - ${recordingStartTime.toLocaleDateString()} ${recordingStartTime.toLocaleTimeString()}`,
        description: `Route recorded on ${recordingStartTime.toLocaleDateString()} from ${recordingStartTime.toLocaleTimeString()}`,
        points: trackPoints.map((point, index) => ({
          id: `point-${index}`,
          name: `Point ${index + 1}`,
          coordinates: [point.longitude, point.latitude] as [number, number],
          elevation: point.altitude,
          type: index === 0 ? 'start' as const : 
                index === trackPoints.length - 1 ? 'end' as const : 
                'waypoint' as const
        })),
        distance: distance,
        duration: duration,
        createdAt: recordingStartTime,
        modifiedAt: new Date()
      };
      
      onRecordingComplete?.(finalRoute);
    }
  }, [onRecordingChange, trackPoints, recordingStartTime, distance, duration, averageSpeed, onRecordingComplete]);

  // Effect to handle recording state changes
  useEffect(() => {
    if (isRecording && watchId === null) {
      startTracking();
    } else if (!isRecording && watchId !== null && trackPoints.length === 0) {
      stopTracking();
    }
  }, [isRecording, watchId, startTracking, stopTracking, trackPoints.length]);

  // Format duration for display
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Format distance for display
  const formatDistance = (meters: number): string => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(2)} km`;
    }
    return `${meters.toFixed(0)} m`;
  };

  const getLocationIcon = () => {
    switch (locationState.source) {
      case 'gps':
        return <Navigation className="w-4 h-4 text-green-600" />;
      case 'network':
        return <Wifi className="w-4 h-4 text-blue-600" />;
      case 'passive':
        return <Signal className="w-4 h-4 text-orange-600" />;
      default:
        return <MapPin className="w-4 h-4 text-gray-600" />;
    }
  };

  const getAccuracyText = () => {
    if (!currentPosition?.accuracy) return 'Unknown';
    if (currentPosition.accuracy < 10) return 'High';
    if (currentPosition.accuracy < 50) return 'Medium';
    return 'Low';
  };

  if (!locationState.available) {
    return (
      <div className="bg-red-50 rounded-lg border border-red-200 p-3">
        <div className="text-sm font-medium text-red-800">Location Not Available</div>
        <p className="text-xs text-red-600 mt-1">Your browser doesn't support geolocation.</p>
      </div>
    );
  }

  if (locationState.permission === 'denied') {
    return (
      <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-3">
        <div className="text-sm font-medium text-yellow-800">Location Permission Denied</div>
        <p className="text-xs text-yellow-600 mt-1">Please enable location access in your browser settings.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          {getLocationIcon()}
          <span className="text-sm font-medium text-gray-800">Live Tracking</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${watchId ? 'bg-green-500' : 'bg-gray-400'}`}></div>
          <span className="text-xs text-gray-600">
            {watchId ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-3 space-y-3">
        {/* Current Position */}
        {currentPosition && (
          <div className="p-2 bg-green-50 rounded border border-green-200">
            <div className="text-xs font-medium text-green-800 mb-1">Current Position</div>
            <div className="text-xs text-green-700">
              <div>{currentPosition.latitude.toFixed(6)}, {currentPosition.longitude.toFixed(6)}</div>
              <div>Accuracy: {getAccuracyText()}</div>
              {currentPosition.speed && (
                <div>Speed: {(currentPosition.speed * 3.6).toFixed(1)} km/h</div>
              )}
            </div>
          </div>
        )}

        {/* Recording Stats */}
        {isRecording && (
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 bg-blue-50 rounded">
              <div className="text-xs font-medium text-blue-800">Distance</div>
              <div className="text-sm text-blue-700">{formatDistance(distance)}</div>
            </div>
            <div className="p-2 bg-purple-50 rounded">
              <div className="text-xs font-medium text-purple-800">Duration</div>
              <div className="text-sm text-purple-700">{formatDuration(duration)}</div>
            </div>
            <div className="p-2 bg-orange-50 rounded">
              <div className="text-xs font-medium text-orange-800">Avg Speed</div>
              <div className="text-sm text-orange-700">{averageSpeed.toFixed(1)} km/h</div>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex gap-2">
          {!isRecording ? (
            <>
              <button
                onClick={startRecording}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
              >
                <Play className="w-4 h-4" />
                Start Recording
              </button>
              <button
                onClick={startTracking}
                disabled={watchId !== null}
                className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors text-sm"
              >
                <MapPin className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={stopRecording}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
              >
                <Square className="w-4 h-4" />
                Stop Recording
              </button>
            </>
          )}
        </div>

        {/* Track Info */}
        {isRecording && (
          <div className="text-xs text-gray-600 border-t border-gray-200 pt-2">
            <div>Points Recorded: {trackPoints.length}</div>
            <div>Source: {locationState.source.toUpperCase()}</div>
            {recordingStartTime && (
              <div>Started: {recordingStartTime.toLocaleTimeString()}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationTracker;