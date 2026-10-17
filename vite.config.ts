import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import viteTsConfigPaths from 'vite-tsconfig-paths'
import { nitro } from 'nitro/vite'
import stylex from '@stylexjs/unplugin'
import { Features } from 'lightningcss'

const config = defineConfig({
  plugins: [
    devtools(),
    nitro(),
    // this is the plugin that enables path aliases
    viteTsConfigPaths({
      projects: ['./tsconfig.json'],
    }),
    stylex.vite({
      runtimeInjection: false,
      useCSSLayers: true,
      devMode: 'css-only',
      lightningcssOptions: { exclude: Features.Colors },
    }),
    tanstackStart(),
    viteReact(),
  ],
})

export default config
