import React, { useState } from 'react';
import { Layers, ChevronDown, ChevronUp } from 'lucide-react';

export interface MapLayer {
  id: string;
  name: string;
  description: string;
  visible: boolean;
  type: 'base' | 'overlay';
  category: 'satellite' | 'topographic' | 'street' | 'terrain';
}

interface MapLayerControlProps {
  layers: MapLayer[];
  onLayerToggle: (layerId: string) => void;
  onBaseLayerChange: (layerId: string) => void;
}

const MapLayerControl: React.FC<MapLayerControlProps> = ({
  layers,
  onLayerToggle,
  onBaseLayerChange
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const baseLayers = layers.filter(layer => layer.type === 'base');
  const overlayLayers = layers.filter(layer => layer.type === 'overlay');
  const activeBaseLayer = baseLayers.find(layer => layer.visible);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'satellite': return '🛰️';
      case 'topographic': return '🗺️';
      case 'street': return '🏙️';
      case 'terrain': return '⛰️';
      default: return '📍';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 min-w-64">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-t-lg"
      >
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-gray-700" />
          <span className="text-sm font-medium text-gray-800">Map Layers</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-gray-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-500" />
        )}
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="border-t border-gray-200 p-3 space-y-4">
          {/* Base Layers */}
          <div>
            <h4 className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
              Base Maps
            </h4>
            <div className="space-y-2">
              {baseLayers.map((layer) => (
                <label
                  key={layer.id}
                  className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="baseLayer"
                    checked={layer.visible}
                    onChange={() => onBaseLayerChange(layer.id)}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-lg">
                    {getCategoryIcon(layer.category)}
                  </span>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-800">
                      {layer.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {layer.description}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Overlay Layers */}
          {overlayLayers.length > 0 && (
            <div className="border-t border-gray-200 pt-4">
              <h4 className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
                Overlay Layers
              </h4>
              <div className="space-y-2">
                {overlayLayers.map((layer) => (
                  <label
                    key={layer.id}
                    className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={layer.visible}
                      onChange={() => onLayerToggle(layer.id)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-lg">
                      {getCategoryIcon(layer.category)}
                    </span>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-800">
                        {layer.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {layer.description}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Current Selection Info */}
          {activeBaseLayer && (
            <div className="border-t border-gray-200 pt-3">
              <div className="text-xs text-gray-500">
                Active: <span className="font-medium text-gray-700">
                  {activeBaseLayer.name}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MapLayerControl;