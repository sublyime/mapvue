import { Router, Request, Response } from 'express';
import { query } from '../db';

const router = Router();

// Get all GIS layers
router.get('/layers', async (req: Request, res: Response) => {
  try {
    const result = await query(`
      SELECT 
        id, 
        name, 
        type, 
        url, 
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
      type: row.type,
      url: row.url,
      styleConfig: row.style_config,
      visible: row.visible,
      opacity: row.opacity,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      projectId: row.project_id
    }));

    res.json({ layers });
  } catch (error) {
    console.error('Error fetching layers:', error);
    res.status(500).json({ error: 'Failed to fetch layers' });
  }
});

// Add new GIS layer
router.post('/layers', async (req: Request, res: Response) => {
  try {
    const { name, type, url, data, styleConfig, projectId } = req.body;
    
    const result = await query(`
      INSERT INTO layers (name, type, url, data, style_config, project_id, visible, opacity, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      RETURNING id, name, type, url, data, style_config, visible, opacity, created_at, updated_at, project_id
    `, [name, type, url, data || null, styleConfig || null, projectId || null, true, 1]);
    
    const newLayer = result.rows[0];
    
    res.status(201).json({
      id: newLayer.id,
      name: newLayer.name,
      type: newLayer.type,
      url: newLayer.url,
      data: newLayer.data,
      styleConfig: newLayer.style_config,
      visible: newLayer.visible,
      opacity: newLayer.opacity,
      createdAt: newLayer.created_at,
      updatedAt: newLayer.updated_at,
      projectId: newLayer.project_id
    });
  } catch (error) {
    console.error('Error creating layer:', error);
    res.status(500).json({ error: 'Failed to create layer' });
  }
});

// Get layer by ID
router.get('/layers/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const result = await query(`
      SELECT 
        id, 
        name, 
        type, 
        url, 
        data,
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
      type: layer.type,
      url: layer.url,
      data: layer.data,
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
});

// Update layer
router.put('/layers/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, type, url, data, styleConfig, visible, opacity } = req.body;
    
    const result = await query(`
      UPDATE layers 
      SET 
        name = COALESCE($1, name),
        type = COALESCE($2, type),
        url = COALESCE($3, url),
        data = COALESCE($4, data),
        style_config = COALESCE($5, style_config),
        visible = COALESCE($6, visible),
        opacity = COALESCE($7, opacity),
        updated_at = NOW()
      WHERE id = $8
      RETURNING id, name, type, url, data, style_config, visible, opacity, created_at, updated_at, project_id
    `, [name, type, url, data, styleConfig, visible, opacity, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Layer not found' });
    }
    
    const layer = result.rows[0];
    res.json({
      id: layer.id,
      name: layer.name,
      type: layer.type,
      url: layer.url,
      data: layer.data,
      styleConfig: layer.style_config,
      visible: layer.visible,
      opacity: layer.opacity,
      createdAt: layer.created_at,
      updatedAt: layer.updated_at,
      projectId: layer.project_id
    });
  } catch (error) {
    console.error('Error updating layer:', error);
    res.status(500).json({ error: 'Failed to update layer' });
  }
});

// Delete layer
router.delete('/layers/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // First delete all features associated with this layer
    await query('DELETE FROM features WHERE layer_id = $1', [id]);
    
    // Then delete the layer
    const result = await query('DELETE FROM layers WHERE id = $1 RETURNING id', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Layer not found' });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting layer:', error);
    res.status(500).json({ error: 'Failed to delete layer' });
  }
});

// Get features for a layer
router.get('/layers/:id/features', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { bbox, zoom } = req.query;
    
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
});

// Add feature to layer
router.post('/layers/:id/features', async (req: Request, res: Response) => {
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
});

// Update feature
router.put('/features/:featureId', async (req: Request, res: Response) => {
  try {
    const { featureId } = req.params;
    const { properties, geometry } = req.body;
    
    const result = await query(`
      UPDATE features 
      SET 
        properties = COALESCE($1, properties),
        geometry = COALESCE(ST_GeomFromGeoJSON($2), geometry),
        updated_at = NOW()
      WHERE id = $3
      RETURNING id, properties, ST_AsGeoJSON(geometry) as geometry, created_at, updated_at
    `, [properties, geometry ? JSON.stringify(geometry) : null, featureId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Feature not found' });
    }
    
    const feature = result.rows[0];
    
    res.json({
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
    console.error('Error updating feature:', error);
    res.status(500).json({ error: 'Failed to update feature' });
  }
});

// Delete feature
router.delete('/features/:featureId', async (req: Request, res: Response) => {
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
});

// Spatial analysis endpoints

// Get features within a distance of a point
router.post('/spatial/buffer', async (req: Request, res: Response) => {
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
});

export default router;