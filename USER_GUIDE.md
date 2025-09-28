# MapVue User Guide

Welcome to MapVue, a professional GIS web application featuring a beautiful macOS-style interface! This comprehensive guide will help you navigate and utilize all the powerful features available in MapVue.

## 🎯 Quick Start

1. **Open MapVue**: Navigate to `http://localhost:5173` in your web browser
2. **Explore the Dock**: You'll see a beautiful dock at the bottom with 9 application icons
3. **Click Any Icon**: Each icon opens a different GIS tool in its own window
4. **Drag Windows**: Click and drag the title bar to move windows around
5. **Resize Windows**: Drag the corners or edges to resize windows
6. **Minimize**: Click the red button (×) to minimize windows back to the dock

## 🖥️ macOS-Style Interface

### The Dock System
The dock at the bottom of your screen contains 9 professional GIS applications:

| Icon | Application | Purpose |
|------|-------------|---------|
| 🧭 Navigation | **Route Manager** | Plan routes, add waypoints, calculate distances |
| 📋 Layers | **Layer Panel** | Control layer visibility, opacity, and styling |
| 📁 FolderOpen | **Map Layers** | Manage base maps and overlay layers |
| 📍 MapPin | **Location Tracker** | Real-time GPS tracking and positioning |
| 🛰️ Satellite | **GPS Integration** | Connect to GPS devices for data exchange |
| ✏️ PenTool | **Drawing Tools** | Create points, lines, polygons, and edit features |
| 📄 FileText | **File Operations** | Import/export GeoJSON, KML, GPX files |
| ⚙️ Settings | **Settings Panel** | Configure application preferences |
| 🔧 Wrench | **GIS Tools** | Advanced GIS analysis and utilities |

### Window Controls
Each window has macOS-style traffic light buttons in the top-left corner:
- **🔴 Red (×)**: Minimize window back to dock
- **🟡 Yellow (−)**: Hide window (currently minimizes)
- **🟢 Green (+)**: Maximize window (planned feature)

### Window Management
- **Drag**: Click and hold the title bar to move windows
- **Resize**: Drag window edges or corners to resize
- **Minimize**: Click red button or click dock icon again
- **Restore**: Click the dock icon to restore minimized windows

## 🗺️ Working with Maps

### Base Maps
1. Click the **Map Layers** icon (📁) in the dock
2. Choose from available base map providers:
   - OpenStreetMap
   - Satellite imagery
   - Terrain maps
   - Custom tile services

### Navigation
- **Pan**: Click and drag the map to move around
- **Zoom**: Use mouse wheel or zoom controls
- **Full Extent**: Right-click for context menu options

## ✏️ Drawing Tools

### Opening Drawing Tools
1. Click the **Drawing Tools** icon (✏️) in the dock
2. The drawing tools window will open with these options:

### Available Tools
- **Point Tool**: Click map to add single points/markers
- **Line Tool**: Click multiple points to draw lines and paths
- **Polygon Tool**: Click to create polygons, double-click to finish
- **Select Tool**: Click features to select and highlight them
- **Modify Tool**: Drag vertices to edit existing features
- **Clear Tool**: Remove all drawn features from the map

### How to Draw
1. **Points**: Select Point Tool, click anywhere on the map
2. **Lines**: Select Line Tool, click points along your desired path
3. **Polygons**: Select Polygon Tool, click points around your area, double-click to close
4. **Editing**: Use Select Tool to choose features, then Modify Tool to drag vertices

## 📍 Location Services

### GPS Tracking
1. Click the **Location Tracker** icon (📍) in the dock
2. Click "Start Tracking" to begin real-time GPS tracking
3. Your position will appear as a blue dot on the map
4. Track accuracy and coordinates are displayed in the panel

### GPS Device Integration
1. Click the **GPS Integration** icon (🛰️) in the dock
2. Click "Connect GPS Device" to connect external GPS units
3. **Note**: Requires Chrome/Edge browser and HTTPS connection
4. Export routes to your GPS device or import tracks

## 📁 File Operations

### Importing Files
1. Click the **File Operations** icon (📄) in the dock
2. Choose "Import File" or drag files directly to the import area
3. Supported formats:
   - **GeoJSON** (.geojson, .json) - Full feature support
   - **KML** (.kml) - Google Earth format
   - **GPX** (.gpx) - GPS track format

### Sample Data
MapVue includes sample data files:
- `sample-data.geojson` - Example GeoJSON features
- `sample-data.kml` - Example KML data

### Exporting Data
1. Select the layer or features you want to export
2. Click "Export" in the File Operations window
3. Choose your desired format (GeoJSON, KML, GPX)
4. File will download to your browser's download folder

## 🛣️ Route Management

### Creating Routes
1. Click the **Route Manager** icon (🧭) in the dock
2. Click "New Route" to start planning
3. Click points on the map to add waypoints
4. The route will calculate distances and display turn-by-turn directions

### Route Features
- **Waypoint Management**: Add, remove, and reorder route points
- **Distance Calculation**: Automatic distance and time estimates
- **Elevation Profiles**: View route elevation changes
- **Export Routes**: Save routes as GPX files for GPS devices

