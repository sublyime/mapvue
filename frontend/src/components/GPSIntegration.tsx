import React, { useState, useEffect } from 'react';
import { Usb, Smartphone, Wifi, Upload, Download, X, CheckCircle, AlertTriangle } from 'lucide-react';
import { GPSDeviceManager } from '../utils/gpsDeviceManager';
import type { GPSDevice } from '../utils/gpsDeviceManager';
import type { RouteData } from './RouteManager';

interface GPSIntegrationProps {
  onRouteImported?: (route: RouteData) => void;
  currentRoute?: RouteData | null;
}

const GPSIntegration: React.FC<GPSIntegrationProps> = ({
  currentRoute
}) => {
  const [deviceManager] = useState(() => new GPSDeviceManager({
    onDeviceConnected: (device) => {
      setConnectedDevices(prev => [...prev.filter(d => d.id !== device.id), device]);
      setConnectionStatus('connected');
      setStatusMessage(`Connected to ${device.name}`);
    },
    onDeviceDisconnected: (deviceId) => {
      setConnectedDevices(prev => prev.filter(d => d.id !== deviceId));
      setConnectionStatus('disconnected');
      setStatusMessage('Device disconnected');
    },
    onDataReceived: (deviceId, data) => {
      setDataLog(prev => [...prev, { deviceId, data, timestamp: new Date() }].slice(-50));
    }
  }));

  const [isSupported, setIsSupported] = useState(false);
  const [connectedDevices, setConnectedDevices] = useState<GPSDevice[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [statusMessage, setStatusMessage] = useState('No devices connected');
  const [dataLog, setDataLog] = useState<{ deviceId: string; data: string; timestamp: Date }[]>([]);
  const [showDataLog, setShowDataLog] = useState(false);

  useEffect(() => {
    setIsSupported(deviceManager.isSupported());
    if (!deviceManager.isSupported()) {
      setStatusMessage('Web Serial API not supported in this browser');
    }
  }, [deviceManager]);

  const handleConnect = async () => {
    if (!isSupported) return;

    setIsConnecting(true);
    setConnectionStatus('connecting');
    setStatusMessage('Requesting device connection...');

    try {
      const device = await deviceManager.connectDevice();
      if (device) {
        setStatusMessage(`Successfully connected to ${device.name}`);
      }
    } catch (error: any) {
      setConnectionStatus('disconnected');
      if (error.name === 'NotFoundError') {
        setStatusMessage('No device selected');
      } else if (error.name === 'SecurityError') {
        setStatusMessage('Permission denied');
      } else {
        setStatusMessage(`Connection failed: ${error.message}`);
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async (deviceId: string) => {
    try {
      await deviceManager.disconnectDevice(deviceId);
    } catch (error: any) {
      setStatusMessage(`Disconnect failed: ${error.message}`);
    }
  };

  const handleExportRoute = async (deviceId: string) => {
    if (!currentRoute) {
      setStatusMessage('No route selected for export');
      return;
    }

    try {
      await deviceManager.exportRoute(deviceId, currentRoute);
      setStatusMessage(`Route "${currentRoute.name}" exported to device`);
    } catch (error: any) {
      setStatusMessage(`Export failed: ${error.message}`);
    }
  };

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'connecting':
        return <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />;
      case 'disconnected':
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-500" />;
    }
  };

  if (!isSupported) {
    return (
      <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-yellow-600" />
          <span className="text-sm font-medium text-yellow-800">GPS Device Integration</span>
        </div>
        <p className="text-xs text-yellow-700 mt-1">
          Your browser doesn't support Web Serial API. Try using Chrome, Edge, or Opera.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Usb className="w-4 h-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-800">GPS Devices</span>
        </div>
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className="text-xs text-gray-600">{connectedDevices.length} connected</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-3 space-y-3">
        {/* Status Message */}
        <div className="p-2 bg-gray-50 rounded border border-gray-200">
          <p className="text-xs text-gray-700">{statusMessage}</p>
        </div>

        {/* Connection Controls */}
        {connectedDevices.length === 0 ? (
          <button
            onClick={handleConnect}
            disabled={isConnecting}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors text-sm"
          >
            <Smartphone className="w-4 h-4" />
            {isConnecting ? 'Connecting...' : 'Connect GPS Device'}
          </button>
        ) : (
          <div className="space-y-2">
            {connectedDevices.map((device) => (
              <div key={device.id} className="p-2 bg-green-50 rounded border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-green-800">{device.name}</div>
                    <div className="text-xs text-green-600">{device.manufacturer} • {device.type}</div>
                  </div>
                  <button
                    onClick={() => handleDisconnect(device.id)}
                    className="p-1 text-green-600 hover:text-green-800 hover:bg-green-100 rounded"
                    title="Disconnect"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>

                {/* Device Actions */}
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => handleExportRoute(device.id)}
                    disabled={!currentRoute}
                    className="flex-1 flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200 disabled:bg-gray-100 disabled:text-gray-500"
                  >
                    <Upload className="w-3 h-3" />
                    Export Route
                  </button>
                  
                  <button
                    onClick={() => {/* Future: Import functionality */}}
                    disabled={true}
                    className="flex-1 flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-500 rounded text-xs"
                  >
                    <Download className="w-3 h-3" />
                    Import (Soon)
                  </button>
                </div>
              </div>
            ))}
            
            <button
              onClick={handleConnect}
              disabled={isConnecting}
              className="w-full flex items-center justify-center gap-2 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200 disabled:bg-gray-100"
            >
              <Smartphone className="w-3 h-3" />
              Connect Another Device
            </button>
          </div>
        )}

        {/* Data Log Toggle */}
        {connectedDevices.length > 0 && (
          <div className="border-t border-gray-200 pt-3">
            <button
              onClick={() => setShowDataLog(!showDataLog)}
              className="flex items-center gap-2 text-xs text-gray-600 hover:text-gray-800"
            >
              <Wifi className="w-3 h-3" />
              Data Log ({dataLog.length})
            </button>
            
            {showDataLog && (
              <div className="mt-2 max-h-32 overflow-y-auto bg-gray-50 rounded border border-gray-200 p-2">
                {dataLog.length === 0 ? (
                  <p className="text-xs text-gray-500">No data received yet</p>
                ) : (
                  <div className="space-y-1">
                    {dataLog.slice(-10).map((log, index) => (
                      <div key={index} className="text-xs font-mono text-gray-700">
                        <span className="text-gray-500">
                          {log.timestamp.toLocaleTimeString()}:
                        </span>
                        <span className="ml-1 break-all">{log.data.slice(0, 50)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Help Text */}
        <div className="text-xs text-gray-500 border-t border-gray-200 pt-2">
          <p><strong>Supported:</strong> Garmin, Magellan, Trimble, and NMEA-compatible GPS devices</p>
          <p className="mt-1"><strong>Requirements:</strong> Chrome/Edge browser with USB cable connection</p>
        </div>
      </div>
    </div>
  );
};

export default GPSIntegration;