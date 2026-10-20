import { defineNitroConfig } from 'nitro/config'

export default defineNitroConfig({
  preset: 'vercel',
  routes: {
    '/api/image': './src/server/product-image-handler.ts',
  },
  vercel: {
    functions: {
      regions: ['hnd1'],
    },
  },
})
