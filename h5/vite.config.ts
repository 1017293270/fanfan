import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'node:fs';

const devHost = process.env.VITE_DEV_HOST || '127.0.0.1';
const devPort = Number.parseInt(process.env.VITE_DEV_PORT || '5173', 10);
const apiProxyTarget = process.env.VITE_API_PROXY_TARGET || 'http://127.0.0.1:8787';
const httpsKeyPath = process.env.VITE_DEV_HTTPS_KEY;
const httpsCertPath = process.env.VITE_DEV_HTTPS_CERT;
const httpsConfig =
  httpsKeyPath && httpsCertPath
    ? {
        key: readFileSync(httpsKeyPath),
        cert: readFileSync(httpsCertPath)
      }
    : undefined;

export default defineConfig({
  plugins: [react()],
  server: {
    host: devHost,
    port: devPort,
    allowedHosts: ['.trycloudflare.com'],
    https: httpsConfig,
    proxy: {
      '/api': apiProxyTarget
    }
  }
});
