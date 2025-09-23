import { upload } from '../utils/upload';
// import { parseKML, parseGPX } from '../utils/gisImport'; // To be implemented
import { Router, Request, Response, NextFunction } from 'express';
import { initializeDatabase } from '../database/connection';

const router = Router();

// Async handler wrapper to catch errors and pass to next()
const asyncHandler = (fn: any) => (req: Request, res: Response, next: NextFunction) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// Helper function to get database instance
const getDatabase = () => {
  return initializeDatabase();
};

// Helper function to execute queries
const query = async (text: string, params?: any[]) => {
  const db = getDatabase();
  return await db.query(text, params);
};

// Get all GIS layers
router.get('/layers', asyncHandler(async (req: Request, res: Response) => {
  console.log('[GET /layers] start');
  try {
    const result = await query(`
      SELECT 
        id, 
        name, 
        description,
        type, 
        style_config,
        visible, 
        opacity,
        created_at,
        updated_at,
        project_id
      FROM layers 
      WHERE project_id = $1 OR project_id IS NULL
      ORDER BY created_at DESC
    `, [req.query.project_id || null]);

    const layers = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      type: row.type,
      styleConfig: row.style_config,
      visible: row.visible,
      opacity: typeof row.opacity === 'number' ? row.opacity : Number(row.opacity),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      projectId: row.project_id
    }));

    console.log('[GET /layers] end');
    res.json({ layers });
  } catch (error) {
    console.error('[GET /layers] error:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error instanceof Error ? error.message : error });
  }
}));

// Add new GIS layer
router.post('/layers', asyncHandler(async (req: Request, res: Response) => {
  console.log('[POST /layers] start');
  const { name, description, type, styleConfig, projectId } = req.body;
  
  // Get the admin user ID (for now, we'll use the default admin user)
  const userResult = await query('SELECT id FROM users WHERE username = $1', ['admin']);
  if (userResult.rows.length === 0) {
    return res.status(500).json({ error: 'Default admin user not found' });
  }
  const ownerId = userResult.rows[0].id;
  
  const result = await query(`
    INSERT INTO layers (name, description, type, style_config, project_id, owner_id, visible, opacity, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
    RETURNING id, name, description, type, style_config, visible, opacity, created_at, updated_at, project_id
  `, [name, description || null, type, styleConfig || null, projectId || null, ownerId, true, 1]);
  
  const newLayer = result.rows[0];
  console.log('[POST /layers] end');
  res.status(201).json({
    layer: {
      id: newLayer.id,
      name: newLayer.name,
      description: newLayer.description,
      type: newLayer.type,
      styleConfig: newLayer.style_config,
      visible: newLayer.visible,
  opacity: typeof newLayer.opacity === 'number' ? newLayer.opacity : Number(newLayer.opacity),
      createdAt: newLayer.created_at,
      updatedAt: newLayer.updated_at,
      projectId: newLayer.project_id
    }
  });
}));

