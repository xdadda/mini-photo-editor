import { defineConfig, loadEnv } from 'vite'
import { minifyTemplateLiterals } from "rollup-plugin-minify-template-literals";

export default defineConfig(({isSsrBuild, mode})=>{

return {
    plugins: [
        {...minifyTemplateLiterals(),apply:'build'}
      ],
    resolve: {
      alias: [
      ],
    },
    build: {
      target: 'esnext',
      minify: true, //in production to reduce size
      sourcemap: false, //unless required during development to debug production code artifacts
      modulePreload: { polyfill: false }, //not needed for modern browsers
      cssCodeSplit:false, //if small enough it's better to have it in one file to avoid flickering during suspend
      copyPublicDir: isSsrBuild?false:true,
      
      rollupOptions: {
        output: {
          manualChunks: { mini: ['@xdadda/mini','@xdadda/mini/store'] } 
        }
      }
    },
  }
})
