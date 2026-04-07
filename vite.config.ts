import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import dts from 'vite-plugin-dts'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    react(),
    dts({ include: ['src', 'types.ts'], exclude: ['src/test-app'] }),
  ],
  // Let dev server pick up .env from src/test-app when running `vite --root src/test-app`
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'DesignQA',
      formats: ['es', 'cjs'],
      fileName: (format) => `design-qa.${format === 'es' ? 'js' : 'cjs'}`,
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'react/jsx-runtime': 'ReactJsxRuntime',
        },
      },
    },
  },
})
