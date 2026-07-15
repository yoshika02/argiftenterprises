import { defineConfig } from 'vite';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export default defineConfig({
  publicDir: 'public',
  server: {
    fs: { allow: ['.'] }
  },
  plugins: [
    {
      name: 'root-images',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const url = decodeURIComponent((req.url || '').split('?')[0]);
          if (/\.(jpe?g|png|gif|webp|svg)$/i.test(url)) {
            const filePath = join(process.cwd(), url.replace(/^\//, ''));
            if (existsSync(filePath)) {
              res.setHeader('Content-Type', 'image/jpeg');
              const stream = readFileSync(filePath);
              res.end(stream);
              return;
            }
          }
          next();
        });
      }
    }
  ]
});
