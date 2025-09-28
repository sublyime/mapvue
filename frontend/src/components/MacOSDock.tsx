import React from 'react';
import { 
  Navigation, 
  Layers, 
  FolderOpen, 
  MapPin, 
  Satellite, 
  PenTool, 
  FileText, 
  Settings, 
  Wrench 
} from 'lucide-react';
import { useWindowManager } from '../contexts/WindowManagerContext';

interface DockItem {
  id: string;
  title: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
}

const MacOSDock: React.FC = () => {
  const windowManager = useWindowManager();

  const dockItems: DockItem[] = [
    {
      id: 'route-manager',
      title: 'Route Manager',
      icon: <Navigation className="w-5 h-5 text-blue-600" />,
      isActive: windowManager.isWindowOpen('route-manager') && !windowManager.isWindowMinimized('route-manager'),
      onClick: () => windowManager.toggleWindow('route-manager')
    },
    {
      id: 'layer-panel',
      title: 'Layer Panel',
      icon: <Layers className="w-5 h-5 text-green-600" />,
      isActive: windowManager.isWindowOpen('layer-panel') && !windowManager.isWindowMinimized('layer-panel'),
      onClick: () => windowManager.toggleWindow('layer-panel')
    },
    {
      id: 'map-layers',
      title: 'Map Layers',
      icon: <FolderOpen className="w-5 h-5 text-orange-600" />,
      isActive: windowManager.isWindowOpen('map-layers') && !windowManager.isWindowMinimized('map-layers'),
      onClick: () => windowManager.toggleWindow('map-layers')
    },
    {
      id: 'location-tracker',
      title: 'Location Tracker',
      icon: <MapPin className="w-5 h-5 text-red-600" />,
      isActive: windowManager.isWindowOpen('location-tracker') && !windowManager.isWindowMinimized('location-tracker'),
      onClick: () => windowManager.toggleWindow('location-tracker')
    },
    {
      id: 'gps-integration',
      title: 'GPS Devices',
      icon: <Satellite className="w-5 h-5 text-purple-600" />,
      isActive: windowManager.isWindowOpen('gps-integration') && !windowManager.isWindowMinimized('gps-integration'),
      onClick: () => windowManager.toggleWindow('gps-integration')
    },
    {
      id: 'drawing-tools',
      title: 'Drawing Tools',
      icon: <PenTool className="w-5 h-5 text-pink-600" />,
      isActive: windowManager.isWindowOpen('drawing-tools') && !windowManager.isWindowMinimized('drawing-tools'),
      onClick: () => windowManager.toggleWindow('drawing-tools')
    },
    {
      id: 'file-operations',
      title: 'File Operations',
      icon: <FileText className="w-5 h-5 text-indigo-600" />,
      isActive: windowManager.isWindowOpen('file-operations') && !windowManager.isWindowMinimized('file-operations'),
      onClick: () => windowManager.toggleWindow('file-operations')
    },
    {
      id: 'settings',
      title: 'Settings',
      icon: <Settings className="w-5 h-5 text-gray-600" />,
      isActive: windowManager.isWindowOpen('settings') && !windowManager.isWindowMinimized('settings'),
      onClick: () => windowManager.toggleWindow('settings')
    },
    {
      id: 'tools',
      title: 'GIS Tools',
      icon: <Wrench className="w-5 h-5 text-yellow-600" />,
      isActive: windowManager.isWindowOpen('tools') && !windowManager.isWindowMinimized('tools'),
      onClick: () => windowManager.toggleWindow('tools')
    }
  ];

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
      <div 
        className="flex items-end justify-center px-4 py-3 space-x-3 
                   bg-white/85 backdrop-blur-2xl rounded-3xl shadow-2xl 
                   border border-white/30"
        style={{
          background: 'linear-gradient(to bottom, rgba(255,255,255,0.95), rgba(245,245,245,0.9))',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.6)'
        }}
      >
        {dockItems.map((item) => (
          <DockIcon 
            key={item.id}
            item={item}
          />
        ))}
      </div>
    </div>
  );
};

interface DockIconProps {
  item: DockItem;
}

const DockIcon: React.FC<DockIconProps> = ({ item }) => {
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <div className="relative">
      <button
        className={`
          flex items-center justify-center w-14 h-14 rounded-2xl
          transition-all duration-200 ease-out
          ${isHovered ? 'transform scale-125 -translate-y-3' : 'transform scale-100'}
          ${item.isActive ? 'bg-white/80 shadow-xl border border-gray-200/50' : 'hover:bg-white/40'}
          relative group backdrop-blur-sm
        `}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={item.onClick}
        title={item.title}
      >
        <div className="flex items-center justify-center">
          {item.icon}
        </div>
        
        {/* Active indicator dot */}
        {item.isActive && (
          <div 
            className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 
                       w-1.5 h-1.5 bg-gray-600 rounded-full"
          />
        )}
        
        {/* Tooltip */}
        <div 
          className={`
            absolute bottom-full mb-3 left-1/2 transform -translate-x-1/2
            px-3 py-1.5 bg-gray-900/90 backdrop-blur-sm text-white text-sm rounded-lg
            whitespace-nowrap pointer-events-none
            transition-all duration-200
            ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'}
          `}
        >
          {item.title}
          <div 
            className="absolute top-full left-1/2 transform -translate-x-1/2 
                       border-4 border-transparent border-t-gray-900/90"
          />
        </div>
      </button>
    </div>
  );
};

export default MacOSDock;