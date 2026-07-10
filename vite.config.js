import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import pkg from './package.json'
import fs from 'fs'
import path from 'path'

function serveTools() {
  return {
    name: 'serve-tools',
    configureServer(server) {
      server.middlewares.use('/tools', (req, res, next) => {
        const filePath = path.join(process.cwd(), 'tools', req.url === '/' ? '/matcher/index.html' : req.url)
        try {
          const content = fs.readFileSync(filePath)
          const ext = path.extname(filePath)
          const mime = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css' }
          res.setHeader('Content-Type', mime[ext] || 'application/octet-stream')
          res.end(content)
        } catch { next() }
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), serveTools()],
  base: '/xam-xam/',
  publicDir: 'public',
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
})
