# MapVue - Professional GIS Web Application with macOS Interface

A comprehensive web-based Geographic Information System (GIS) application featuring a stunning macOS-style dock interface, built with modern web technologies for professional GIS workflows and complete customizability.

## 🌍 Overview

MapVue is a professional-grade web-based mapping application that combines the power of OpenLayers with an intuitive macOS-style dock interface. Users can import, visualize, edit, and export various types of geographic data through a beautiful, draggable window system that mirrors the macOS desktop experience. With comprehensive drawing tools, GPS integration, and real-time collaboration features, MapVue provides a complete solution for GIS data management and visualization.

## ✨ Key Features

### 🖥️ macOS-Style Interface
- **Professional Dock System**: macOS-inspired dock with 9 application icons at the bottom
- **Draggable Windows**: Fully resizable and draggable windows with traffic light controls (red/yellow/green)
- **Glassmorphism Design**: Modern glass-blur effects and smooth animations
- **Multi-Window Workspace**: Open multiple tools simultaneously in separate windows
- **Minimize/Restore**: Proper window minimization that returns windows to the dock

### 🗺️ Advanced GIS Capabilities
- **OpenLayers Integration**: Professional-grade mapping with OpenLayers 10+
- **Comprehensive Drawing Tools**: Point, Line, Polygon creation with Select/Modify interactions
- **Route Management**: Complete route planning with waypoints, distance calculation, and elevation profiles
- **Layer Management**: Advanced layer controls with visibility, opacity, and reordering
- **Spatial Analysis**: Built-in GIS analysis tools and measurements

### 📱 GPS & Location Services
- **Real-time GPS Tracking**: Live position tracking with accuracy indicators
- **GPS Device Integration**: Connect to GPS devices via Web Serial API
- **Location Picker**: Click-to-coordinate selection tools
- **Track Recording**: Record and export GPS tracks and routes

### 📁 Data Import & Export
- **Universal Format Support**: GeoJSON, KML, GPX, and Shapefile import/export
- **Sample Data Included**: Pre-loaded sample GeoJSON and KML files
- **Drag & Drop**: Easy file import with drag-and-drop functionality
- **API Integration**: Connect to external GIS APIs and services
- **Real-time Sync**: Live data synchronization with backend

### 🛠️ Professional Tools
- **File Operations**: Comprehensive file management with conflict resolution
- **Settings Panel**: Customizable application preferences and map settings
- **GIS Tools**: Professional GIS analysis and utility functions
- **Map Controls**: Zoom, pan, full extent, and coordinate system controls

### 👥 Collaboration & Backend
- **PostgreSQL + PostGIS**: Robust spatial database backend
- **User Authentication**: Secure user management with JWT tokens
- **Project Management**: Multi-user projects with sharing capabilities
- **Real-time Updates**: Live collaboration with Socket.io
- **RESTful API**: Complete REST API for all GIS operations

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 15+ with PostGIS extension
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/sublyime/mapvue.git
   cd mapvue
   ```

2. **Install dependencies**
   ```bash
   # Install all dependencies from root
   npm install
   
   # Or install individually
   cd backend && npm install
   cd ../frontend && npm install
   cd ..
   ```

3. **Set up PostgreSQL with PostGIS**
   - Install PostgreSQL from: https://www.postgresql.org/download/windows/
   - Make sure to install with PostGIS extension
   - Remember your postgres superuser password

4. **Automated Database Setup (Recommended)**
   ```powershell
   cd backend\database
   .\setup.ps1
   ```
   
   This PowerShell script will automatically:
   - Create the mapvue database
   - Set up all tables and schema with PostGIS
   - Create sample data (optional)
   - Configure all indexes and triggers

5. **Configure environment variables**
   ```bash
   cd backend
   cp .env.example .env
   ```
   
   Update `.env` with your PostgreSQL credentials:
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=mapvue
   DB_USER=postgres
   DB_PASSWORD=your_postgres_password
   ```

6. **Start the development servers**
   ```bash
   npm run dev
   ```
   
   This starts both backend (port 3001) and frontend (port 5173) simultaneously.
   
   ✅ **Success indicators:**
   - Backend: "✅ Database connection established successfully"  
   - Backend: "🗺️ PostGIS extension detected and ready"
   - Frontend: "Local: http://localhost:5173/"

7. **Open your browser**
   Navigate to `http://localhost:5173` to start using MapVue!

## 🏗️ Architecture

### Frontend (React + TypeScript)
- **Framework**: React 19.1.1 with TypeScript for cutting-edge development
- **Build Tool**: Vite 7.1.7 for lightning-fast development and building
- **Mapping**: OpenLayers 10+ for professional GIS capabilities
- **Styling**: Tailwind CSS for responsive design with glassmorphism effects
- **UI Components**: Lucide React icons for professional iconography
- **Window Management**: Custom macOS-style window system with drag/resize/minimize
- **State Management**: React Context API for window and application state
- **Real-time**: Socket.io client for live collaboration
- **GPS Integration**: Web Serial API for GPS device connectivity

### Backend (Node.js + Express)
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript for type safety
- **Database**: PostgreSQL with PostGIS for spatial data
- **Authentication**: JWT-based authentication
- **Real-time**: Socket.io for live features
- **File Upload**: Multer for handling file uploads
- **Security**: CORS, rate limiting, and security headers

### Database (PostgreSQL + PostGIS)
- **Spatial Database**: PostgreSQL with PostGIS extension
- **Tables**: Users, Projects, Layers, Features with spatial indexes
- **Geometry Support**: Full PostGIS geometry types and functions
- **Performance**: Optimized with spatial indexes and constraints

## 📁 Project Structure

