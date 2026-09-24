import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { requireAuth } from '../auth/authMiddleware.js';

// Ensure uploads directory exists (inside server/uploads)
export const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}${ext}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB max file size
  },
});

const router = Router();
router.use(requireAuth);

export interface UploadedAttachment {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  isImage: boolean;
  textContent?: string;
}

const TEXT_EXTENSIONS = new Set([
  '.txt', '.md', '.json', '.csv', '.ts', '.tsx', '.js', '.jsx',
  '.py', '.html', '.css', '.scss', '.yaml', '.yml', '.xml', '.sql',
  '.sh', '.env', '.log', '.c', '.cpp', '.java', '.rs', '.go'
]);

router.post('/', upload.array('files', 10), async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      res.status(400).json({ error: 'No files were provided for upload.' });
      return;
    }

    const attachments: UploadedAttachment[] = [];

    for (const file of files) {
      const ext = path.extname(file.originalname).toLowerCase();
      const isImage = file.mimetype.startsWith('image/');
      let textContent: string | undefined;

      // Extract text content for code/document files
      if (!isImage && (TEXT_EXTENSIONS.has(ext) || file.mimetype.startsWith('text/'))) {
        try {
          const raw = fs.readFileSync(file.path, 'utf-8');
          // Limit to first 60,000 characters to prevent prompt overflow
          textContent = raw.length > 60000 ? raw.slice(0, 60000) + '\n...[content truncated]' : raw;
        } catch (readErr) {
          console.warn(`Could not read text for file ${file.originalname}:`, readErr);
        }
      }

      attachments.push({
        id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        filename: file.filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        url: `/uploads/${file.filename}`,
        isImage,
        textContent,
      });
    }

    res.json({ attachments });
  } catch (error: any) {
    console.error('File upload error:', error);
    res.status(500).json({ error: error.message || 'File upload failed.' });
  }
});

export const uploadRouter = router;
