import { html, onMount, onUnmount} from 'mini'
import filterMouse from './filtermouse.js'

export default function Quad(canvas, params, onUpdate){

    let zeropoints = [[0.25,0.25], [0.75,0.25], [0.75,0.75],[0.25,0.75]]
    let initpoints = params?.quad || zeropoints

    function drawQuad(points, ctx){
      ctx.clearRect(0, 0, mousecanvas.width, mousecanvas.height);
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'red';
      ctx.beginPath();
      for (var i = 0; i < 4; i++) {
          const x = points[i][0]*mousecanvas.width
          const y = points[i][1]*mousecanvas.height
          ctx.lineTo(x,y)
      }
      ctx.closePath();
      ctx.stroke();
      if(params.quad!==undefined) params.quad=points
      if(onUpdate) onUpdate()
    }

    function resetQuad(points){
      return zeropoints
    }


  return html`
      <style>
        #mousecanvas{background-image: repeating-linear-gradient(#ccc 0 1px, transparent 1px 100%), repeating-linear-gradient(90deg, #ccc 0 1px, transparent 1px 100%);background-size: 9.99% 9.99%;}
      </style>
      ${filterMouse(canvas, initpoints, drawQuad, resetQuad)}
  `
}