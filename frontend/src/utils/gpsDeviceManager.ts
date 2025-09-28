/**
 * GPS Device Integration using Web Serial API
 * Supports various GPS devices for importing/exporting routes and tracks
 */

/// <reference path="../types/webserial.d.ts" />

import type { RouteData } from '../components/RouteManager';

export interface GPSDevice {
  id: string;
  name: string;
  manufacturer: string;
  type: 'handheld' | 'watch' | 'cycling' | 'marine' | 'automotive';
  protocols: GPSProtocol[];
  connected: boolean;
  port?: SerialPort;
}

export interface GPSProtocol {
  name: string;
  baud: number;
  dataBits: number;
  stopBits: number;
  parity: 'none' | 'even' | 'odd';
  commands: {
    getRoutes: string;
    getTracks: string;
    uploadRoute: string;
    getWaypoints: string;
  };
}

export interface GPSTrackData {
  id: string;
  name: string;
  points: {
    latitude: number;
    longitude: number;
    elevation?: number;
    time?: Date;
    speed?: number;
    heading?: number;
  }[];
  startTime: Date;
  endTime: Date;
  distance: number;
  duration: number;
}

export class GPSDeviceManager {
  private connectedDevices: Map<string, GPSDevice> = new Map();
  private onDeviceConnected?: (device: GPSDevice) => void;
  private onDeviceDisconnected?: (deviceId: string) => void;
  private onDataReceived?: (deviceId: string, data: string) => void;

  constructor(callbacks?: {
    onDeviceConnected?: (device: GPSDevice) => void;
    onDeviceDisconnected?: (deviceId: string) => void;
    onDataReceived?: (deviceId: string, data: string) => void;
  }) {
    this.onDeviceConnected = callbacks?.onDeviceConnected;
    this.onDeviceDisconnected = callbacks?.onDeviceDisconnected;
    this.onDataReceived = callbacks?.onDataReceived;
  }

  /**
   * Check if Web Serial API is supported
   */
  isSupported(): boolean {
    return 'serial' in navigator;
  }

  /**
   * Request permission and connect to a GPS device
   */
  async connectDevice(): Promise<GPSDevice | null> {
    if (!this.isSupported()) {
      throw new Error('Web Serial API is not supported in this browser');
    }

    try {
      // Request a port
      const port = await navigator.serial.requestPort();
      
      // Open the serial port with common GPS settings
      await port.open({
        baudRate: 4800, // Common GPS baud rate
        dataBits: 8,
        stopBits: 1,
        parity: 'none'
      });

      const device: GPSDevice = {
        id: `device_${Date.now()}`,
        name: 'GPS Device',
        manufacturer: 'Generic',
        type: 'handheld',
        protocols: [{
          name: 'NMEA 0183',
          baud: 4800,
          dataBits: 8,
          stopBits: 1,
          parity: 'none',
          commands: {
            getRoutes: '$GPRTE',
            getTracks: '$GPTXT',
            uploadRoute: '$GPRTE',
            getWaypoints: '$GPWPL'
          }
        }],
        connected: true,
        port
      };

      this.connectedDevices.set(device.id, device);
      this.onDeviceConnected?.(device);

      // Start listening for data
      this.startDataListener(device);

      return device;
    } catch (error) {
      console.error('Failed to connect to GPS device:', error);
      throw error;
    }
  }

  /**
   * Disconnect from a GPS device
   */
  async disconnectDevice(deviceId: string): Promise<void> {
    const device = this.connectedDevices.get(deviceId);
    if (!device || !device.port) return;

    try {
      await device.port.close();
      this.connectedDevices.delete(deviceId);
      this.onDeviceDisconnected?.(deviceId);
    } catch (error) {
      console.error('Failed to disconnect GPS device:', error);
      throw error;
    }
  }

  /**
   * Get list of connected devices
   */
  getConnectedDevices(): GPSDevice[] {
    return Array.from(this.connectedDevices.values());
  }

  /**
   * Export route to connected GPS device
   */
  async exportRoute(deviceId: string, route: RouteData): Promise<void> {
    const device = this.connectedDevices.get(deviceId);
    if (!device || !device.port) {
      throw new Error('Device not connected');
    }

    try {
      const writer = device.port.writable?.getWriter();
      if (!writer) throw new Error('Cannot write to device');

      // Convert route to NMEA format
      const routeData = this.convertToNMEAFormat(route);
      const commandBytes = new TextEncoder().encode(routeData);
      
      await writer.write(commandBytes);
      writer.releaseLock();
    } catch (error) {
      console.error('Failed to export route:', error);
      throw error;
    }
  }

  /**
   * Start listening for data from device
   */
  private async startDataListener(device: GPSDevice): Promise<void> {
    if (!device.port || !device.port.readable) return;

    try {
      const reader = device.port.readable.getReader();
      
      while (device.connected && device.port.readable) {
        const { value, done } = await reader.read();
        if (done) break;
        
        if (value) {
          const data = new TextDecoder().decode(value);
          this.onDataReceived?.(device.id, data);
        }
      }
      
      reader.releaseLock();
    } catch (error) {
      console.error('Error reading from device:', error);
    }
  }

  /**
   * Convert route to NMEA 0183 format
   */
  private convertToNMEAFormat(route: RouteData): string {
    const waypoints = route.points.map(p => p.name).join(',');
    return `$GPRTE,1,1,c,0,${route.name},${waypoints}*00\r\n`;
  }
}