import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const base =
  process.env.GITHUB_REPOSITORY !== undefined
    ? `/${process.env.GITHUB_REPOSITORY.split('/')[1]}/`
    : '/'

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [react()],
})
