import { Hono } from 'hono';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const uploadDir = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });
const uploadApp = new Hono();

// Hono middleware adapter for Multer
const multerMiddleware = (uploadHandler: any) => async (c: any, next: any) => {
  return new Promise((resolve, reject) => {
    uploadHandler(c.env.incoming || c.req.raw, {} as any, (err: any) => {
      if (err) {
        reject(err);
      } else {
        resolve(next());
      }
    });
  });
};

uploadApp.post('/public/upload', async (c) => {
  try {
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const body = await c.req.parseBody();
    const file = body['file'] as any;
    if (!file) {
      return c.json({ success: false, message: 'No file provided' }, 400);
    }
    
    let buffer: Buffer;
    let safeName = 'file';

    if (typeof file === 'object' && typeof file.arrayBuffer === 'function') {
      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
      safeName = (file.name || 'file').replace(/[^a-zA-Z0-9.-]/g, '_');
    } else if (typeof file === 'string') {
      const matches = file.match(/^data:([^;]+);base64,(.+)$/);
      if (matches) {
        buffer = Buffer.from(matches[2], 'base64');
        const ext = matches[1].split('/')[1] || 'jpg';
        safeName = 'upload.' + ext;
      } else {
        buffer = Buffer.from(file, 'utf8');
        safeName = 'upload.txt';
      }
    } else {
      buffer = Buffer.from(String(file));
    }

    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + '-' + safeName;
    const destPath = path.join(uploadDir, uniqueName);
    
    fs.writeFileSync(destPath, buffer);
    
    return c.json({ path: '/uploads/' + uniqueName, sizeBytes: buffer.length, success: true });
  } catch (err: any) {
    console.error('[Upload Error]:', err);
    return c.json({ success: false, message: err?.message || 'Upload processing failed' }, 500);
  }
});

export { uploadApp };
