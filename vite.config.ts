import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: process.env.GITHUB_PAGES === 'true' ? '/Smart-PromptCreator/' : '/',
  plugins: [react()],
  clearScreen: false,
  server: {
    port: 5173,
    strictPort: false
  },
  envPrefix: ['VITE_']
});
