import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('react-leaflet') || id.includes('leaflet')) return 'maps';
          if (id.includes('@mui')) return 'mui';
          if (id.includes('recharts')) return 'charts';
          if (id.includes('lucide-react')) return 'icons';
          if (id.includes('motion')) return 'motion';
          if (id.includes('sonner')) return 'notifications';
          return 'vendor';
        }
      }
    }
  }
})
