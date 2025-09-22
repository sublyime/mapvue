import React, { useEffect, useRef } from 'react';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';

const SimpleMap: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<Map | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    console.log('🗺️ Creating simple map...');
    console.log('Container:', mapRef.current);
    console.log('Container size:', mapRef.current.offsetWidth, 'x', mapRef.current.offsetHeight);

    // Create map with minimal configuration
    const map = new Map({
      target: mapRef.current,
      layers: [
        new TileLayer({
          source: new OSM()
        })
      ],
      view: new View({
        center: [0, 0],
        zoom: 2
      })
    });

    mapInstance.current = map;

    console.log('✅ Map created successfully');

    // Force size update after a short delay
    setTimeout(() => {
      map.updateSize();
      console.log('📏 Map size updated');
    }, 100);

    return () => {
      map.setTarget(undefined);
    };
  }, []);

  return (
    <div style={{ width: '100%', height: '400px', border: '3px solid blue' }}>
      <div
        ref={mapRef}
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: '#f0f0f0'
        }}
      />
    </div>
  );
};

export default SimpleMap;