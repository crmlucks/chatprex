import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authMiddleware } from './authMiddleware';

const uploadRouter = express.Router();

// Asegurarse de que la carpeta de subidas exista físicamente en la raíz del backend
const UPLOAD_DIR = path.join(__dirname, '../uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Configuración de almacenamiento en disco
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    // Generar un nombre único de archivo con timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// Filtro de tipos de archivos
const fileFilter = (req: any, file: any, cb: any) => {
  if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/') || file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten imágenes, videos o PDFs.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB máximo
  }
});

// Ruta POST protegida para subir un único archivo
uploadRouter.post('/', authMiddleware, upload.single('image'), (req: any, res: any) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se ha proporcionado ninguna imagen o archivo.' });
    }
    
    // Generar la URL pública del archivo absoluta (importante para Evolution API)
    const hostUrl = process.env.VITE_API_URL || `${req.protocol}://${req.get('host')}`;
    const fileUrl = `${hostUrl}/uploads/${req.file.filename}`;
    res.status(200).json({ url: fileUrl });
  } catch (error: any) {
    console.error('[Upload] Error procesando archivo:', error);
    res.status(500).json({ error: 'Error interno del servidor al procesar el archivo.' });
  }
});

export { uploadRouter };
