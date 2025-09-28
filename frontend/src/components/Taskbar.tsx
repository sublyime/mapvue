import React from 'react';
import { 
  Layers, 
  Route, 
  Navigation, 
  Smartphone, 
  Settings, 
  Minimize2, 
  RotateCw,
  Plus,
  X
} from 'lucide-react';
import { useWindowManager } from '../contexts/WindowManagerContext';

interface TaskbarProps {
  position?: 'top' | 'bottom';
  className?: string;
}

const Taskbar: React.FC<TaskbarProps> = ({ 
  position = 'bottom',
  className = ''
}) => {
  const windowManager = useWindowManager();
  const registeredWindows = windowManager.getRegisteredWindows();

  const getWindowIcon = (windowId: string) => {
    switch (windowId) {
      case 'layer-panel':
        return <Layers className="w-4 h-4" />;
      case 'route-manager':
        return <Route className="w-4 h-4" />;
      case 'location-tracker':
        return <Navigation className="w-4 h-4" />;
      case 'gps-integration':
        return <Smartphone className="w-4 h-4" />;
      case 'settings':
        return <Settings className="w-4 h-4" />;
      default:
        return <div className="w-4 h-4 bg-gray-400 rounded" />;
    }
  };

  const positionClasses = position === 'top' 
    ? 'top-0 rounded-b-lg' 
    : 'bottom-0 rounded-t-lg';

  return (
    <div className={`fixed left-1/2 transform -translate-x-1/2 ${positionClasses} bg-gray-900 bg-opacity-95 backdrop-blur-md border border-gray-700 shadow-2xl z-50 ${className}`}>
      <div className="flex items-center gap-1 px-3 py-2">
        {/* Window Management Controls */}
        <div className="flex items-center gap-1 border-r border-gray-700 pr-3 mr-3">
          <button
            onClick={() => windowManager.minimizeAll()}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors"
            title="Minimize All Windows"
          >
            <Minimize2 className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => {
              // Restore all minimized windows
              Object.keys(windowManager.state.windows).forEach(id => {
                const window = windowManager.state.windows[id];
                if (window.isMinimized) {
                  windowManager.updateWindowState(id, { isMinimized: false });
                }
              });
            }}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors"
            title="Restore All Windows"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>

        {/* Available Windows */}
        <div className="flex items-center gap-1">
          {registeredWindows.map(windowConfig => {
            const isOpen = windowManager.isWindowOpen(windowConfig.id);
            const windowState = windowManager.getWindowState(windowConfig.id);
            const isMinimized = windowState?.isMinimized;
            const isActive = windowManager.state.activeWindow === windowConfig.id;

            return (
              <div key={windowConfig.id} className="relative">
                <button
                  onClick={() => {
                    if (isOpen && !isMinimized) {
                      if (isActive) {
                        // If active, minimize it
                        windowManager.updateWindowState(windowConfig.id, { isMinimized: true });
                      } else {
                        // If open but not active, bring to front
                        windowManager.bringToFront(windowConfig.id);
                      }
                    } else if (isOpen && isMinimized) {
                      // If minimized, restore it
                      windowManager.updateWindowState(windowConfig.id, { isMinimized: false });
                      windowManager.bringToFront(windowConfig.id);
                    } else {
                      // If not open, open it
                      windowManager.openWindow(windowConfig);
                    }
                  }}
                  className={`relative p-2 rounded transition-all ${
                    isOpen
                      ? isActive && !isMinimized
                        ? 'bg-blue-600 text-white shadow-lg'
                        : isMinimized
                        ? 'bg-gray-700 text-gray-300'
                        : 'bg-gray-800 text-gray-200 hover:bg-gray-700'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}
                  title={windowConfig.title}
                >
                  {getWindowIcon(windowConfig.id)}
                  
                  {/* Window state indicators */}
                  {isOpen && (
                    <div className="absolute -top-1 -right-1">
                      {isMinimized ? (
                        <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                      ) : isActive ? (
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                      ) : (
                        <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      )}
                    </div>
                  )}
                </button>

                {/* Close button for open windows */}
                {isOpen && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      windowManager.closeWindow(windowConfig.id);
                    }}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Close Window"
                  >
                    <X className="w-2 h-2" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-1 border-l border-gray-700 pl-3 ml-3">
          <button
            onClick={() => {
              // Quick open most common windows
              const commonWindows = ['route-manager', 'layer-panel'];
              commonWindows.forEach(id => {
                const config = registeredWindows.find(w => w.id === id);
                if (config && !windowManager.isWindowOpen(id)) {
                  windowManager.openWindow(config);
                }
              });
            }}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors"
            title="Open Common Windows"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Window Count Indicator */}
        {windowManager.state.openWindows.size > 0 && (
          <div className="flex items-center gap-2 border-l border-gray-700 pl-3 ml-3">
            <span className="text-xs text-gray-400">
              {windowManager.state.openWindows.size} window{windowManager.state.openWindows.size !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Taskbar;