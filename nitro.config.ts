import { defineNitroConfig } from 'nitro/config'

export default defineNitroConfig({
  preset: 'vercel',
  plugins: ['./src/server/diagnostic-timing.ts'],
  routes: {
    '/api/image': './src/server/product-image-handler.ts',
  },
  vercel: {
    functions: {
      regions: ['hnd1'],
    },
  },
})
