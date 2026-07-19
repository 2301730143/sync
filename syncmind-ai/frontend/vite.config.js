import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Local dev routes through Vite's dev proxy so the frontend can keep using a
// single '/api' axios client while the two backend microservices run on
// separate ports. This is a dev convenience, not a production gateway — see
// README "Deployment" for how to route these in production (e.g. Vercel
// rewrites, or a small reverse proxy in front of both services).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // More specific path first — /api/auth/* goes to auth-service (MS1).
      '/api/auth': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/auth/, ''),
      },
      // Everything else under /api/* (projects, tasks, notifications) goes
      // to project-service.
      '/api': {
        target: 'http://localhost:5002',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
});
