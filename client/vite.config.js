import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// The proxy sends /api calls to the Express server, so no CORS setup is needed
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: { '/api': { target: 'http://localhost:4000', xfwd: true } }, // xfwd passes the visitor's IP on
  },
})