### Route Editing
- Drag waypoints to new locations
- Add intermediate points by clicking the route line
- Delete waypoints with right-click menu
- Optimize route order automatically

## 📋 Layer Management

### Layer Panel
1. Click the **Layer Panel** icon (📋) in the dock
2. View all active layers in your project
3. Control each layer individually:

### Layer Controls
- **Visibility**: Toggle layers on/off with the eye icon
- **Opacity**: Adjust transparency with the slider
- **Reorder**: Drag layers to change drawing order
- **Style**: Modify colors, symbols, and styling
- **Delete**: Remove layers completely

### Layer Types
- **Vector Layers**: Points, lines, polygons from GIS files
- **Raster Layers**: Satellite imagery and aerial photos
- **Tile Layers**: Web map services and custom tiles

## ⚙️ Settings & Preferences

### Application Settings
1. Click the **Settings** icon (⚙️) in the dock
2. Configure your preferences:
   - Default map center and zoom level
   - Coordinate system display
   - Measurement units (metric/imperial)
   - GPS tracking settings

### Map Settings
- Choose default base map
- Set coordinate display format
- Configure drawing tool defaults
- Adjust performance settings

## 🔧 Advanced GIS Tools

### GIS Utilities
1. Click the **GIS Tools** icon (🔧) in the dock
2. Access advanced functionality:
   - Spatial measurements
   - Coordinate transformation
   - Feature analysis
   - Data validation tools

### Spatial Analysis
- **Buffer Analysis**: Create zones around features
- **Intersection**: Find overlapping features
- **Distance Measurements**: Calculate distances and areas
- **Coordinate Conversion**: Transform between coordinate systems

## 🌐 Working with Projects

### Project Management
- Create new projects to organize your work
- Each project contains multiple layers
- Share projects with team members
- Export entire projects for backup

### Collaboration
- Real-time collaboration with team members
- See other users' cursors and edits live
- Comment and annotation system
- Version control for project changes

## 💡 Tips & Best Practices

### Performance Tips
- Keep large datasets in separate layers
- Use appropriate zoom levels for detailed editing
- Close unused windows to improve performance
- Clear temporary features regularly

### Organization
- Use descriptive layer names
- Group related features in the same layer
- Create separate projects for different areas
- Regular backup of important projects

### GPS Best Practices
- Allow location permissions when prompted
- Use GPS devices for higher accuracy
- Import tracks regularly to avoid data loss
- Calibrate GPS devices before important surveys

## 🔍 Troubleshooting

### Common Issues

#### GPS Not Working
- **Solution**: Check browser permissions for geolocation
- **Chrome**: Click lock icon in address bar → Allow location
- **Firefox**: Click shield icon → Allow location access

#### Files Won't Import
- **Check Format**: Ensure file is GeoJSON, KML, or GPX
- **File Size**: Maximum 10MB file size limit
- **Valid Data**: Ensure file contains valid geographic data

#### Windows Won't Open
- **Refresh**: Reload the page (F5 or Ctrl+R)
- **Clear Cache**: Clear browser cache and cookies
- **Check Console**: Open browser DevTools for error messages

#### GPS Device Connection Fails
- **Browser Support**: Only Chrome/Edge support Web Serial API
- **HTTPS Required**: GPS devices require secure connection (localhost is OK)
- **Permissions**: Grant serial port permissions when prompted

### Browser Compatibility
- **Chrome 90+**: Full support including GPS devices
- **Firefox 88+**: All features except GPS device integration
- **Safari 14+**: Basic functionality, limited GPS support
- **Edge 90+**: Full support including GPS devices

## 📱 Mobile Usage

### Touch Controls
- **Tap**: Select features or menu items
- **Long Press**: Access context menus
- **Pinch**: Zoom in/out on map
- **Two-finger Drag**: Pan the map

### Mobile Limitations
- GPS device integration not available
- Reduced window management capabilities
- File operations may be limited by browser
- Performance may be reduced on older devices

## 🚀 Advanced Features

### Keyboard Shortcuts
- **Ctrl+Z**: Undo last action
- **Ctrl+Y**: Redo action
- **Escape**: Cancel current drawing operation
- **Delete**: Remove selected features
- **Ctrl+S**: Save project (if logged in)

### Power User Features
- Bulk feature editing
- Custom styling with CSS
- Advanced spatial queries
- Plugin system (coming soon)

## 📚 Additional Resources

### Documentation
- [API Documentation](API_DOCUMENTATION.md)
- [Developer Guide](backend/database/README.md)
- [Setup Instructions](backend/database/SETUP_INSTRUCTIONS.md)

### Community
- GitHub Issues for bug reports
- Discussions for feature requests
- Wiki for community documentation

### Support
- Check the troubleshooting section above
- Search existing GitHub issues
- Create new issue with detailed description
- Include browser version and error messages

---

**Happy Mapping with MapVue! 🗺️✨**

*For technical support or feature requests, please visit our [GitHub repository](https://github.com/sublyime/mapvue)*