# MapVue - Open Source GIS Web Application

A comprehensive web-based Geographic Information System (GIS) application similar to Google Earth, built with modern web technologies and designed for complete customizability and open-source collaboration.

## 🌍 Overview

MapVue is a full-featured web-based mapping application that allows users to import, visualize, edit, and export various types of geographic data. With a beautiful, customizable interface and powerful drawing tools, MapVue provides a complete solution for GIS data management and visualization.

## ✨ Key Features

### Data Import & Export
- **Universal Format Support**: Import KML, GeoJSON, Shapefile, GPX, and other GIS formats
- **Flexible Export**: Export to any desired format
- **API Integration**: Connect to external APIs for data import/export
- **Webhook Support**: Real-time data synchronization

### Interactive Mapping
- **Beautiful Maps**: High-quality map rendering with multiple tile layer options
- **Drawing Tools**: Complete set of tools for creating and editing geometric features
- **Markers & Places**: Add, edit, and manage points of interest
- **Layer Management**: Organize data in customizable layers

### Collaboration & Real-time Features
- **Live Editing**: Real-time collaborative editing with Socket.io
- **User Management**: Multi-user support with authentication
- **Project Sharing**: Share and collaborate on mapping projects

### Customization
- **Fully Customizable Interface**: Tailor the UI to your specific needs
- **Open Source**: 100% open source with MIT license
- **Extensible Architecture**: Built for easy extension and modification

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 15+ with PostGIS extension
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd mapvue
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd frontend && npm install
   cd ../backend && npm install
   ```

3. **Set up the database**
   ```sql
   -- Connect to PostgreSQL and create database
   CREATE DATABASE mapvue_db;
   \c mapvue_db;
   CREATE EXTENSION postgis;
   
   -- Run the schema
   \i database/schema.sql
   ```

4. **Configure environment variables**
   
   Create `backend/.env`:
   ```env
   NODE_ENV=development
   PORT=3001
   DATABASE_URL=postgresql://username:password@localhost:5432/mapvue_db
   JWT_SECRET=your-super-secret-jwt-key
   CORS_ORIGIN=http://localhost:5173
   ```

5. **Start the development servers**
   
   Terminal 1 (Backend):
   ```bash
   cd backend
   npm run dev
   ```
   
   Terminal 2 (Frontend):
   ```bash
   cd frontend
   npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:5173` to start using MapVue!

## 🏗️ Architecture

### Frontend (React + TypeScript)
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and building
- **Mapping**: OpenLayers for professional GIS capabilities
- **Styling**: Tailwind CSS for responsive design
- **State Management**: Zustand for application state
- **Real-time**: Socket.io client for live collaboration

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
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── stores/         # Zustand state stores
│   │   ├── types/          # TypeScript type definitions
│   │   └── utils/          # Utility functions
│   └── public/             # Static assets
├── backend/                 # Node.js backend API
│   ├── src/
│   │   ├── routes/         # Express route handlers
│   │   ├── middleware/     # Express middleware
│   │   ├── services/       # Business logic services
│   │   └── utils/          # Backend utilities
│   └── uploads/            # File upload directory
├── database/               # Database schema and migrations
├── shared/                 # Shared TypeScript types and utilities
└── docs/                   # Additional documentation
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

### Phase 1 (Current)
- ✅ Basic project structure
- ✅ Frontend React application
- ✅ Backend API server
- ✅ Database schema
- ⏳ Drawing tools implementation
- ⏳ File import/export functionality

### Phase 2
- 🔄 Advanced GIS operations
- 🔄 Layer styling and symbology
- 🔄 Spatial analysis tools
- 🔄 Advanced drawing tools (circles, polygons, measurements)

### Phase 3
- 📋 Plugin system for extensions
- 📋 Advanced collaboration features
- 📋 Mobile responsive interface
- 📋 Offline capabilities

### Phase 4
- 📋 3D visualization support
- 📋 Time-series data visualization
- 📋 Advanced analytics and reporting
- 📋 Enterprise features

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](docs/CONTRIBUTING.md) for details on:
- Code of conduct
- Development setup
- Pull request process
- Coding standards

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🐛 Bug Reports & Feature Requests

- **Bug Reports**: Please use the [GitHub Issues](https://github.com/your-username/mapvue/issues) page
- **Feature Requests**: Create a feature request issue with detailed description
- **Security Issues**: Please email security@mapvue.dev for security-related concerns

## 💬 Community & Support

- **Documentation**: Visit our [docs folder](docs/) for detailed guides
- **Discussions**: Join the conversation in [GitHub Discussions](https://github.com/your-username/mapvue/discussions)
- **Chat**: Join our community chat (Discord/Slack link here)

## 🙏 Acknowledgments

- [OpenLayers](https://openlayers.org/) for the amazing mapping library
- [PostGIS](https://postgis.net/) for spatial database capabilities
- [React](https://reactjs.org/) and the entire React ecosystem
- All the open source contributors who make projects like this possible

---

**Built with ❤️ by the MapVue community**

*MapVue - Making GIS accessible to everyone*