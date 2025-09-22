import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { initializeDatabase } from '../database/connection';

const router = Router();

// Helper function to get database instance
const getDatabase = () => {
  return initializeDatabase();
};

// Helper function to execute queries
const query = async (text: string, params?: any[]) => {
  const db = getDatabase();
  return await db.query(text, params);
};

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error instanceof Error ? error : new Error('Unknown error'), uploadDir);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + extension);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allowed file types for GIS data
    const allowedTypes = [
      '.kml', '.kmz', '.geojson', '.json', '.gpx', '.shp', '.shx', '.dbf', '.prj',
      '.gml', '.geopackage', '.csv', '.txt', '.xml'
    ];
    
    const fileExtension = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${fileExtension} not supported. Allowed types: ${allowedTypes.join(', ')}`));
    }
  }
});

// Upload GIS file
router.post('/gis', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const { layerName, projectId } = req.body;
    const filePath = req.file.path;
    const fileExtension = path.extname(req.file.originalname).toLowerCase();
    
    // Read and process the file based on its type
    let geoData: any = null;
    
    try {
      const fileContent = await fs.readFile(filePath, 'utf-8');
      
      switch (fileExtension) {
        case '.geojson':
        case '.json':
          geoData = JSON.parse(fileContent);
          break;
        case '.kml':
          // For now, store as text - would need additional parsing
          geoData = { type: 'kml', content: fileContent };
          break;
        case '.gpx':
          // For now, store as text - would need additional parsing
          geoData = { type: 'gpx', content: fileContent };
          break;
        case '.csv':
          // For now, store as text - would need additional parsing
          geoData = { type: 'csv', content: fileContent };
          break;
        default:
          // Store as binary data reference for shapefile components
          geoData = { 
            type: 'binary', 
            filename: req.file.filename,
            originalName: req.file.originalname 
          };
      }
      
      // Create layer in database
      const layerResult = await query(`
        INSERT INTO layers (name, type, data, project_id, visible, opacity, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
        RETURNING id, name, type, data, project_id, visible, opacity, created_at
      `, [
        layerName || req.file.originalname,
        'vector',
        geoData,
        projectId || null,
        true,
        1
      ]);
      
      const layer = layerResult.rows[0];
      
      // If it's GeoJSON, also create features
      if (geoData?.type === 'FeatureCollection' && geoData.features) {
        for (const feature of geoData.features) {
          await query(`
            INSERT INTO features (layer_id, properties, geometry, created_at, updated_at)
            VALUES ($1, $2, ST_GeomFromGeoJSON($3), NOW(), NOW())
          `, [
            layer.id,
            feature.properties || {},
            JSON.stringify(feature.geometry)
          ]);
        }
      }
      
      res.status(201).json({
        message: 'File uploaded successfully',
        layer: {
          id: layer.id,
          name: layer.name,
          type: layer.type,
          projectId: layer.project_id,
          visible: layer.visible,
          opacity: layer.opacity,
          createdAt: layer.created_at
        },
        file: {
          originalName: req.file.originalname,
          filename: req.file.filename,
          size: req.file.size,
          type: fileExtension
        }
      });
      
    } catch (parseError) {
      console.error('File parsing error:', parseError);
      
      // Clean up uploaded file on error
      try {
        await fs.unlink(filePath);
      } catch (unlinkError) {
        console.error('Failed to clean up file:', unlinkError);
      }
      
      res.status(400).json({ 
        error: 'Failed to parse uploaded file',
        details: parseError instanceof Error ? parseError.message : 'Unknown parsing error'
      });
    }
    
  } catch (error) {
    console.error('Upload error:', error);
    
    // Clean up uploaded file on error
    if (req.file?.path) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Failed to clean up file:', unlinkError);
      }
    }
    
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// Export layer to file
router.get('/export/:layerId', async (req: Request, res: Response) => {
  try {
    const { layerId } = req.params;
    const { format = 'geojson' } = req.query;
    
    // Get layer data
    const layerResult = await query(
      'SELECT name, data FROM layers WHERE id = $1',
      [layerId]
    );
    
    if (layerResult.rows.length === 0) {
      return res.status(404).json({ error: 'Layer not found' });
    }
    
    const layer = layerResult.rows[0];
    
    // Get all features for the layer
    const featuresResult = await query(`
      SELECT 
        properties,
        ST_AsGeoJSON(geometry) as geometry
      FROM features 
      WHERE layer_id = $1
    `, [layerId]);
    
    const features = featuresResult.rows.map(row => ({
      type: 'Feature',
      properties: row.properties,
      geometry: JSON.parse(row.geometry)
    }));
    
    const geoJsonData = {
      type: 'FeatureCollection',
      features
    };
    
    // Set appropriate headers for download
    const filename = `${layer.name || 'layer'}.${format}`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    switch (format) {
      case 'geojson':
        res.setHeader('Content-Type', 'application/geo+json');
        res.json(geoJsonData);
        break;
      case 'json':
        res.setHeader('Content-Type', 'application/json');
        res.json(geoJsonData);
        break;
      default:
        res.status(400).json({ error: 'Unsupported export format' });
    }
    
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Failed to export layer' });
  }
});

// Get upload status/history
router.get('/history', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.query;
    
    let sqlQuery = `
      SELECT 
        id,
        name,
        type,
        created_at,
        updated_at
      FROM layers
      WHERE data IS NOT NULL
    `;
    
    const params: any[] = [];
    
    if (projectId) {
      sqlQuery += ' AND project_id = $1';
      params.push(projectId);
    }
    
    sqlQuery += ' ORDER BY created_at DESC';
    
    const result = await query(sqlQuery, params);
    
    const uploads = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      type: row.type,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
    
    res.json({ uploads });
  } catch (error) {
    console.error('Upload history error:', error);
    res.status(500).json({ error: 'Failed to fetch upload history' });
  }
});

export default router;