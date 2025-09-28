import React, { useState } from 'react';
import { Smartphone, Download, Settings } from 'lucide-react';
import type { RouteData } from './RouteManager';
import { generateDeviceGPX, generateTCX, generateDeviceJSON } from '../utils/deviceExports';
import type { DeviceExportOptions } from '../utils/deviceExports';

interface DeviceExportProps {
  route: RouteData;
  onExport?: (format: string, device: string) => void;
}

const DeviceExport: React.FC<DeviceExportProps> = ({ route, onExport }) => {
  const [selectedDevice, setSelectedDevice] = useState<DeviceExportOptions['device']>('generic');
  const [selectedFormat, setSelectedFormat] = useState<DeviceExportOptions['format']>('gpx');
  const [workoutType, setWorkoutType] = useState<DeviceExportOptions['workoutType']>('generic');
  const [includeElevation, setIncludeElevation] = useState(true);
  const [includeHeartRate, setIncludeHeartRate] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const devices = [
    { id: 'garmin' as const, name: 'Garmin', icon: '🟢', formats: ['gpx', 'tcx'] as const },
    { id: 'fitbit' as const, name: 'Fitbit', icon: '🔵', formats: ['gpx', 'tcx', 'json'] as const },
    { id: 'apple' as const, name: 'Apple Watch', icon: '⚪', formats: ['gpx', 'json'] as const },
    { id: 'samsung' as const, name: 'Samsung Health', icon: '🟡', formats: ['gpx', 'json'] as const },
    { id: 'polar' as const, name: 'Polar', icon: '🔴', formats: ['gpx', 'tcx'] as const },
    { id: 'suunto' as const, name: 'Suunto', icon: '🟠', formats: ['gpx', 'tcx'] as const },
    { id: 'wahoo' as const, name: 'Wahoo', icon: '🔵', formats: ['gpx', 'tcx'] as const },
    { id: 'generic' as const, name: 'Generic GPS', icon: '⚫', formats: ['gpx', 'tcx', 'json'] as const }
  ];

  const workoutTypes = [
    { id: 'running' as const, name: 'Running', icon: '🏃' },
    { id: 'cycling' as const, name: 'Cycling', icon: '🚴' },
    { id: 'hiking' as const, name: 'Hiking', icon: '🥾' },
    { id: 'walking' as const, name: 'Walking', icon: '🚶' },
    { id: 'generic' as const, name: 'Generic', icon: '📍' }
  ];

  const currentDevice = devices.find(d => d.id === selectedDevice);
  const availableFormats = currentDevice?.formats || ['gpx'] as const;

  // Auto-select first available format when device changes
  React.useEffect(() => {
    if (availableFormats.length > 0 && !availableFormats.includes(selectedFormat as any)) {
      setSelectedFormat(availableFormats[0]);
    }
  }, [selectedDevice, availableFormats, selectedFormat]);

  const handleExport = () => {
    const options: DeviceExportOptions = {
      device: selectedDevice,
      format: selectedFormat,
      includeElevation,
      includeHeartRateZones: includeHeartRate,
      workoutType
    };

    let content = '';
    let mimeType = '';
    let extension = '';

    try {
      switch (selectedFormat) {
        case 'gpx':
          content = generateDeviceGPX(route, options);
          mimeType = 'application/gpx+xml';
          extension = 'gpx';
          break;
        case 'tcx':
          content = generateTCX(route, options);
          mimeType = 'application/tcx+xml';
          extension = 'tcx';
          break;
        case 'json':
          content = generateDeviceJSON(route, options);
          mimeType = 'application/json';
          extension = 'json';
          break;
        default:
          throw new Error(`Unsupported format: ${selectedFormat}`);
      }

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${route.name}_${selectedDevice}_${workoutType}.${extension}`;
      link.click();
      URL.revokeObjectURL(url);

      onExport?.(selectedFormat, selectedDevice);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    }
  };

  const getDeviceInstructions = (deviceId: string): string => {
    const instructions: { [key: string]: string } = {
      garmin: 'Transfer to Garmin/NewFiles folder on your device or use Garmin Express',
      fitbit: 'Import via Fitbit Connect or upload to Strava and sync',
      apple: 'Import via Apple Health app or compatible fitness apps',
      samsung: 'Import via Samsung Health app or transfer to device',
      polar: 'Use Polar FlowSync or upload to Polar Flow web service',
      suunto: 'Use SuuntoLink or upload to Suunto App',
      wahoo: 'Use Wahoo ElementSync or transfer directly to device',
      generic: 'Transfer to GPS device via USB or compatible software'
    };
    return instructions[deviceId] || 'Follow your device-specific import instructions';
  };

  return (
    <div className="space-y-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
      <div className="flex items-center gap-2">
        <Smartphone className="w-4 h-4 text-gray-600" />
        <h4 className="text-sm font-semibold text-gray-800">Device Export</h4>
      </div>

      {/* Device Selection */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2">
          Target Device
        </label>
        <div className="grid grid-cols-2 gap-2">
          {devices.map((device) => (
            <button
              key={device.id}
              onClick={() => setSelectedDevice(device.id as DeviceExportOptions['device'])}
              className={`flex items-center gap-2 p-2 rounded-md border text-left text-xs transition-all ${
                selectedDevice === device.id
                  ? 'bg-blue-100 border-blue-300 text-blue-800'
                  : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="text-sm">{device.icon}</span>
              <span className="font-medium">{device.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Format Selection */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2">
          Export Format
        </label>
        <div className="flex gap-2">
          {availableFormats.map((format) => (
            <button
              key={format}
              onClick={() => setSelectedFormat(format)}
              className={`px-3 py-2 rounded-md text-xs font-medium transition-all ${
                selectedFormat === format
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {format.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Workout Type Selection */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2">
          Activity Type
        </label>
        <div className="grid grid-cols-3 gap-1">
          {workoutTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => setWorkoutType(type.id as DeviceExportOptions['workoutType'])}
              className={`flex items-center gap-1 p-1.5 rounded text-xs transition-all ${
                workoutType === type.id
                  ? 'bg-green-100 border border-green-300 text-green-800'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="text-xs">{type.icon}</span>
              <span>{type.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Advanced Options */}
      <div>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 text-xs text-gray-600 hover:text-gray-800"
        >
          <Settings className="w-3 h-3" />
          Advanced Options
        </button>
        
        {showAdvanced && (
          <div className="mt-2 space-y-2 p-2 bg-white rounded border border-gray-200">
            <label className="flex items-center gap-2 text-xs text-gray-700">
              <input
                type="checkbox"
                checked={includeElevation}
                onChange={(e) => setIncludeElevation(e.target.checked)}
                className="w-3 h-3 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              Include elevation data
            </label>
            
            {selectedFormat === 'tcx' && (
              <label className="flex items-center gap-2 text-xs text-gray-700">
                <input
                  type="checkbox"
                  checked={includeHeartRate}
                  onChange={(e) => setIncludeHeartRate(e.target.checked)}
                  className="w-3 h-3 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                Include heart rate zones (estimated)
              </label>
            )}
          </div>
        )}
      </div>

      {/* Export Button and Instructions */}
      <div className="space-y-2">
        <button
          onClick={handleExport}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          <Download className="w-4 h-4" />
          Export for {currentDevice?.name}
        </button>
        
        <div className="p-2 bg-blue-50 rounded border border-blue-200">
          <p className="text-xs text-blue-800">
            <span className="font-medium">Transfer Instructions:</span>
            <br />
            {getDeviceInstructions(selectedDevice)}
          </p>
        </div>
      </div>

      {/* Route Preview */}
      <div className="text-xs text-gray-500 border-t border-gray-200 pt-2">
        <div className="flex justify-between">
          <span>Waypoints: {route.points.length}</span>
          <span>Format: {selectedFormat.toUpperCase()}</span>
        </div>
        <div className="flex justify-between mt-1">
          <span>Device: {currentDevice?.name}</span>
          <span>Activity: {workoutTypes.find(t => t.id === workoutType)?.name}</span>
        </div>
      </div>
    </div>
  );
};

export default DeviceExport;