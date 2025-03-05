import { createServer } from 'vite';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

const server = Bun.serve({
  port: 3000,
  async fetch(req) {
    try {
      const vite = await createServer({
        configFile: './vite.config.js',
        server: {
          middlewareMode: true,
          hmr: {
            port: 24678  // Separate port for WebSocket/HMR
          }
        },
        appType: 'custom'
      });

      const url = new URL(req.url);
      
      // Try serving static files first
      try {
        const staticPath = resolve(__dirname, 'public', url.pathname.slice(1));
        const stat = fs.statSync(staticPath);
        if (stat.isFile()) {
          const content = fs.readFileSync(staticPath);
          return new Response(content);
        }
      } catch {}

      // Handle SSR
      let template = fs.readFileSync(resolve(__dirname, 'index.html'), 'utf-8');
      template = await vite.transformIndexHtml(url.pathname, template);
      
      const entryServer = await vite.ssrLoadModule('/src/entry-server.tsx');
      const { html: appHtml } = await entryServer.render(url.pathname);

      // Load and inject Tailwind styles
      const styleSheet = await vite.ssrLoadModule('/src/styles.css');
      const styles = `<style>${styleSheet.default}</style>`;
      
      // First inject styles in head, then app HTML in body
      const processedHtml = template
        .replace('</head>', `${styles}</head>`)
        .replace('<!--ssr-outlet-->', appHtml);
      
      return new Response(processedHtml, {
        headers: { 'Content-Type': 'text/html' },
      });
    } catch (e) {
      console.error(e);
      return new Response(`Server Error: ${e.stack}`, { status: 500 });
    }
  },
});

console.log(`Server running at http://localhost:${server.port}`);