import { html, onMount, onUnmount} from '@xdadda/mini'
import {debounce} from '../js/tools.js'

//el: element to "cover" with mouse grid
//initpoints: Array of points to map [[pt1_x,pt1_y],[...]]
export default function canvasMouse(el, initpoints, onUpdate, onReset){

    const pointsize=45
    let points = initpoints.slice(0) // [[0.25,0.25], [0.75,0.25], [0.75,0.75],[0.25,0.75]]

    //position mousecontainer over element
    const {top,left}=el.getBoundingClientRect()
    let w = el.offsetWidth,
        h = el.offsetHeight
    let ctx, offset

    let dragging=false
    let pointselected


    onMount(()=>{
      mousecontainer.addEventListener("pointerdown", dragstart);
      ctx = mousecanvas.getContext('2d'); //if we want to draw on it
      draw()
    })

    onUnmount(()=>{
      mousecontainer.removeEventListener("pointerdown", dragstart);
    })

    function clamp(min,val,max){
      return Math.max(min, Math.min(max, val));
    }
    function mousePos(e){
        //limit point movements
        var x = clamp(0,(e.offsetX) / w,1)
        var y = clamp(0,(e.offsetY) / h,1)
        points[pointselected] = [x,y]      
    }


    function dragstop(e){
      dragging=false
      pointselected=undefined
      mousecontainer.releasePointerCapture(e.pointerId)
      mousecontainer.removeEventListener("pointermove", dragmove);
      mousecontainer.removeEventListener("pointerup", dragstop);

    }

    function dragstart(e){
      dragging=true
      const el = document.elementFromPoint(e.x,e.y)
      if(el.id.startsWith('mouse')) {
        pointselected=parseInt(el.id.replace('mouse',''))
      }
      mousecontainer.setPointerCapture(e.pointerId)
      mousecontainer.addEventListener("pointermove", dragmove);
      mousecontainer.addEventListener("pointerup", dragstop);
      const {left,top} = el.getBoundingClientRect()
      offset = {left,top}
      mousePos(e)
    }

    function dragmove(e){
      if(dragging && pointselected!==undefined){
        mousePos(e)
        debounce('mouse',()=>draw(),20)
      }
    }

    function draw(){
      if(!document.getElementById('mouse'+0)) return
      //position draggable points
      points.forEach((e,i)=>{
        const pt = document.getElementById('mouse'+i)
        const left = e[0]*w-pt.offsetWidth/2+'px'
        const top = e[1]*h-pt.offsetHeight/2+'px'
        if(pt.style.left!==left) pt.style.left=left
        if(pt.style.top!==top) pt.style.top=top
      })

      if(onUpdate) onUpdate(points,ctx)
    }

    function reset(){      
      if(onReset) points = onReset(points)
      else points = initpoints.slice(0)
      draw()
    }


  return html`
      <style>
        #mousecontainer{position: fixed;top:${top}px;left:${left}px;width:${w}px;height:${h}px;}
        #mousecanvas{overflow:hidden;border:0px solid white;}
        .point{position:absolute;width: ${pointsize}px;height: ${pointsize}px;background-color:white; border-radius: 50%;cursor:pointer;border: 15px solid transparent;background-clip: padding-box;box-sizing: border-box;}
      </style>
      <div id="mousecontainer" @dblclick="${reset}">
        <canvas id="mousecanvas" width="${w}" height="${h}"></canvas>
        ${points?.map((e,i)=>html`
            <div id="mouse${i}" style="left:${e[0]*w-pointsize/2}px;top:${e[1]*h-pointsize/2}px;" class="point" ></div>
          `)}
      </div>
  `
}