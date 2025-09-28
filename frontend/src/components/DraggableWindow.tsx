import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Maximize2, Minimize2, Move, GripVertical } from 'lucide-react';

export interface WindowState {
  id: string;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isMinimized: boolean;
  isMaximized: boolean;
  isDocked: boolean;
  dockedSide: 'left' | 'right' | null;
  zIndex: number;
  isResizable: boolean;
  isMovable: boolean;
}

interface DraggableWindowProps {
  id: string;
  title: string;
  children: React.ReactNode;
  initialState?: Partial<WindowState>;
  onStateChange?: (state: WindowState) => void;
  onClose?: () => void;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
}

interface DragState {
  isDragging: boolean;
  dragStartX: number;
  dragStartY: number;
  windowStartX: number;
  windowStartY: number;
}

interface ResizeState {
  isResizing: boolean;
  resizeHandle: string;
  startX: number;
  startY: number;
  startWidth: number;
  startHeight: number;
  startWindowX: number;
  startWindowY: number;
}

const DraggableWindow: React.FC<DraggableWindowProps> = ({
  id,
  title,
  children,
  initialState = {},
  onStateChange,
  onClose,
  className = '',
  headerClassName = '',
  contentClassName = '',
  minWidth = 300,
  minHeight = 200,
  maxWidth = window.innerWidth,
  maxHeight = window.innerHeight
}) => {
  const [windowState, setWindowState] = useState<WindowState>({
    id,
    title,
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
    isMovable: true,
    ...initialState
  });

  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    dragStartX: 0,
    dragStartY: 0,
    windowStartX: 0,
    windowStartY: 0
  });

  const [resizeState, setResizeState] = useState<ResizeState>({
    isResizing: false,
    resizeHandle: '',
    startX: 0,
    startY: 0,
    startWidth: 0,
    startHeight: 0,
    startWindowX: 0,
    startWindowY: 0
  });

  const [showDockZones, setShowDockZones] = useState(false);
  const [hoverDockZone, setHoverDockZone] = useState<'left' | 'right' | null>(null);

  const windowRef = useRef<HTMLDivElement>(null);

  // Update parent when state changes
  useEffect(() => {
    onStateChange?.(windowState);
  }, [windowState, onStateChange]);

  // Handle window dragging
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!windowState.isMovable || windowState.isDocked) return;
    
    e.preventDefault();
    setDragState({
      isDragging: true,
      dragStartX: e.clientX,
      dragStartY: e.clientY,
      windowStartX: windowState.x,
      windowStartY: windowState.y
    });
    setShowDockZones(true);

    // Bring window to front
    setWindowState(prev => ({ ...prev, zIndex: prev.zIndex + 1 }));
  }, [windowState.isMovable, windowState.isDocked, windowState.x, windowState.y]);

  // Handle resize start
  const handleResizeStart = useCallback((e: React.MouseEvent, handle: string) => {
    if (!windowState.isResizable || windowState.isDocked || windowState.isMaximized) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    setResizeState({
      isResizing: true,
      resizeHandle: handle,
      startX: e.clientX,
      startY: e.clientY,
      startWidth: windowState.width,
      startHeight: windowState.height,
      startWindowX: windowState.x,
      startWindowY: windowState.y
    });
  }, [windowState.isResizable, windowState.isDocked, windowState.isMaximized, windowState.width, windowState.height, windowState.x, windowState.y]);

  // Handle mouse move for dragging and resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (dragState.isDragging) {
        const deltaX = e.clientX - dragState.dragStartX;
        const deltaY = e.clientY - dragState.dragStartY;
        
        const newX = Math.max(0, Math.min(window.innerWidth - windowState.width, dragState.windowStartX + deltaX));
        const newY = Math.max(0, Math.min(window.innerHeight - windowState.height, dragState.windowStartY + deltaY));
        
        setWindowState(prev => ({ ...prev, x: newX, y: newY }));

        // Check dock zones
        const dockZoneWidth = 200;
        if (e.clientX < dockZoneWidth) {
          setHoverDockZone('left');
        } else if (e.clientX > window.innerWidth - dockZoneWidth) {
          setHoverDockZone('right');
        } else {
          setHoverDockZone(null);
        }
      }

      if (resizeState.isResizing) {
        const deltaX = e.clientX - resizeState.startX;
        const deltaY = e.clientY - resizeState.startY;
        
        let newWidth = resizeState.startWidth;
        let newHeight = resizeState.startHeight;
        let newX = resizeState.startWindowX;
        let newY = resizeState.startWindowY;

        // Handle different resize handles
        if (resizeState.resizeHandle.includes('right')) {
          newWidth = Math.max(minWidth, Math.min(maxWidth, resizeState.startWidth + deltaX));
        }
        if (resizeState.resizeHandle.includes('left')) {
          newWidth = Math.max(minWidth, Math.min(maxWidth, resizeState.startWidth - deltaX));
          newX = resizeState.startWindowX + (resizeState.startWidth - newWidth);
        }
        if (resizeState.resizeHandle.includes('bottom')) {
          newHeight = Math.max(minHeight, Math.min(maxHeight, resizeState.startHeight + deltaY));
        }
        if (resizeState.resizeHandle.includes('top')) {
          newHeight = Math.max(minHeight, Math.min(maxHeight, resizeState.startHeight - deltaY));
          newY = resizeState.startWindowY + (resizeState.startHeight - newHeight);
        }

        setWindowState(prev => ({ 
          ...prev, 
          width: newWidth, 
          height: newHeight, 
          x: newX, 
          y: newY 
        }));
      }
    };

    const handleMouseUp = () => {
      if (dragState.isDragging && hoverDockZone) {
        // Dock the window
        const dockWidth = 350;
        setWindowState(prev => ({
          ...prev,
          isDocked: true,
          dockedSide: hoverDockZone,
          x: hoverDockZone === 'left' ? 0 : window.innerWidth - dockWidth,
          y: 0,
          width: dockWidth,
          height: window.innerHeight,
          isMaximized: false
        }));
      }

      setDragState(prev => ({ ...prev, isDragging: false }));
      setResizeState(prev => ({ ...prev, isResizing: false }));
      setShowDockZones(false);
      setHoverDockZone(null);
    };

    if (dragState.isDragging || resizeState.isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = dragState.isDragging ? 'move' : 
                                  resizeState.resizeHandle.includes('right') || resizeState.resizeHandle.includes('left') ? 'ew-resize' :
                                  resizeState.resizeHandle.includes('top') || resizeState.resizeHandle.includes('bottom') ? 'ns-resize' :
                                  'nw-resize';
      document.body.style.userSelect = 'none';

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [dragState, resizeState, hoverDockZone, windowState.width, windowState.height, minWidth, minHeight, maxWidth, maxHeight]);

  // Handle window controls
  const handleMinimize = () => {
    setWindowState(prev => ({ ...prev, isMinimized: !prev.isMinimized }));
  };

  const handleMaximize = () => {
    if (windowState.isMaximized) {
      // Restore
      setWindowState(prev => ({ 
        ...prev, 
        isMaximized: false,
        isDocked: false,
        dockedSide: null
      }));
    } else {
      // Maximize
      setWindowState(prev => ({ 
        ...prev, 
        isMaximized: true,
        isDocked: false,
        dockedSide: null,
        x: 0,
        y: 0,
        width: window.innerWidth,
        height: window.innerHeight
      }));
    }
  };

  const handleUndock = () => {
    setWindowState(prev => ({
      ...prev,
      isDocked: false,
      dockedSide: null,
      width: Math.min(400, window.innerWidth - 100),
      height: Math.min(300, window.innerHeight - 100),
      x: 100,
      y: 100
    }));
  };

  // Get resize handles
  const resizeHandles = [
    'top', 'top-right', 'right', 'bottom-right',
    'bottom', 'bottom-left', 'left', 'top-left'
  ];

  const getResizeHandleClass = (handle: string) => {
    const baseClass = 'absolute bg-transparent hover:bg-blue-500 hover:opacity-50 transition-all';
    
    switch (handle) {
      case 'top':
        return `${baseClass} top-0 left-2 right-2 h-1 cursor-ns-resize`;
      case 'top-right':
        return `${baseClass} top-0 right-0 w-3 h-3 cursor-ne-resize`;
      case 'right':
        return `${baseClass} top-2 bottom-2 right-0 w-1 cursor-ew-resize`;
      case 'bottom-right':
        return `${baseClass} bottom-0 right-0 w-3 h-3 cursor-se-resize`;
      case 'bottom':
        return `${baseClass} bottom-0 left-2 right-2 h-1 cursor-ns-resize`;
      case 'bottom-left':
        return `${baseClass} bottom-0 left-0 w-3 h-3 cursor-sw-resize`;
      case 'left':
        return `${baseClass} top-2 bottom-2 left-0 w-1 cursor-ew-resize`;
      case 'top-left':
        return `${baseClass} top-0 left-0 w-3 h-3 cursor-nw-resize`;
      default:
        return baseClass;
    }
  };

  const windowStyle: React.CSSProperties = {
    left: windowState.x,
    top: windowState.y,
    width: windowState.width,
    height: windowState.height,
    zIndex: windowState.zIndex,
    transform: windowState.isMinimized ? 'scale(0.1)' : 'scale(1)',
    transformOrigin: 'top left',
    opacity: windowState.isMinimized ? 0.8 : 1
  };

  return (
    <>
      {/* Dock Zones */}
      {showDockZones && (
        <>
          <div 
            className={`fixed top-0 left-0 w-48 h-full bg-blue-500 bg-opacity-20 border-2 border-dashed border-blue-500 z-50 transition-all ${
              hoverDockZone === 'left' ? 'bg-opacity-40' : ''
            }`}
          />
          <div 
            className={`fixed top-0 right-0 w-48 h-full bg-blue-500 bg-opacity-20 border-2 border-dashed border-blue-500 z-50 transition-all ${
              hoverDockZone === 'right' ? 'bg-opacity-40' : ''
            }`}
          />
        </>
      )}

      {/* Window */}
      <div
        ref={windowRef}
        className={`fixed bg-white rounded-lg shadow-2xl border border-gray-300 overflow-hidden transition-all duration-200 ${className}`}
        style={windowStyle}
      >
        {/* Window Header */}
        <div 
          className={`flex items-center justify-between px-3 py-2 bg-gray-100 border-b border-gray-200 cursor-move select-none ${headerClassName}`}
          onMouseDown={handleMouseDown}
        >
          <div className="flex items-center gap-2">
            <GripVertical className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-700 truncate">
              {title}
            </span>
            {windowState.isDocked && (
              <span className="text-xs text-blue-600 bg-blue-100 px-1 rounded">
                Docked {windowState.dockedSide}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            <button
              onClick={handleMinimize}
              className="p-1 hover:bg-gray-200 rounded text-gray-600 hover:text-gray-800"
              title={windowState.isMinimized ? "Restore" : "Minimize"}
            >
              <Minimize2 className="w-3 h-3" />
            </button>
            
            <button
              onClick={windowState.isDocked ? handleUndock : handleMaximize}
              className="p-1 hover:bg-gray-200 rounded text-gray-600 hover:text-gray-800"
              title={windowState.isDocked ? "Undock" : windowState.isMaximized ? "Restore" : "Maximize"}
            >
              {windowState.isDocked ? <Move className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
            </button>
            
            {onClose && (
              <button
                onClick={onClose}
                className="p-1 hover:bg-red-100 rounded text-gray-600 hover:text-red-600"
                title="Close"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Window Content */}
        <div className={`overflow-auto ${contentClassName}`} 
             style={{ height: `calc(100% - 40px)` }}>
          {children}
        </div>

        {/* Resize Handles */}
        {windowState.isResizable && !windowState.isDocked && !windowState.isMaximized && (
          <>
            {resizeHandles.map(handle => (
              <div
                key={handle}
                className={getResizeHandleClass(handle)}
                onMouseDown={(e) => handleResizeStart(e, handle)}
              />
            ))}
          </>
        )}
      </div>
    </>
  );
};

export default DraggableWindow;