import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Permite que el servidor sea accesible en toda tu red local
    host: '0.0.0.0', 
    // Añade el dominio de Ngrok a la lista de hosts permitidos
    allowedHosts: [
      'nonuterine-marry-nondictatorially.ngrok-free.dev'
    ],
  },
})