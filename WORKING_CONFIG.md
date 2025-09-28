# MapVue Working Configuration Reference

## ✅ Confirmed Working Setup (Sept 27, 2025)

### Database Configuration
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mapvue
DB_USER=postgres
DB_PASSWORD=ala1nna
```

### Application URLs
- Frontend: http://localhost:5173/
- Backend API: http://localhost:3001/
- Health Check: http://localhost:3001/health

### Setup Commands
```bash
# 1. Install dependencies
npm install

# 2. Database setup
cd backend\database
.\setup.ps1

# 3. Start application
cd ..\..
npm run dev
```

### Success Indicators
```
✅ Database connection established successfully
🗺️ PostGIS extension detected and ready
🚀 MapVue server running on port 3001
➜  Local:   http://localhost:5173/
```

### Key Features Working
- ✅ PostgreSQL with PostGIS (version 3.5)
- ✅ Backend API with TypeScript strict mode
- ✅ Frontend React with Vite
- ✅ Real-time features with Socket.io
- ✅ Security middleware and error handling
- ✅ File upload for GIS formats
- ✅ Spatial database operations

### Technology Stack
- **Database**: PostgreSQL 15+ with PostGIS 3.5
- **Backend**: Node.js, Express, TypeScript
- **Frontend**: React 19, TypeScript, Vite, OpenLayers
- **Real-time**: Socket.io
- **Security**: JWT, Helmet, CORS, Rate Limiting

### Repository Information
- **Owner**: sublyime
- **Repo**: mapvue  
- **Branch**: main
- **License**: MIT

---
*Last verified: September 27, 2025*