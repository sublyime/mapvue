# MapVue Draggable Window System - Integration Guide

## 🚀 **Draggable Window System Complete!**

Your MapVue GIS application now has a comprehensive draggable window system with sidebar docking capabilities, similar to professional desktop applications like ArcGIS, QGIS, or Visual Studio Code.

## ✅ **What's Been Implemented**

### Core Window System
- **DraggableWindow.tsx**: Full-featured window component with drag, resize, minimize, maximize, and dock
- **WindowManagerContext.tsx**: Centralized window state management with React Context
- **WindowRenderer.tsx**: Handles rendering all open windows
- **Taskbar.tsx**: Professional taskbar with window management controls

### Window Features
- ✅ **Drag & Drop**: Click and drag windows anywhere on screen
- ✅ **Resize**: 8-point resize handles (corners and edges)  
- ✅ **Sidebar Docking**: Drag to left/right edges to dock windows
- ✅ **Window Controls**: Minimize, maximize, restore, close buttons
- ✅ **Multi-Window Management**: Open multiple windows simultaneously
- ✅ **Z-Index Management**: Automatic window layering and focus
- ✅ **Snap Indicators**: Visual feedback when dragging near dock zones
- ✅ **Keyboard Shortcuts**: Window management via taskbar

### Available Windows
All major components converted to draggable windows:

1. **Route Manager** - Route planning and GPS integration tabs
2. **Layer Panel** - GIS layer management  
3. **Map Layer Control** - Topographic map layer switching
4. **Location Tracker** - Live GPS tracking and recording
5. **GPS Integration** - Hardware GPS device connectivity
6. **Settings** - Application configuration
7. **GIS Tools** - Drawing and measurement tools

## 🎮 **How to Use the Window System**

### Basic Operations
- **Open Window**: Click on taskbar icons
- **Drag Window**: Click and drag the header bar
- **Resize**: Drag any edge or corner
- **Dock**: Drag window to left or right screen edge
- **Minimize**: Click minimize button or taskbar icon
- **Close**: Click X button or right-click taskbar icon

### Taskbar Features
- **Window Icons**: Show all available windows
- **Status Indicators**: 
  - 🟢 Active window
  - 🔵 Open but inactive
  - 🟡 Minimized
- **Quick Controls**: Minimize all, restore all, open common windows

### Docking System
- **Left Sidebar**: Drag windows to left edge (200px zone)
- **Right Sidebar**: Drag windows to right edge (200px zone)
- **Visual Feedback**: Blue dashed border shows dock zones
- **Auto-sizing**: Docked windows resize to fit sidebar
- **Undock**: Use maximize/restore button or drag away

## 🔧 **Integration Options**

### Option 1: Replace Existing UI (Recommended)
Replace your current App.tsx imports:

```tsx
// In main.tsx or App.tsx
import WindowizedMapVue from './WindowizedMapVue';

// Use this instead of the original App
<WindowizedMapVue />
```

### Option 2: Gradual Integration
Keep existing layout and add window system:

```tsx
import WindowizedApp from './components/WindowizedApp';

const YourApp = () => (
  <WindowizedApp map={mapInstance}>
    {/* Your existing map and components */}
    <div id="map-container">...</div>
  </WindowizedApp>
);
```

### Option 3: Custom Integration
Manual integration for specific components:

```tsx
import { WindowManagerProvider } from './contexts/WindowManagerContext';
import WindowRenderer from './components/WindowRenderer';
import Taskbar from './components/Taskbar';

// Wrap your app
<WindowManagerProvider>
  <YourExistingApp />
  <WindowRenderer />
  <Taskbar />
</WindowManagerProvider>
```

## 🎨 **Customization**

### Window Styling
Modify `DraggableWindow.tsx` for custom themes:
- Header colors and gradients
- Border styles and shadows
- Button icons and hover states
- Dock zone visual effects

### Taskbar Position
Change taskbar location:
```tsx
<Taskbar position="top" />     // Top of screen
<Taskbar position="bottom" />  // Bottom of screen (default)
```

### Window Defaults
Configure initial window states in `WindowizedApp.tsx`:
```tsx
initialState: {
  width: 400,
  height: 300,
  x: 100,
  y: 100,
  isDocked: false,
  dockedSide: null
}
```

## 🚀 **Advanced Features**

### Persistent Windows
Windows marked as `persistent: true` auto-open on app load:
- Route Manager
- Layer Panel

### Window Constraints
- **Minimum Size**: 300x200px (configurable)
- **Screen Boundaries**: Windows stay within viewport
- **Overlap Prevention**: Auto-offset for new windows

### State Management
- Window positions and sizes persist during session
- Automatic cleanup of closed windows
- Z-index management for proper layering

## 🎯 **Professional Desktop Experience**

Your MapVue application now provides:
- **Multi-window workflow** like professional GIS software
- **Flexible layouts** with docking and floating windows
- **Productive workspace** with customizable arrangements
- **Intuitive controls** familiar to desktop users
- **Responsive design** that adapts to screen size

## 🛠️ **Next Steps**

1. **Choose Integration Method**: Pick Option 1, 2, or 3 above
2. **Test Window System**: Open/close/dock various windows
3. **Customize Appearance**: Modify colors, sizes, positions
4. **Add More Windows**: Create new windows for additional tools
5. **Save Layouts**: Implement persistent window arrangements

The draggable window system transforms your web-based GIS application into a desktop-class experience with professional workflow capabilities! 🎉