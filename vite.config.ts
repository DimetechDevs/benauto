import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// base './' makes the build work at any GitHub Pages path (user.github.io/benauto/).
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
})
