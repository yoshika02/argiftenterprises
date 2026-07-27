import { defineConfig } from 'vite';
import { readFileSync, existsSync } from 'fs';
import { join, extname } from 'path';

import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  publicDir: 'public',
  server: {
    fs: { allow: ['.'] }
  },
  plugins: [{
    name: 'root-images',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        // Decode %20 spaces in URL
        const url = decodeURIComponent((req.url || '').split('?')[0]);
        const ext = extname(url).toLowerCase();
        const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];

        if (imageExts.includes(ext)) {
          // Build path: strip leading slash and join with project root
          const filename = url.replace(/^\//, '');
          const filePath = join(process.cwd(), filename);

          if (existsSync(filePath)) {
            const mimeMap = {
              '.jpg': 'image/jpeg',
              '.jpeg': 'image/jpeg',
              '.png': 'image/png',
              '.gif': 'image/gif',
              '.webp': 'image/webp',
              '.svg': 'image/svg+xml'
            };
            res.setHeader('Content-Type', mimeMap[ext] || 'image/jpeg');
            res.setHeader('Cache-Control', 'public, max-age=31536000');
            res.end(readFileSync(filePath));
            return;
          }
        }
        next();
      });
    }
  }, cloudflare()]
});