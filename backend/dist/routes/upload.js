"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
const connection_1 = require("../database/connection");
const router = (0, express_1.Router)();
const getDatabase = () => {
    return (0, connection_1.initializeDatabase)();
};
const query = async (text, params) => {
    const db = getDatabase();
    return await db.query(text, params);
};
const storage = multer_1.default.diskStorage({
    destination: async (req, file, cb) => {
        const uploadDir = path_1.default.join(__dirname, '../../uploads');
        try {
            await promises_1.default.mkdir(uploadDir, { recursive: true });
            cb(null, uploadDir);
        }
        catch (error) {
            cb(error instanceof Error ? error : new Error('Unknown error'), uploadDir);
        }
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path_1.default.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + extension);
    }
});
const upload = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: 50 * 1024 * 1024,
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            '.kml', '.kmz', '.geojson', '.json', '.gpx', '.shp', '.shx', '.dbf', '.prj',
            '.gml', '.geopackage', '.csv', '.txt', '.xml'
        ];
        const fileExtension = path_1.default.extname(file.originalname).toLowerCase();
        if (allowedTypes.includes(fileExtension)) {
            cb(null, true);
        }
        else {
            cb(new Error(`File type ${fileExtension} not supported. Allowed types: ${allowedTypes.join(', ')}`));
        }
    }
});
router.post('/gis', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            res.status(400).json({ error: 'No file uploaded' });
            return;
        }
        const { layerName, projectId } = req.body;
        const filePath = req.file.path;
        const fileExtension = path_1.default.extname(req.file.originalname).toLowerCase();
        let geoData = null;
        try {
            const fileContent = await promises_1.default.readFile(filePath, 'utf-8');
            switch (fileExtension) {
                case '.geojson':
                case '.json':
                    geoData = JSON.parse(fileContent);
                    break;
                case '.kml':
                    geoData = { type: 'kml', content: fileContent };
                    break;
                case '.gpx':
                    geoData = { type: 'gpx', content: fileContent };
                    break;
                case '.csv':
                    geoData = { type: 'csv', content: fileContent };
                    break;
                default:
                    geoData = {
                        type: 'binary',
                        filename: req.file.filename,
                        originalName: req.file.originalname
                    };
            }
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
        }
        catch (parseError) {
            console.error('File parsing error:', parseError);
            try {
                await promises_1.default.unlink(filePath);
            }
            catch (unlinkError) {
                console.error('Failed to clean up file:', unlinkError);
            }
            res.status(400).json({
                error: 'Failed to parse uploaded file',
                details: parseError instanceof Error ? parseError.message : 'Unknown parsing error'
            });
        }
    }
    catch (error) {
        console.error('Upload error:', error);
        if (req.file?.path) {
            try {
                await promises_1.default.unlink(req.file.path);
            }
            catch (unlinkError) {
                console.error('Failed to clean up file:', unlinkError);
            }
        }
        res.status(500).json({ error: 'Failed to upload file' });
    }
});
router.get('/export/:layerId', async (req, res) => {
    try {
        const { layerId } = req.params;
        const { format = 'geojson' } = req.query;
        const layerResult = await query('SELECT name, data FROM layers WHERE id = $1', [layerId]);
        if (layerResult.rows.length === 0) {
            res.status(404).json({ error: 'Layer not found' });
            return;
        }
        const layer = layerResult.rows[0];
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
    }
    catch (error) {
        console.error('Export error:', error);
        res.status(500).json({ error: 'Failed to export layer' });
    }
});
router.get('/history', async (req, res) => {
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
        const params = [];
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
    }
    catch (error) {
        console.error('Upload history error:', error);
        res.status(500).json({ error: 'Failed to fetch upload history' });
    }
});
exports.default = router;
//# sourceMappingURL=upload.js.map