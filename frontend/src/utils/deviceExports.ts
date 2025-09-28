/**
 * Device-specific route export utilities for fitness/GPS devices
 * Supports: Garmin, Fitbit, Apple Watch, Samsung Health, Polar, Suunto, etc.
 */

import type { RouteData, RoutePoint } from '../components/RouteManager';

export interface DeviceExportOptions {
  device: 'garmin' | 'fitbit' | 'apple' | 'samsung' | 'polar' | 'suunto' | 'wahoo' | 'generic';
  format: 'gpx' | 'tcx' | 'fit' | 'json';
  includeElevation?: boolean;
  includeHeartRateZones?: boolean;
  workoutType?: 'running' | 'cycling' | 'hiking' | 'walking' | 'generic';
}

export interface ElevationData {
  point: RoutePoint;
  elevation: number;
  slope: number;
}

/**
 * Enhanced GPX generator with device-specific optimizations
 */
export const generateDeviceGPX = (route: RouteData, options: DeviceExportOptions): string => {
  const { device, includeElevation = false, workoutType = 'generic' } = options;
  
  // Device-specific GPX variations
  const garminExtensions = device === 'garmin' ? `
  <extensions>
    <gpxx:RouteExtension>
      <gpxx:IsAutoNamed>true</gpxx:IsAutoNamed>
      <gpxx:DisplayColor>Blue</gpxx:DisplayColor>
    </gpxx:RouteExtension>
  </extensions>` : '';

  const waypoints = route.points.map((point, index) => {
    const elevation = includeElevation && point.elevation 
      ? `<ele>${point.elevation}</ele>` 
      : '';
      
    const deviceSpecificExtensions = getWaypointExtensions(point, device, index);
    
    return `    <wpt lat="${point.coordinates[1]}" lon="${point.coordinates[0]}">
      <name>${point.name}</name>
      ${elevation}
      <type>${getDevicePointType(point.type, device)}</type>
      <desc>${getPointDescription(point, workoutType)}</desc>
      ${deviceSpecificExtensions}
    </wpt>`;
  }).join('\n');

  const trackPoints = route.points.map((point, index) => {
    const elevation = includeElevation && point.elevation 
      ? `<ele>${point.elevation}</ele>` 
      : '';
      
    const timestamp = new Date(Date.now() + index * 30000).toISOString(); // 30 second intervals
    
    return `      <trkpt lat="${point.coordinates[1]}" lon="${point.coordinates[0]}">
        ${elevation}
        <time>${timestamp}</time>
        ${getTrackPointExtensions(point, device)}
      </trkpt>`;
  }).join('\n');

  const gpxNamespaces = getGPXNamespaces(device);
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="MapVue-${device}" ${gpxNamespaces}>
  <metadata>
    <name>${route.name}</name>
    <desc>${route.description} - Optimized for ${device.toUpperCase()}</desc>
    <time>${route.createdAt.toISOString()}</time>
    <keywords>${workoutType},${device},route,gps</keywords>
  </metadata>
${waypoints}
  <rte>
    <name>${route.name}</name>
    <desc>${route.description}</desc>
    ${route.points.map((point) => 
      `<rtept lat="${point.coordinates[1]}" lon="${point.coordinates[0]}">
        <name>${point.name}</name>
        ${includeElevation && point.elevation ? `<ele>${point.elevation}</ele>` : ''}
      </rtept>`
    ).join('\n    ')}
    ${garminExtensions}
  </rte>
  <trk>
    <name>${route.name}</name>
    <desc>${route.description}</desc>
    <type>${workoutType}</type>
    <trkseg>
${trackPoints}
    </trkseg>
  </trk>
</gpx>`;
};

/**
 * Generate TCX (Training Center XML) for fitness devices
 */
export const generateTCX = (route: RouteData, options: DeviceExportOptions): string => {
  const { workoutType = 'generic', includeHeartRateZones = false } = options;
  
  const activityType = getTCXActivityType(workoutType);
  const startTime = route.createdAt.toISOString();
  
  const trackPoints = route.points.map((point, index) => {
    const timestamp = new Date(route.createdAt.getTime() + index * 30000).toISOString();
    const elevation = point.elevation || 0;
    
    return `        <Trackpoint>
          <Time>${timestamp}</Time>
          <Position>
            <LatitudeDegrees>${point.coordinates[1]}</LatitudeDegrees>
            <LongitudeDegrees>${point.coordinates[0]}</LongitudeDegrees>
          </Position>
          <AltitudeMeters>${elevation}</AltitudeMeters>
          ${includeHeartRateZones ? getHeartRateZoneXML(index, workoutType) : ''}
        </Trackpoint>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<TrainingCenterDatabase xmlns="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2">
  <Activities>
    <Activity Sport="${activityType}">
      <Id>${startTime}</Id>
      <Lap StartTime="${startTime}">
        <TotalTimeSeconds>${route.points.length * 30}</TotalTimeSeconds>
        <DistanceMeters>${calculateRouteDistance(route.points)}</DistanceMeters>
        <Calories>${estimateCalories(route, workoutType)}</Calories>
        <Intensity>Active</Intensity>
        <TriggerMethod>Manual</TriggerMethod>
        <Track>
${trackPoints}
        </Track>
      </Lap>
      <Creator>
        <Name>MapVue Route Planner</Name>
        <UnitId>0</UnitId>
        <ProductID>0</ProductID>
        <Version>
          <VersionMajor>1</VersionMajor>
          <VersionMinor>0</VersionMinor>
        </Version>
      </Creator>
    </Activity>
  </Activities>
</TrainingCenterDatabase>`;
};

/**
 * Generate device-specific JSON formats
 */
export const generateDeviceJSON = (route: RouteData, options: DeviceExportOptions): string => {
  const { device } = options;
  
  switch (device) {
    case 'apple':
      return generateAppleHealthFormat(route);
    case 'samsung':
      return generateSamsungHealthFormat(route);
    case 'fitbit':
      return generateFitbitFormat(route);
    default:
      return generateGenericGeoJSON(route);
  }
};

// Helper functions
const getGPXNamespaces = (device: string): string => {
  const base = 'xmlns="http://www.topografix.com/GPX/1/1"';
  
  switch (device) {
    case 'garmin':
      return `${base} 
        xmlns:gpxx="http://www.garmin.com/xmlschemas/GpxExtensions/v3"
        xmlns:gpxtpx="http://www.garmin.com/xmlschemas/TrackPointExtension/v1"`;
    case 'polar':
      return `${base} xmlns:polar="http://www.polar.com/gpx/extensions"`;
    default:
      return base;
  }
};

const getDevicePointType = (type: string, device: string): string => {
  const typeMap: { [key: string]: { [device: string]: string } } = {
    start: {
      garmin: 'user',
      fitbit: 'waypoint',
      apple: 'start',
      samsung: 'start',
      generic: 'start'
    },
    waypoint: {
      garmin: 'user',
      fitbit: 'waypoint', 
      apple: 'waypoint',
      samsung: 'waypoint',
      generic: 'waypoint'
    },
    end: {
      garmin: 'user',
      fitbit: 'waypoint',
      apple: 'end',
      samsung: 'end', 
      generic: 'end'
    }
  };
  
  return typeMap[type]?.[device] || typeMap[type]?.generic || 'waypoint';
};

const getWaypointExtensions = (_point: RoutePoint, device: string, index: number): string => {
  switch (device) {
    case 'garmin':
      return `<extensions>
        <gpxx:WaypointExtension>
          <gpxx:DisplayMode>SymbolAndName</gpxx:DisplayMode>
          <gpxx:Proximity>100</gpxx:Proximity>
        </gpxx:WaypointExtension>
      </extensions>`;
    case 'polar':
      return `<extensions>
        <polar:waypoint>
          <polar:index>${index}</polar:index>
        </polar:waypoint>
      </extensions>`;
    default:
      return '';
  }
};

const getTrackPointExtensions = (point: RoutePoint, device: string): string => {
  switch (device) {
    case 'garmin':
      return point.elevation ? `<extensions>
        <gpxtpx:TrackPointExtension>
          <gpxtpx:atemp>20</gpxtpx:atemp>
        </gpxtpx:TrackPointExtension>
      </extensions>` : '';
    default:
      return '';
  }
};

const getPointDescription = (point: RoutePoint, workoutType: string): string => {
  const typeDesc = point.type === 'start' ? 'Start point' : 
                   point.type === 'end' ? 'End point' : 'Waypoint';
  return `${typeDesc} for ${workoutType} route`;
};

const getTCXActivityType = (workoutType: string): string => {
  const typeMap: { [key: string]: string } = {
    running: 'Running',
    cycling: 'Biking', 
    hiking: 'Other',
    walking: 'Other',
    generic: 'Other'
  };
  
  return typeMap[workoutType] || 'Other';
};

const getHeartRateZoneXML = (index: number, workoutType: string): string => {
  // Simulate heart rate based on activity type and point in route
  const baseHR = workoutType === 'running' ? 140 : workoutType === 'cycling' ? 130 : 120;
  const variability = Math.sin(index * 0.1) * 15;
  const heartRate = Math.round(baseHR + variability);
  
  return `<HeartRateBpm>
    <Value>${heartRate}</Value>
  </HeartRateBpm>`;
};

const calculateRouteDistance = (points: RoutePoint[]): number => {
  let distance = 0;
  
  for (let i = 1; i < points.length; i++) {
    const [lon1, lat1] = points[i - 1].coordinates;
    const [lon2, lat2] = points[i].coordinates;
    distance += haversineDistance(lat1, lon1, lat2, lon2);
  }
  
  return distance;
};

const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

const estimateCalories = (route: RouteData, workoutType: string): number => {
  const distance = calculateRouteDistance(route.points) / 1000; // km
  const caloriesPerKm: { [key: string]: number } = {
    running: 65,
    cycling: 35,
    hiking: 45,
    walking: 40,
    generic: 50
  };
  
  return Math.round(distance * (caloriesPerKm[workoutType] || 50));
};

const generateAppleHealthFormat = (route: RouteData): string => {
  return JSON.stringify({
    type: 'workout',
    workoutActivityType: 'HKWorkoutActivityTypeOther',
    duration: route.points.length * 30,
    totalDistance: calculateRouteDistance(route.points),
    locations: route.points.map(point => ({
      latitude: point.coordinates[1],
      longitude: point.coordinates[0],
      altitude: point.elevation || 0,
      timestamp: Date.now()
    }))
  }, null, 2);
};

const generateSamsungHealthFormat = (route: RouteData): string => {
  return JSON.stringify({
    exercise_type: 'com.samsung.health.exercise.custom',
    start_time: route.createdAt.getTime(),
    end_time: route.createdAt.getTime() + (route.points.length * 30000),
    locations: route.points.map((point, index) => ({
      latitude: point.coordinates[1], 
      longitude: point.coordinates[0],
      altitude: point.elevation || 0,
      timestamp: route.createdAt.getTime() + (index * 30000)
    }))
  }, null, 2);
};

const generateFitbitFormat = (route: RouteData): string => {
  return JSON.stringify({
    activityType: 'generic_exercise',
    startTime: route.createdAt.toISOString(),
    duration: route.points.length * 30000,
    gpsData: route.points.map(point => ({
      lat: point.coordinates[1],
      lng: point.coordinates[0],
      elevation: point.elevation || 0
    }))
  }, null, 2);
};

const generateGenericGeoJSON = (route: RouteData): string => {
  return JSON.stringify({
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {
          name: route.name,
          description: route.description,
          route_type: 'planned',
          points_count: route.points.length
        },
        geometry: {
          type: 'LineString',
          coordinates: route.points.map(p => [p.coordinates[0], p.coordinates[1], p.elevation || 0])
        }
      },
      ...route.points.map(point => ({
        type: 'Feature',
        properties: {
          name: point.name,
          type: point.type,
          elevation: point.elevation
        },
        geometry: {
          type: 'Point',
          coordinates: [point.coordinates[0], point.coordinates[1], point.elevation || 0]
        }
      }))
    ]
  }, null, 2);
};