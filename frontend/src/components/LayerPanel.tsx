import React, { useState } from 'react';
import { 
  Layers, 
  Plus, 
  Eye, 
  EyeOff, 
  Edit2, 
  Trash2, 
  ChevronDown, 
  ChevronRight
} from 'lucide-react';
import type { GISLayer } from '../services/gisApi';

interface LayerPanelProps {
  layers: GISLayer[];
  activeLayerId: string | null;
  onLayerSelect: (layerId: string) => void;
  onLayerCreate: (layerData: Partial<GISLayer>) => void;
  onLayerUpdate: (layerId: string, layerData: Partial<GISLayer>) => void;
  onLayerDelete: (layerId: string) => void;
  onLayerVisibilityToggle: (layerId: string) => void;
}

interface NewLayerFormData {
  name: string;
  description: string;
  type: 'vector' | 'raster' | 'tile';
  styleConfig: {
    strokeColor: string;
    fillColor: string;
    strokeWidth: number;
    opacity: number;
  };
}

export const LayerPanel: React.FC<LayerPanelProps> = ({
  layers,
  activeLayerId,
  onLayerSelect,
  onLayerCreate,
  onLayerUpdate,
  onLayerDelete,
  onLayerVisibilityToggle
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingLayerId, setEditingLayerId] = useState<string | null>(null);
  const [formData, setFormData] = useState<NewLayerFormData>({
    name: '',
    description: '',
    type: 'vector',
    styleConfig: {
      strokeColor: '#3b82f6',
      fillColor: '#3b82f6',
      strokeWidth: 2,
      opacity: 0.7
    }
  });

  const handleCreateLayer = () => {
    if (formData.name.trim()) {
      onLayerCreate({
        ...formData,
        visible: true,
        opacity: formData.styleConfig.opacity
      });
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        type: 'vector',
        styleConfig: {
          strokeColor: '#3b82f6',
          fillColor: '#3b82f6',
          strokeWidth: 2,
          opacity: 0.7
        }
      });
      setShowCreateForm(false);
    }
  };

  const handleEditLayer = (layer: GISLayer) => {
    setEditingLayerId(layer.id);
    setFormData({
      name: layer.name,
      description: layer.description || '',
      type: layer.type as 'vector' | 'raster' | 'tile',
      styleConfig: layer.styleConfig || {
        strokeColor: '#3b82f6',
        fillColor: '#3b82f6',
        strokeWidth: 2,
        opacity: 0.7
      }
    });
    setShowCreateForm(true);
  };

  const handleUpdateLayer = () => {
    if (editingLayerId && formData.name.trim()) {
      onLayerUpdate(editingLayerId, {
        ...formData,
        opacity: formData.styleConfig.opacity
      });
      
      setEditingLayerId(null);
      setShowCreateForm(false);
      setFormData({
        name: '',
        description: '',
        type: 'vector',
        styleConfig: {
          strokeColor: '#3b82f6',
          fillColor: '#3b82f6',
          strokeWidth: 2,
          opacity: 0.7
        }
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingLayerId(null);
    setShowCreateForm(false);
    setFormData({
      name: '',
      description: '',
      type: 'vector',
      styleConfig: {
        strokeColor: '#3b82f6',
        fillColor: '#3b82f6',
        strokeWidth: 2,
        opacity: 0.7
      }
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 w-80 max-h-96 overflow-y-auto">
      {/* Panel Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-gray-100 rounded"
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
          <Layers className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-800">Layers</h3>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="p-1 hover:bg-gray-100 rounded text-blue-600"
          title="Add New Layer"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {isExpanded && (
        <>
          {/* Create/Edit Layer Form */}
          {showCreateForm && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg border">
              <h4 className="font-medium mb-3 text-gray-800">
                {editingLayerId ? 'Edit Layer' : 'Create New Layer'}
              </h4>
              
              {/* Layer Name */}
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter layer name"
                />
              </div>

              {/* Layer Description */}
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Optional description"
                  rows={2}
                />
              </div>

              {/* Layer Type */}
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as 'vector' | 'raster' | 'tile' })}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="vector">Vector Layer</option>
                  <option value="raster">Raster Layer</option>
                  <option value="tile">Tile Layer</option>
                </select>
              </div>

              {/* Style Configuration */}
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Style Settings
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Stroke Color</label>
                    <input
                      type="color"
                      value={formData.styleConfig.strokeColor}
                      onChange={(e) => setFormData({
                        ...formData,
                        styleConfig: { ...formData.styleConfig, strokeColor: e.target.value }
                      })}
                      className="w-full h-8 border border-gray-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Fill Color</label>
                    <input
                      type="color"
                      value={formData.styleConfig.fillColor}
                      onChange={(e) => setFormData({
                        ...formData,
                        styleConfig: { ...formData.styleConfig, fillColor: e.target.value }
                      })}
                      className="w-full h-8 border border-gray-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Stroke Width</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={formData.styleConfig.strokeWidth}
                      onChange={(e) => setFormData({
                        ...formData,
                        styleConfig: { ...formData.styleConfig, strokeWidth: parseInt(e.target.value) }
                      })}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Opacity</label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={formData.styleConfig.opacity}
                      onChange={(e) => setFormData({
                        ...formData,
                        styleConfig: { ...formData.styleConfig, opacity: parseFloat(e.target.value) }
                      })}
                      className="w-full"
                    />
                    <span className="text-xs text-gray-500">{formData.styleConfig.opacity}</span>
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex space-x-2">
                <button
                  onClick={editingLayerId ? handleUpdateLayer : handleCreateLayer}
                  className="flex-1 bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                >
                  {editingLayerId ? 'Update' : 'Create'}
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="flex-1 bg-gray-300 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Layers List */}
          <div className="space-y-2">
            {layers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Layers className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No layers yet</p>
                <p className="text-xs">Click + to create your first layer</p>
              </div>
            ) : (
              layers.map((layer) => (
                <div
                  key={layer.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-all ${
                    activeLayerId === layer.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                  onClick={() => onLayerSelect(layer.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 flex-1">
                      {/* Layer Color Indicator */}
                      <div
                        className="w-3 h-3 rounded border"
                        style={{
                          backgroundColor: layer.styleConfig?.fillColor || '#3b82f6'
                        }}
                      />
                      
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-gray-800 truncate">
                          {layer.name}
                        </div>
                        {layer.description && (
                          <div className="text-xs text-gray-500 truncate">
                            {layer.description}
                          </div>
                        )}
                        <div className="text-xs text-gray-400">
                          {layer.type} • {layer.visible ? 'Visible' : 'Hidden'}
                        </div>
                      </div>
                    </div>

                    {/* Layer Actions */}
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onLayerVisibilityToggle(layer.id);
                        }}
                        className="p-1 hover:bg-gray-200 rounded"
                        title={layer.visible ? 'Hide Layer' : 'Show Layer'}
                      >
                        {layer.visible ? (
                          <Eye className="w-3 h-3 text-gray-600" />
                        ) : (
                          <EyeOff className="w-3 h-3 text-gray-400" />
                        )}
                      </button>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditLayer(layer);
                        }}
                        className="p-1 hover:bg-gray-200 rounded"
                        title="Edit Layer"
                      >
                        <Edit2 className="w-3 h-3 text-gray-600" />
                      </button>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Delete layer "${layer.name}"?`)) {
                            onLayerDelete(layer.id);
                          }
                        }}
                        className="p-1 hover:bg-red-100 rounded"
                        title="Delete Layer"
                      >
                        <Trash2 className="w-3 h-3 text-red-600" />
                      </button>
                    </div>
                  </div>

                  {/* Layer Stats */}
                  {activeLayerId === layer.id && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <div className="text-xs text-gray-500 space-y-1">
                        <div>Opacity: {((layer.opacity || 1) * 100).toFixed(0)}%</div>
                        <div>Created: {new Date(layer.createdAt).toLocaleDateString()}</div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Quick Actions */}
          {layers.length > 0 && (
            <div className="mt-4 pt-3 border-t border-gray-200">
              <div className="text-xs text-gray-500 mb-2">Quick Actions</div>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    layers.forEach(layer => {
                      if (!layer.visible) onLayerVisibilityToggle(layer.id);
                    });
                  }}
                  className="flex-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                >
                  Show All
                </button>
                <button
                  onClick={() => {
                    layers.forEach(layer => {
                      if (layer.visible) onLayerVisibilityToggle(layer.id);
                    });
                  }}
                  className="flex-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                >
                  Hide All
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};