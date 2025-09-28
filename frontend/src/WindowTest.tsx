import React, { useState } from 'react';
import { WindowManagerProvider } from './contexts/WindowManagerContext';
import DraggableWindow from './components/DraggableWindow';
import { SettingsWindow, ToolsPanelWindow } from './components/WindowComponents';

// Simple test component to verify dragging works
const WindowTest: React.FC = () => {
  const [showTest, setShowTest] = useState(true);

  return (
    <WindowManagerProvider>
      <div className="w-full h-screen bg-gray-200 relative">
        <h1 className="absolute top-4 left-4 text-2xl font-bold">Window Drag Test</h1>
        
        {/* Test draggable windows */}
        {showTest && (
          <>
            <DraggableWindow
              id="test-1"
              title="Test Window 1"
              initialState={{ x: 100, y: 100, width: 300, height: 200 }}
              onClose={() => setShowTest(false)}
            >
              <div className="p-4">
                <h3 className="font-bold">Drag Test</h3>
                <p>Try dragging this window by its header!</p>
                <p>You should be able to:</p>
                <ul className="list-disc ml-4 mt-2">
                  <li>Drag the window around</li>
                  <li>Resize from corners/edges</li>
                  <li>Minimize/maximize</li>
                  <li>Dock to left/right edges</li>
                </ul>
              </div>
            </DraggableWindow>

            <DraggableWindow
              id="test-2"  
              title="Settings Test"
              initialState={{ x: 450, y: 150, width: 400, height: 300 }}
            >
              <SettingsWindow />
            </DraggableWindow>

            <DraggableWindow
              id="test-3"
              title="Tools Test"
              initialState={{ x: 200, y: 300, width: 350, height: 250 }}
            >
              <ToolsPanelWindow />
            </DraggableWindow>
          </>
        )}

        {/* Instructions */}
        <div className="absolute bottom-4 left-4 bg-white p-4 rounded shadow-lg">
          <h3 className="font-bold mb-2">Instructions:</h3>
          <ol className="list-decimal ml-4 text-sm space-y-1">
            <li>Click and drag window headers to move</li>
            <li>Drag corners/edges to resize</li>
            <li>Drag to screen edges to dock</li>
            <li>Use window control buttons</li>
          </ol>
        </div>
      </div>
    </WindowManagerProvider>
  );
};

export default WindowTest;