import multer from 'multer';

// Configure multer for file uploads (in-memory)
export const upload = multer({ storage: multer.memoryStorage() });
