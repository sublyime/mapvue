import { useState, useCallback } from 'react';

export interface GeolocationCoords {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  altitudeAccuracy?: number;
  heading?: number;
  speed?: number;
}

export interface GeolocationError {
  code: number;
  message: string;
}

export interface UseGeolocationReturn {
  position: GeolocationCoords | null;
  error: GeolocationError | null;
  isLoading: boolean;
  getCurrentPosition: () => void;
  clearPosition: () => void;
  isSupported: boolean;
}

const DEFAULT_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 60000, // Cache position for 1 minute
};

export const useGeolocation = (options: PositionOptions = DEFAULT_OPTIONS): UseGeolocationReturn => {
  const [position, setPosition] = useState<GeolocationCoords | null>(null);
  const [error, setError] = useState<GeolocationError | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isSupported = 'geolocation' in navigator;

  const getCurrentPosition = useCallback(() => {
    if (!isSupported) {
      setError({
        code: 0,
        message: 'Geolocation is not supported by this browser.',
      });
      return;
    }

    setIsLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords: GeolocationCoords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude || undefined,
          altitudeAccuracy: position.coords.altitudeAccuracy || undefined,
          heading: position.coords.heading || undefined,
          speed: position.coords.speed || undefined,
        };
        
        setPosition(coords);
        setIsLoading(false);
      },
      (error) => {
        let errorMessage: string;
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied by user.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
          default:
            errorMessage = 'An unknown error occurred while retrieving location.';
            break;
        }

        setError({
          code: error.code,
          message: errorMessage,
        });
        setIsLoading(false);
      },
      options
    );
  }, [isSupported, options]);

  const clearPosition = useCallback(() => {
    setPosition(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    position,
    error,
    isLoading,
    getCurrentPosition,
    clearPosition,
    isSupported,
  };
};

export default useGeolocation;