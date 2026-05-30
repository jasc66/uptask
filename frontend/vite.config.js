import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // frappe-gantt v1.2.2 no expone su CSS via "exports", lo cual rompe la
      // resolución estricta de pnpm. Apuntamos directo al archivo dentro del
      // symlink del paquete.
      'frappe-gantt/dist/frappe-gantt.css': path.resolve(
        __dirname,
        'node_modules/frappe-gantt/dist/frappe-gantt.css'
      ),
    },
  },
})
