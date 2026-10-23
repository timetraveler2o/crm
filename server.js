import 'dotenv/config';
import fs from 'fs';
import path from 'path';

// Production Entrypoint for Hostinger Web Applications
const distServer = path.resolve(process.cwd(), 'dist-server', 'index.cjs');

if (fs.existsSync(distServer)) {
  await import(`file://${distServer}`);
} else {
  await import('./backend/src/index.ts');
}
