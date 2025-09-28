import React from 'react';
import DraggableWindow from './DraggableWindow';
import { useWindowManager } from '../contexts/WindowManagerContext';

const WindowRenderer: React.FC = () => {
  const windowManager = useWindowManager();
  const registeredWindows = windowManager.getRegisteredWindows();

  return (
    <>
      {Array.from(windowManager.state.openWindows).map(windowId => {
        const windowState = windowManager.state.windows[windowId];
        const windowConfig = registeredWindows.find(w => w.id === windowId);
        
        if (!windowState || !windowConfig) return null;

        return (
          <DraggableWindow
            key={windowId}
            id={windowId}
            title={windowState.title}
            initialState={windowState}
            onStateChange={(newState) => windowManager.updateWindowState(windowId, newState)}
            onClose={() => windowManager.closeWindow(windowId)}
            onMinimize={() => windowManager.minimizeWindow(windowId)}
            onRestore={() => windowManager.restoreWindow(windowId)}
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