// Get layer by ID
router.get('/layers/:id', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const result = await query(`
      SELECT 
        id, 
        name, 
        description,
        type, 
        style_config,
        visible, 
        opacity,
        created_at,
        updated_at,
        project_id
      FROM layers 
      WHERE id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Layer not found' });
    }
    
    const layer = result.rows[0];
    res.json({
      id: layer.id,
      name: layer.name,
      description: layer.description,
      type: layer.type,
      styleConfig: layer.style_config,
      visible: layer.visible,
      opacity: layer.opacity,
      createdAt: layer.created_at,
      updatedAt: layer.updated_at,
      projectId: layer.project_id
    });
  } catch (error) {
    console.error('Error fetching layer:', error);
    res.status(500).json({ error: 'Failed to fetch layer' });
  }
}));

// Update layer
router.put('/layers/:id', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, type, styleConfig, visible, opacity } = req.body;

    const result = await query(`
      UPDATE layers 
      SET 
        name = COALESCE($1, name),
        type = COALESCE($2, type),
        style_config = COALESCE($3, style_config),
        visible = COALESCE($4, visible),
        opacity = COALESCE($5, opacity),
        updated_at = NOW()
      WHERE id = $6
      RETURNING id, name, type, style_config, visible, opacity, created_at, updated_at, project_id
    `, [name, type, styleConfig, visible, opacity, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Layer not found' });
    }

    const layer = result.rows[0];
    res.json({
      layer: {
        id: layer.id,
        name: layer.name,
        type: layer.type,
        styleConfig: layer.style_config,
        visible: layer.visible,
        opacity: typeof layer.opacity === 'number' ? layer.opacity : Number(layer.opacity),
        createdAt: layer.created_at,
        updatedAt: layer.updated_at,
        projectId: layer.project_id
      }
    });
  } catch (error) {
    console.error('Error updating layer:', error);
    res.status(500).json({ error: 'Failed to update layer' });
  }
}));

// Delete layer
router.delete('/layers/:id', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // First delete all features associated with this layer
    await query('DELETE FROM features WHERE layer_id = $1', [id]);

    // Then delete the layer
    const result = await query('DELETE FROM layers WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Layer not found' });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting layer:', error);
    res.status(500).json({ error: 'Failed to delete layer' });
  }
}));

// Get features for a layer
router.get('/layers/:id/features', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { bbox } = req.query;
    
    let sqlQuery = `
      SELECT 
        id,
        properties,
        ST_AsGeoJSON(geometry) as geometry,
        created_at,
        updated_at
      FROM features 
      WHERE layer_id = $1
    `;
    
    const params = [id];
    
    // Add spatial filtering if bbox is provided
    if (bbox && typeof bbox === 'string') {
      const bboxValues = bbox.split(',').map(Number);
      if (bboxValues.length === 4) {
        sqlQuery += ` AND ST_Intersects(
          geometry, 
          ST_MakeEnvelope($2, $3, $4, $5, 4326)
        )`;
        params.push(...bboxValues.map(String));
      }
    }
    
    sqlQuery += ' ORDER BY created_at DESC';
    
    const result = await query(sqlQuery, params);
    
    const features = result.rows.map(row => ({
      type: 'Feature',
      id: row.id,
      properties: {
        ...row.properties,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      },
      geometry: JSON.parse(row.geometry)
    }));
    
    res.json({
      type: 'FeatureCollection',
      features
    });
  } catch (error) {
    console.error('Error fetching features:', error);
    res.status(500).json({ error: 'Failed to fetch features' });
  }
}));

// Add feature to layer
router.post('/layers/:id/features', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { type, properties, geometry } = req.body;
    
    if (!geometry || !geometry.type) {
      return res.status(400).json({ error: 'Invalid geometry' });
    }
    
    const result = await query(`
      INSERT INTO features (layer_id, properties, geometry, created_at, updated_at)
      VALUES ($1, $2, ST_GeomFromGeoJSON($3), NOW(), NOW())
      RETURNING id, properties, ST_AsGeoJSON(geometry) as geometry, created_at, updated_at
    `, [id, properties || {}, JSON.stringify(geometry)]);
    
    const feature = result.rows[0];
    
    res.status(201).json({
      type: 'Feature',
      id: feature.id,
      properties: {
        ...feature.properties,
        createdAt: feature.created_at,
        updatedAt: feature.updated_at
      },
      geometry: JSON.parse(feature.geometry)
    });
  } catch (error) {
    console.error('Error adding feature:', error);
    res.status(500).json({ error: 'Failed to add feature' });
  }
}));

// Update feature
router.put('/features/:featureId', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { type, properties, geometry } = req.body;

    if (!geometry || !geometry.type) {
      return res.status(400).json({ error: 'Invalid geometry' });
    }

    // Get the admin user ID (for now, we'll use the default admin user)
    const userResult = await query('SELECT id FROM users WHERE username = $1', ['admin']);
    if (userResult.rows.length === 0) {
      return res.status(500).json({ error: 'Default admin user not found' });
    }
    const ownerId = userResult.rows[0].id;

    const result = await query(`
      INSERT INTO features (layer_id, properties, geometry, owner_id, created_at, updated_at)
      VALUES ($1, $2, ST_GeomFromGeoJSON($3), $4, NOW(), NOW())
      RETURNING id, properties, ST_AsGeoJSON(geometry) as geometry, created_at, updated_at
    `, [id, properties || {}, JSON.stringify(geometry), ownerId]);

    const feature = result.rows[0];

    res.status(201).json({
      type: 'Feature',
      id: feature.id,
      properties: {
        ...feature.properties
      },
      geometry: JSON.parse(feature.geometry),
      createdAt: feature.created_at,
      updatedAt: feature.updated_at
    });
  } catch (error) {
    console.error('Error updating feature:', error);
    res.status(500).json({ error: 'Failed to update feature' });
  }
}));

// Delete feature
router.delete('/features/:featureId', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { featureId } = req.params;
    
    const result = await query('DELETE FROM features WHERE id = $1 RETURNING id', [featureId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Feature not found' });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting feature:', error);
    res.status(500).json({ error: 'Failed to delete feature' });
  }
}));

// Spatial analysis endpoints

// Get features within a distance of a point
router.post('/spatial/buffer', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { longitude, latitude, distance, layerId } = req.body;
    
    if (!longitude || !latitude || !distance) {
      return res.status(400).json({ error: 'Missing required parameters: longitude, latitude, distance' });
    }
    
    let sqlQuery = `
      SELECT 
        f.id,
        f.properties,
        ST_AsGeoJSON(f.geometry) as geometry,
        f.created_at,
        f.updated_at
      FROM features f
      WHERE ST_DWithin(
        f.geometry::geography,
        ST_MakePoint($1, $2)::geography,
        $3
      )
    `;
    
    const params = [longitude, latitude, distance];
    
    if (layerId) {
      sqlQuery += ' AND f.layer_id = $4';
      params.push(layerId);
    }
    
    sqlQuery += ' ORDER BY ST_Distance(f.geometry::geography, ST_MakePoint($1, $2)::geography)';
    
    const result = await query(sqlQuery, params);
    
    const features = result.rows.map(row => ({
      type: 'Feature',
      id: row.id,
      properties: {
        ...row.properties,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      },
      geometry: JSON.parse(row.geometry)
    }));
    
    res.json({
      type: 'FeatureCollection',
      features
    });
  } catch (error) {
    console.error('Error performing spatial buffer analysis:', error);
    res.status(500).json({ error: 'Failed to perform spatial analysis' });
  }
}));

// GIS Import Endpoint (GeoJSON, KML, GPX)
router.post('/import', upload.single('file'), asyncHandler(async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const { originalname, buffer } = req.file;
    const ext = originalname.split('.').pop()?.toLowerCase();

    let geojson;
    if (ext === 'geojson' || ext === 'json') {
      geojson = JSON.parse(buffer.toString('utf8'));
    } else if (ext === 'kml') {
      // geojson = parseKML(buffer); // To be implemented
      return res.status(501).json({ error: 'KML import not implemented yet' });
    } else if (ext === 'gpx') {
      // geojson = parseGPX(buffer); // To be implemented
      return res.status(501).json({ error: 'GPX import not implemented yet' });
    } else {
      return res.status(400).json({ error: 'Unsupported file type' });
    }

    // TODO: Insert geojson features into the database
    // For now, just return the parsed geojson
    res.json({ geojson });
  } catch (error) {
    console.error('Error importing GIS file:', error);
    res.status(500).json({ error: 'Failed to import GIS file' });
  }
}));

export default router;