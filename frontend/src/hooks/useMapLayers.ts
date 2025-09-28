import { useState, useEffect, useRef } from 'react';
import { Map } from 'ol';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import XYZ from 'ol/source/XYZ';
import type { MapLayer } from '../components/MapLayerControl';

export interface LayerSource {
  id: string;
  source: any;
  layer: TileLayer<any>;
}

export const useMapLayers = (map: Map | null) => {
  const [mapLayers, setMapLayers] = useState<MapLayer[]>([
    // Base layers
    {
      id: 'osm',
      name: 'OpenStreetMap',
      description: 'Standard street map with roads and labels',
      visible: true,
      type: 'base',
      category: 'street'
    },
    {
      id: 'usgs-topo',
      name: 'USGS Topographic',
      description: 'USGS topographic maps with contour lines',
      visible: false,
      type: 'base',
      category: 'topographic'
    },
    {
      id: 'opentopomap',
      name: 'OpenTopoMap',
      description: 'Open source topographic map based on OSM',
      visible: false,
      type: 'base',
      category: 'topographic'
    },
    {
      id: 'esri-world-imagery',
      name: 'Satellite Imagery',
      description: 'High-resolution satellite and aerial imagery',
      visible: false,
      type: 'base',
      category: 'satellite'
    },
    {
      id: 'esri-world-terrain',
      name: 'World Terrain',
      description: 'Shaded relief terrain map',
      visible: false,
      type: 'base',
      category: 'terrain'
    },
    // Overlay layers
    {
      id: 'usgs-imagery-topo',
      name: 'USGS Imagery Topo',
      description: 'Topographic overlay on imagery',
      visible: false,
      type: 'overlay',
      category: 'topographic'
    }
  ]);

  const layerSourcesRef = useRef<{ [key: string]: LayerSource }>({});

  // Initialize layer sources
  useEffect(() => {
    if (!map) return;

    const sources: { [key: string]: LayerSource } = {};

    // OpenStreetMap
    const osmSource = new OSM();
    const osmLayer = new TileLayer({
      source: osmSource,
      visible: true,
      zIndex: 0
    });
    sources['osm'] = { id: 'osm', source: osmSource, layer: osmLayer };

    // USGS Topographic
    const usgsTopoSource = new XYZ({
      url: 'https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer/tile/{z}/{y}/{x}',
      attributions: 'USGS The National Map',
      maxZoom: 16
    });
    const usgsTopoLayer = new TileLayer({
      source: usgsTopoSource,
      visible: false,
      zIndex: 0
    });
    sources['usgs-topo'] = { id: 'usgs-topo', source: usgsTopoSource, layer: usgsTopoLayer };

    // OpenTopoMap
    const openTopoSource = new XYZ({
      url: 'https://{a-c}.tile.opentopomap.org/{z}/{x}/{y}.png',
      attributions: 'map data: © OpenStreetMap contributors, SRTM | map style: © OpenTopoMap (CC-BY-SA)',
      maxZoom: 17
    });
    const openTopoLayer = new TileLayer({
      source: openTopoSource,
      visible: false,
      zIndex: 0
    });
    sources['opentopomap'] = { id: 'opentopomap', source: openTopoSource, layer: openTopoLayer };

    // Esri World Imagery
    const esriImagerySource = new XYZ({
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attributions: 'Tiles © Esri — Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
      maxZoom: 19
    });
    const esriImageryLayer = new TileLayer({
      source: esriImagerySource,
      visible: false,
      zIndex: 0
    });
    sources['esri-world-imagery'] = { id: 'esri-world-imagery', source: esriImagerySource, layer: esriImageryLayer };

    // Esri World Terrain
    const esriTerrainSource = new XYZ({
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Terrain_Base/MapServer/tile/{z}/{y}/{x}',
      attributions: 'Tiles © Esri — Source: USGS, Esri, TANA, DeLorme, and NPS',
      maxZoom: 13
    });
    const esriTerrainLayer = new TileLayer({
      source: esriTerrainSource,
      visible: false,
      zIndex: 0
    });
    sources['esri-world-terrain'] = { id: 'esri-world-terrain', source: esriTerrainSource, layer: esriTerrainLayer };

    // USGS Imagery Topo (Overlay)
    const usgsImageryTopoSource = new XYZ({
      url: 'https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryTopo/MapServer/tile/{z}/{y}/{x}',
      attributions: 'USGS The National Map',
      maxZoom: 16
    });
    const usgsImageryTopoLayer = new TileLayer({
      source: usgsImageryTopoSource,
      visible: false,
      zIndex: 10,
      opacity: 0.7
    });
    sources['usgs-imagery-topo'] = { id: 'usgs-imagery-topo', source: usgsImageryTopoSource, layer: usgsImageryTopoLayer };

    // Add all layers to map
    Object.values(sources).forEach(layerSource => {
      map.addLayer(layerSource.layer);
    });

    layerSourcesRef.current = sources;

    // Cleanup function
    return () => {
      Object.values(sources).forEach(layerSource => {
        map.removeLayer(layerSource.layer);
      });
    };
  }, [map]);

  const toggleLayer = (layerId: string) => {
    setMapLayers(prev => prev.map(layer => {
      if (layer.id === layerId) {
        const newVisible = !layer.visible;
        
        // Update OpenLayers layer visibility
        const layerSource = layerSourcesRef.current[layerId];
        if (layerSource) {
          layerSource.layer.setVisible(newVisible);
        }

        return { ...layer, visible: newVisible };
      }
      return layer;
    }));
  };

  const changeBaseLayer = (layerId: string) => {
    setMapLayers(prev => prev.map(layer => {
      if (layer.type === 'base') {
        const newVisible = layer.id === layerId;
        
        // Update OpenLayers layer visibility
        const layerSource = layerSourcesRef.current[layer.id];
        if (layerSource) {
          layerSource.layer.setVisible(newVisible);
        }

        return { ...layer, visible: newVisible };
      }
      return layer;
    }));
  };

  return {
    mapLayers,
    toggleLayer,
    changeBaseLayer,
    layerSources: layerSourcesRef.current
  };
};