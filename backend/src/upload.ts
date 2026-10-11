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
  const body = await c.req.parseBody();
  const file = body['file'] as File;
  if (!file) {
    return c.json({ success: false, message: 'No file provided' }, 400);
  }
  
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const safeName = (file.name || 'file').replace(/[^a-zA-Z0-9.-]/g, '_');
  const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + '-' + safeName;
  const filePath = path.join(uploadDir, uniqueName);
  
  fs.writeFileSync(filePath, buffer);
  
  return c.json({ path: '/uploads/' + uniqueName, sizeBytes: buffer.length, success: true });
});

export { uploadApp };