```
mapvue/
├── frontend/                    # React frontend with macOS interface
│   ├── src/
│   │   ├── components/         # React components
│   │   │   ├── MacOSDock.tsx   # macOS-style dock component
│   │   │   ├── DraggableWindow.tsx # Draggable window system
│   │   │   ├── WindowComponents.tsx # Window wrappers
│   │   │   ├── RouteManager.tsx     # Route management
│   │   │   ├── LayerPanel.tsx       # Layer controls
│   │   │   ├── LocationTracker.tsx  # GPS tracking
│   │   │   └── GPSIntegration.tsx   # GPS device integration
│   │   ├── hooks/              # Custom React hooks
│   │   │   └── useGIS.ts       # GIS data management hooks
│   │   ├── services/           # API and GIS services
│   │   │   ├── api.ts          # Main API client
│   │   │   └── gisApi.ts       # GIS-specific API calls
│   │   ├── utils/              # Utility functions
│   │   │   ├── gpsDeviceManager.ts # GPS device management
│   │   │   └── deviceExports.ts    # Device export utilities
│   │   ├── types/              # TypeScript definitions
│   │   └── context/            # React Context providers
│   │       └── WindowManagerContext.tsx # Window state management
│   └── public/                 # Static assets
├── backend/                    # Node.js backend API
│   ├── src/
│   │   ├── routes/            # Express route handlers
│   │   │   ├── auth.ts        # Authentication routes
│   │   │   ├── gis.ts         # GIS data operations
│   │   │   └── upload.ts      # File upload handling
│   │   ├── models/            # Database models
│   │   │   ├── User.ts        # User model
│   │   │   ├── Project.ts     # Project model
│   │   │   ├── Layer.ts       # Layer model
│   │   │   └── Feature.ts     # Feature model
│   │   ├── database/          # Database connection
│   │   │   └── connection.ts  # PostgreSQL + PostGIS
│   │   └── utils/             # Backend utilities
│   │       ├── gisImport.ts   # GIS file import
│   │       └── upload.ts      # File handling
│   └── database/              # Database setup
│       ├── schema.sql         # Database schema
│       ├── setup.ps1          # Windows setup script
│       └── migrations/        # Database migrations
├── sample-data.geojson         # Sample GeoJSON data
├── sample-data.kml             # Sample KML data
└── README.md                   # This documentation
```

## 🛠️ Development

### Available Scripts

#### Frontend
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

#### Backend
```bash
npm run dev          # Start development server with hot reload
npm run build        # Build TypeScript to JavaScript
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Adding New Features

1. **Frontend Components**: Add new React components in `frontend/src/components/`
2. **API Endpoints**: Create new routes in `backend/src/routes/`
3. **Database Tables**: Add migrations in `database/migrations/`
4. **Shared Types**: Define common types in `shared/src/types/`

## 🗺️ Roadmap

### Phase 1 (COMPLETED ✓)
- ✅ macOS-style dock interface with 9 applications
- ✅ Draggable, resizable windows with traffic light controls
- ✅ OpenLayers mapping integration
- ✅ Comprehensive drawing tools (Point, Line, Polygon, Select, Modify)
- ✅ Route management with waypoints and distance calculation
- ✅ Layer management with visibility and opacity controls
- ✅ GPS integration and real-time location tracking
- ✅ File import/export (GeoJSON, KML, GPX)
- ✅ PostgreSQL + PostGIS backend
- ✅ Complete REST API with authentication
- ✅ Professional UI with glassmorphism effects

### Phase 2 (IN PROGRESS 🔄)
- 🔄 Advanced spatial analysis tools and measurements
- 🔄 Enhanced GPS device integration and track management
- 🔄 Custom layer styling and symbology
- 🔄 Offline map caching and sync
- 🔄 Mobile-responsive interface optimization

### Phase 3 (PLANNED 📅)
- � Plugin system for custom extensions
- � Advanced collaboration with real-time multi-user editing
- � 3D visualization and terrain analysis
- 📅 Time-series data visualization and animation
- � Advanced reporting and export capabilities

### Phase 4 (FUTURE 🎆)
- 🎆 Enterprise features and deployment options
- 🎆 Advanced analytics and machine learning integration
- 🎆 Mobile native applications (iOS/Android)
- 🎆 Cloud deployment and scaling options

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](docs/CONTRIBUTING.md) for details on:
- Code of conduct
- Development setup
- Pull request process
- Coding standards

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🐛 Bug Reports & Feature Requests

- **Bug Reports**: Please use the [GitHub Issues](https://github.com/sublyime/mapvue/issues) page
- **Feature Requests**: Create a feature request issue with detailed description
- **Security Issues**: Please email security concerns to the repository owner

## 💬 Community & Support

- **Documentation**: Visit our [SETUP_GUIDE.md](SETUP_GUIDE.md) for detailed setup instructions
- **Database Setup**: See [database setup guide](backend/database/SETUP_INSTRUCTIONS.md)
- **Discussions**: Join the conversation in [GitHub Discussions](https://github.com/sublyime/mapvue/discussions)

## 🙏 Acknowledgments

- [OpenLayers](https://openlayers.org/) for the amazing professional mapping library
- [PostGIS](https://postgis.net/) for powerful spatial database capabilities
- [React](https://reactjs.org/) and the entire React ecosystem
- [Vite](https://vitejs.dev/) for the incredibly fast build system
- [Tailwind CSS](https://tailwindcss.com/) for the utility-first styling framework
- [Lucide React](https://lucide.dev/) for the beautiful, consistent icon set
- [TypeScript](https://www.typescriptlang.org/) for type safety and developer experience
- [PostgreSQL](https://www.postgresql.org/) for the robust database foundation
- All the open source contributors who make projects like this possible

---

**Built with ❤️ by the MapVue community**

*MapVue - Professional GIS with macOS elegance*