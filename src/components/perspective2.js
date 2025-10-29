import { html, onMount, onUnmount} from '@xdadda/mini'
import canvasMouse from './canvasmouse.js'

export default function Perspective(canvas, params, onUpdate){

    let zeropoints = [[0.25,0.25], [0.75,0.25], [0.75,0.75],[0.25,0.75]]
    let initpoints = params?.after || params?.before || zeropoints
    let status = 0 //0 =drawing before, 1= drawing after
    if(params?.before) status=1 

    //console.log('perspective',status,initpoints)
    let firstdraw=true
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
      if(firstdraw) firstdraw=false
      else if(!params.modified) params.modified=true

      if(!status) params.before=points
      else {
        params.after=points
        if(onUpdate) onUpdate()
      }
    }

    function resetQuad(points){
      params.modified=false
      return zeropoints
    }


  return html`
      <style>
        #mousecanvas{border: 1px solid white;background-image: repeating-linear-gradient(#ccc 0 1px, transparent 1px 100%), repeating-linear-gradient(90deg, #ccc 0 1px, transparent 1px 100%);background-size: 9.99% 9.99%;}
      </style>
      ${canvasMouse(canvas, initpoints, drawQuad, resetQuad)}
  `
}