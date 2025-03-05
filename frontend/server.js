import { createServer } from 'vite';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const template = fs.readFileSync(resolve(__dirname, 'index.html'), 'utf-8');

async function startServer() {
  try {
    const vite = await createServer({
      configFile: './vite.config.js',
      server: {
        port: 3000,
        host: '0.0.0.0',
        middlewareMode: true,
      },
      appType: 'custom'
    });

    Bun.serve({
      port: 3000,
      async fetch(req) {
        const url = new URL(req.url);
        
        try {
          // Serve static assets
          const publicFile = await vite.transformIndexHtml(url.pathname, '');
          if (publicFile) {
            return new Response(publicFile, {
              headers: { 'Content-Type': 'text/html' },
            });
          }

          // SSR
          let template = fs.readFileSync(resolve(__dirname, 'index.html'), 'utf-8');
          template = await vite.transformIndexHtml(url.pathname, template);
          
          const { render } = await vite.ssrLoadModule('/src/entry-server.tsx');
          const { html: appHtml } = await render(url.pathname);
          
          const html = template.replace(`<!--ssr-outlet-->`, appHtml);
          
          return new Response(html, {
            headers: { 'Content-Type': 'text/html' },
          });
        } catch (e) {
          vite.ssrFixStacktrace(e);
          console.error(e);
          return new Response(e.stack, { status: 500 });
        }
      },
    });

    console.log(`Server running at http://localhost:3000`);
  } catch (e) {
    console.error('Server error:', e);
  }
}

startServer();