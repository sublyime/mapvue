import React, { useMemo } from 'react';
import DraggableWindow from './DraggableWindow';
import { useWindowManager } from '../contexts/WindowManagerContext';

const WindowRenderer: React.FC = () => {
  const windowManager = useWindowManager();
  const registeredWindows = windowManager.getRegisteredWindows();

  // Create stable callback references per window
  const windowCallbacks = useMemo(() => {
    const callbacks: Record<string, any> = {};
    
    Array.from(windowManager.state.openWindows).forEach(windowId => {
      callbacks[windowId] = {
        onStateChange: (newState: any) => windowManager.updateWindowState(windowId, newState),
        onClose: () => windowManager.closeWindow(windowId),
        onMinimize: () => windowManager.minimizeWindow(windowId),
        onRestore: () => windowManager.restoreWindow(windowId)
      };
    });
    
    return callbacks;
  }, [windowManager, Array.from(windowManager.state.openWindows).join(',')]);

  return (
    <>
      {Array.from(windowManager.state.openWindows).map(windowId => {
        const windowState = windowManager.state.windows[windowId];
        const windowConfig = registeredWindows.find(w => w.id === windowId);
        const callbacks = windowCallbacks[windowId];
        
        if (!windowState || !windowConfig || !callbacks) return null;

        return (
          <DraggableWindow
            key={windowId}
            id={windowId}
            title={windowState.title}
            initialState={windowState}
            onStateChange={callbacks.onStateChange}
            onClose={callbacks.onClose}
            onMinimize={callbacks.onMinimize}
            onRestore={callbacks.onRestore}
            minWidth={300}
            minHeight={200}
          >
            {windowConfig.component}
          </DraggableWindow>
        );
      })}
    </>
  );
};

export default WindowRenderer;