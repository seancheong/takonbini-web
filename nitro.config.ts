import { defineNitroConfig } from 'nitro/config'

export default defineNitroConfig({
  preset: 'vercel',
  vercel: {
    functions: {
      regions: ['iad1'],
    },
  },
})
