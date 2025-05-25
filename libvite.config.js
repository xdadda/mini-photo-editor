import { defineConfig } from 'vite'
import { minifyTemplateLiterals } from "rollup-plugin-minify-template-literals";
import path from "path";

import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig(({isSsrBuild, mode})=>{

return {
    plugins: [
        {...minifyTemplateLiterals(),apply:'build'}
      ],
    build: {
      target: 'esnext',
      minify: true, //in production to reduce size
      sourcemap: false, //unless required during development to debug production code artifacts
      modulePreload: { polyfill: false }, //not needed for modern browsers
      cssCodeSplit:false, //if small enough it's better to have it in one file to avoid flickering during suspend
      lib: {
        entry: {
          'mini-img-editor':resolve(__dirname, 'src/app.js'),
        },
        name: 'mini-img-editor',
      }, 
      outDir: path.join(__dirname, "lib"),
      rollupOptions: {
        // make sure to externalize deps that shouldn't be bundled
        // into your library
        // external: ['@xdadda/mini','@xdadda/mini/store','@xdadda/mini/components','@xdadda/mini/components.css','@xdadda/mini/router','@xdadda/mini-exif','@xdadda/mini-gl','ismobilejs'],
      }
    }
  }
})
