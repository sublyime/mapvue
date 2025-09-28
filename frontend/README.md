# MapVue Frontend - macOS-Style GIS Interface

A professional React-based GIS application featuring a stunning macOS-style dock interface with draggable windows, built with TypeScript and modern web technologies.

## 🎯 Overview

The MapVue frontend is a sophisticated GIS web application that combines the power of OpenLayers mapping with an intuitive macOS-inspired user interface. The application features a comprehensive dock system with 9 specialized GIS applications, each running in their own draggable, resizable windows.

## ✨ Key Features

### 🖥️ macOS-Style Interface
- **Professional Dock**: Bottom-mounted dock with 9 application icons
- **Traffic Light Controls**: macOS-style red/yellow/green window controls
- **Glassmorphism Design**: Modern blur effects and transparency
- **Draggable Windows**: Fully resizable and repositionable windows
- **Window Management**: Proper minimize/restore functionality

### 🗺️ GIS Applications (9 Dock Icons)
1. **Route Manager** (Navigation icon) - Route planning and waypoint management
2. **Layer Panel** (Layers icon) - Layer visibility and opacity controls
3. **Map Layers** (FolderOpen icon) - Base layer and overlay management
4. **Location Tracker** (MapPin icon) - Real-time GPS tracking
5. **GPS Integration** (Satellite icon) - GPS device connectivity
6. **Drawing Tools** (PenTool icon) - Point/Line/Polygon drawing with OpenLayers
7. **File Operations** (FileText icon) - GeoJSON/KML/GPX import/export
8. **Settings** (Settings icon) - Application preferences
9. **GIS Tools** (Wrench icon) - Advanced GIS utilities

### 🛠️ Technical Stack
- **React 19.1.1** - Latest React with concurrent features
- **TypeScript** - Full type safety and IntelliSense
- **Vite 7.1.7** - Lightning-fast development and building
- **OpenLayers 10+** - Professional mapping library
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Beautiful, consistent icons
- **PostCSS** - CSS processing and optimization

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Modern browser with ES2020+ support

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Development Server
The app will be available at `http://localhost:5173` with hot module replacement.

## 🏗️ Architecture

### Component Structure
```
src/
├── components/
│   ├── MacOSDock.tsx           # Main dock component
│   ├── DraggableWindow.tsx     # Draggable window wrapper
│   ├── WindowComponents.tsx    # Window content wrappers
│   ├── RouteManager.tsx        # Route planning (539 lines)
│   ├── LayerPanel.tsx          # Layer management (433 lines)
│   ├── LocationTracker.tsx     # GPS tracking (414 lines)
│   └── GPSIntegration.tsx      # GPS devices (245 lines)
├── context/
│   └── WindowManagerContext.tsx # Window state management
├── hooks/
│   └── useGIS.ts               # GIS data hooks (273 lines)
├── services/
│   ├── api.ts                  # Main API client
│   └── gisApi.ts               # GIS-specific calls (157 lines)
└── utils/
    ├── gpsDeviceManager.ts     # GPS device management
    └── deviceExports.ts        # Export utilities
```

### State Management
- **Window Manager Context**: Controls window visibility, position, and state
- **GIS Hooks**: Manage projects, layers, features, and spatial data
- **Local State**: Individual component state with React hooks

### OpenLayers Integration
- **Map Instance**: Centralized OpenLayers map with proper cleanup
- **Drawing Interactions**: Point, Line, Polygon, Select, Modify tools
- **Layer Management**: Vector and raster layer handling
- **Spatial Operations**: Geometry creation, modification, and analysis

## 🎨 Styling

### Glassmorphism Design
The interface uses modern glassmorphism effects with:
- Backdrop blur filters
- Semi-transparent backgrounds
- Subtle shadows and borders
- Smooth animations and transitions

### Responsive Design
- Mobile-first approach with Tailwind CSS
- Flexible grid and flexbox layouts
- Responsive typography and spacing
- Touch-friendly controls for mobile devices

### Dark Mode Support
- Built-in dark mode compatibility
- CSS variables for theme switching
- Consistent color palette across components

## 🔧 Development

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking
```

### ESLint Configuration
The project uses modern ESLint configuration with:
- React and React Hooks rules
- TypeScript-aware linting
- Import sorting and organization
- Accessibility (a11y) rules

### TypeScript Configuration
- Strict type checking enabled
- Modern ES2020+ target
- Path mapping for clean imports
- Proper DOM and React types

## 🧪 Testing

### Unit Testing
```bash
npm run test         # Run unit tests
npm run test:watch   # Watch mode for development
npm run test:coverage # Generate coverage report
```

### E2E Testing
```bash
npm run e2e          # Run end-to-end tests
npm run e2e:ui       # Interactive E2E testing
```

## 🌐 API Integration

### Backend Communication
- RESTful API client with error handling
- Authentication with JWT tokens
- File upload with progress tracking
- Real-time updates with Socket.io

### GIS Data Handling
- GeoJSON format for all geometry data
- Efficient spatial query caching
- Optimistic updates for better UX
- Error recovery and retry logic

## 🔒 Security

### Data Protection
- Secure API communication over HTTPS
- JWT token management and refresh
- Input sanitization and validation
- CORS configuration for secure origins

### Privacy
- No tracking or analytics by default
- Local storage for preferences only
- User consent for geolocation access
- Secure GPS device integration

## 📱 Browser Support

### Modern Browsers
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Required Web APIs
- **Geolocation API** - For location tracking
- **Web Serial API** - For GPS device integration (Chrome/Edge)
- **File API** - For file import/export
- **Canvas API** - For OpenLayers rendering

## 🚀 Deployment

### Build Optimization
- Tree shaking for minimal bundle size
- Code splitting for faster loading
- Static asset optimization
- Progressive Web App features

### Environment Configuration
Create `.env.local` for development:
```env
VITE_API_URL=http://localhost:3001
VITE_MAP_DEFAULT_CENTER="-74.0060,40.7128"
VITE_MAP_DEFAULT_ZOOM="10"
```

### Production Deployment
The built application is a static SPA that can be deployed to:
- Netlify, Vercel, or similar static hosts
- AWS S3 + CloudFront
- Docker containers
- Traditional web servers (Apache, Nginx)

## 🤝 Contributing

### Development Workflow
1. Fork and clone the repository
2. Create a feature branch
3. Make changes with proper TypeScript types
4. Add tests for new functionality
5. Run linting and type checking
6. Submit a pull request

### Code Style
- Use TypeScript for all new code
- Follow React hooks best practices
- Implement proper error boundaries
- Write descriptive commit messages
- Add JSDoc comments for complex functions

## 🐛 Common Issues

### GPS Device Connection
- Requires HTTPS or localhost for Web Serial API
- Only supported in Chrome and Edge browsers
- User must grant serial port permissions

### File Import Problems
- Check file format compatibility (GeoJSON, KML, GPX)
- Verify file size limits (10MB default)
- Ensure proper CORS headers for external files

### Performance Issues
- Use React DevTools Profiler for optimization
- Implement virtual scrolling for large datasets
- Optimize OpenLayers rendering with clustering

## 📚 Additional Resources

- [OpenLayers Documentation](https://openlayers.org/en/latest/apidoc/)
- [React TypeScript Guide](https://react-typescript-cheatsheet.netlify.app/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Vite Configuration Guide](https://vitejs.dev/guide/)

---

**MapVue Frontend - Where GIS meets elegant design** 🗺️✨
