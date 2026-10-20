import { defineNitroConfig } from 'nitro/config'

export default defineNitroConfig({
  preset: 'vercel',
  routes: {
    '/api/image': './src/server/product-image-handler.ts',
    '/api/share-image': './src/server/product-share-image-handler.ts',
  },
  vercel: {
    functions: {
      regions: ['hnd1'],
    },
  },
})
