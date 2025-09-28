import React, { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { WindowState } from '../components/DraggableWindow';

export interface WindowConfig {
  id: string;
  title: string;
  component: ReactNode;
  initialState?: Partial<WindowState>;
  persistent?: boolean; // Window persists across app sessions
  allowMultiple?: boolean; // Allow multiple instances
}

interface WindowManagerState {
  windows: { [id: string]: WindowState };
  openWindows: Set<string>;
  activeWindow: string | null;
  maxZIndex: number;
}

interface WindowManagerContextType {
  state: WindowManagerState;
  openWindow: (config: WindowConfig) => void;
  closeWindow: (id: string) => void;
  updateWindowState: (id: string, newState: Partial<WindowState>) => void;
  bringToFront: (id: string) => void;
  minimizeAll: () => void;
  isWindowOpen: (id: string) => boolean;
  getWindowState: (id: string) => WindowState | null;
  registerWindow: (config: WindowConfig) => void;
  getRegisteredWindows: () => WindowConfig[];
}

const WindowManagerContext = createContext<WindowManagerContextType | null>(null);

interface WindowManagerProviderProps {
  children: ReactNode;
  initialState?: Partial<WindowManagerState>;
}

const defaultWindowState: WindowState = {
  id: '',
  title: '',
  x: 100,
  y: 100,
  width: 400,
  height: 300,
  isMinimized: false,
  isMaximized: false,
  isDocked: false,
  dockedSide: null,
  zIndex: 1000,
  isResizable: true,
  isMovable: true
};

export const WindowManagerProvider: React.FC<WindowManagerProviderProps> = ({ 
  children, 
  initialState = {} 
}) => {
  const [state, setState] = useState<WindowManagerState>({
    windows: {},
    openWindows: new Set(),
    activeWindow: null,
    maxZIndex: 1000,
    ...initialState
  });

  const [registeredWindows, setRegisteredWindows] = useState<{ [id: string]: WindowConfig }>({});

  // Register a window configuration
  const registerWindow = useCallback((config: WindowConfig) => {
    setRegisteredWindows(prev => ({ ...prev, [config.id]: config }));
  }, []);

  // Get all registered window configurations
  const getRegisteredWindows = useCallback(() => {
    return Object.values(registeredWindows);
  }, [registeredWindows]);

  // Open a window
  const openWindow = useCallback((config: WindowConfig) => {
    setState(prev => {
      // If window doesn't allow multiple instances and is already open, just bring to front
      if (!config.allowMultiple && prev.openWindows.has(config.id)) {
        const existingWindow = prev.windows[config.id];
        if (existingWindow) {
          return {
            ...prev,
            windows: {
              ...prev.windows,
              [config.id]: { ...existingWindow, zIndex: prev.maxZIndex + 1, isMinimized: false }
            },
            activeWindow: config.id,
            maxZIndex: prev.maxZIndex + 1
          };
        }
      }

      // Calculate initial position to avoid overlap
      let initialX = config.initialState?.x ?? 100;
      let initialY = config.initialState?.y ?? 100;

      // Offset new windows to avoid exact overlap
      const offset = prev.openWindows.size * 30;
      initialX += offset;
      initialY += offset;

      // Keep window within screen bounds
      initialX = Math.max(0, Math.min(window.innerWidth - 400, initialX));
      initialY = Math.max(0, Math.min(window.innerHeight - 300, initialY));

      const windowState: WindowState = {
        ...defaultWindowState,
        ...config.initialState,
        id: config.id,
        title: config.title,
        x: initialX,
        y: initialY,
        zIndex: prev.maxZIndex + 1
      };

      return {
        ...prev,
        windows: { ...prev.windows, [config.id]: windowState },
        openWindows: new Set([...prev.openWindows, config.id]),
        activeWindow: config.id,
        maxZIndex: prev.maxZIndex + 1
      };
    });
  }, []);

  // Close a window
  const closeWindow = useCallback((id: string) => {
    setState(prev => {
      const newOpenWindows = new Set(prev.openWindows);
      newOpenWindows.delete(id);
      
      const newWindows = { ...prev.windows };
      delete newWindows[id];

      // Set new active window
      const remainingWindows = Array.from(newOpenWindows);
      const newActiveWindow = remainingWindows.length > 0 ? 
        remainingWindows[remainingWindows.length - 1] : null;

      return {
        ...prev,
        windows: newWindows,
        openWindows: newOpenWindows,
        activeWindow: newActiveWindow
      };
    });
  }, []);

  // Update window state
  const updateWindowState = useCallback((id: string, newState: Partial<WindowState>) => {
    setState(prev => {
      const currentWindow = prev.windows[id];
      if (!currentWindow) return prev;

      return {
        ...prev,
        windows: {
          ...prev.windows,
          [id]: { ...currentWindow, ...newState }
        }
      };
    });
  }, []);

  // Bring window to front
  const bringToFront = useCallback((id: string) => {
    setState(prev => {
      const window = prev.windows[id];
      if (!window) return prev;

      return {
        ...prev,
        windows: {
          ...prev.windows,
          [id]: { ...window, zIndex: prev.maxZIndex + 1, isMinimized: false }
        },
        activeWindow: id,
        maxZIndex: prev.maxZIndex + 1
      };
    });
  }, []);

  // Minimize all windows
  const minimizeAll = useCallback(() => {
    setState(prev => {
      const newWindows = { ...prev.windows };
      Object.keys(newWindows).forEach(id => {
        newWindows[id] = { ...newWindows[id], isMinimized: true };
      });

      return {
        ...prev,
        windows: newWindows,
        activeWindow: null
      };
    });
  }, []);

  // Check if window is open
  const isWindowOpen = useCallback((id: string) => {
    return state.openWindows.has(id);
  }, [state.openWindows]);

  // Get window state
  const getWindowState = useCallback((id: string) => {
    return state.windows[id] || null;
  }, [state.windows]);

  const contextValue: WindowManagerContextType = {
    state,
    openWindow,
    closeWindow,
    updateWindowState,
    bringToFront,
    minimizeAll,
    isWindowOpen,
    getWindowState,
    registerWindow,
    getRegisteredWindows
  };

  return (
    <WindowManagerContext.Provider value={contextValue}>
      {children}
    </WindowManagerContext.Provider>
  );
};

// Hook to use window manager
export const useWindowManager = (): WindowManagerContextType => {
  const context = useContext(WindowManagerContext);
  if (!context) {
    throw new Error('useWindowManager must be used within a WindowManagerProvider');
  }
  return context;
};

// Hook for individual window management
export const useWindow = (id: string) => {
  const windowManager = useWindowManager();
  
  const windowState = windowManager.getWindowState(id);
  const isOpen = windowManager.isWindowOpen(id);
  
  const open = useCallback((config?: Partial<WindowConfig>) => {
    const registeredWindows = windowManager.getRegisteredWindows();
    const registeredWindow = registeredWindows.find(w => w.id === id);
    
    if (registeredWindow) {
      windowManager.openWindow({ ...registeredWindow, ...config });
    }
  }, [windowManager, id]);

  const close = useCallback(() => {
    windowManager.closeWindow(id);
  }, [windowManager, id]);

  const updateState = useCallback((newState: Partial<WindowState>) => {
    windowManager.updateWindowState(id, newState);
  }, [windowManager, id]);

  const bringToFront = useCallback(() => {
    windowManager.bringToFront(id);
  }, [windowManager, id]);

  return {
    windowState,
    isOpen,
    open,
    close,
    updateState,
    bringToFront
  };
};