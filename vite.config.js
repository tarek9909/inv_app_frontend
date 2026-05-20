import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const validateProductionEnv = (mode) => {
  if (mode !== 'production') return;

  const env = loadEnv(mode, process.cwd(), '');
  const apiBaseUrl = env.VITE_API_BASE_URL;

  if (!apiBaseUrl) {
    throw new Error('VITE_API_BASE_URL is required for production builds');
  }

  try {
    const url = new URL(apiBaseUrl);
    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new Error('unsupported protocol');
    }
  } catch {
    throw new Error('VITE_API_BASE_URL must be a valid http(s) URL');
  }
};

export default defineConfig(({ mode }) => {
  validateProductionEnv(mode);

  return {
    plugins: [react()],
    server: {
      port: 5173,
      host: true
    },
    preview: {
      port: 4173,
      host: true
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            react: ['react', 'react-dom', 'react-router-dom'],
            motion: ['framer-motion'],
            icons: ['lucide-react']
          }
        }
      }
    }
  };
});
