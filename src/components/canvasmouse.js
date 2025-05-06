import { html, onMount, onUnmount} from 'mini'
import {debounce} from '../js/tools.js'

//el: element to "cover" with mouse grid
//initpoints: Array of points to map [[pt1_x,pt1_y],[...]]
export default function canvasMouse(el, initpoints, onUpdate, onReset){


    onMount(()=>{
      mousecontainer.addEventListener("pointerdown", dragstart);
      ctx = mousecanvas.getContext('2d'); //if we want to draw on it
      draw()
    })

    onUnmount(()=>{
      mousecontainer.removeEventListener("pointerdown", dragstart);
    })

    let dragging=false
    let pointselected

    const pointsize=45
    let points = initpoints.slice(0) // [[0.25,0.25], [0.75,0.25], [0.75,0.75],[0.25,0.75]]

    //position mousecontainer over element
    const {top,left}=el.getBoundingClientRect()
    let w = el.offsetWidth,
        h = el.offsetHeight
    let ctx, offset


    function dragstop(e){
      dragging=false
      pointselected=undefined
      mousecontainer.releasePointerCapture(e.pointerId)
      mousecontainer.removeEventListener("pointermove", drag);
      mousecontainer.removeEventListener("pointerup", dragstop);    

    }

    function dragstart(e){
      dragging=true
      const el = document.elementFromPoint(e.x,e.y)
      if(el.id.startsWith('mouse')) {
        pointselected=parseInt(el.id.replace('mouse',''))
      }
      mousecontainer.setPointerCapture(e.pointerId)
      mousecontainer.addEventListener("pointermove", drag);
      mousecontainer.addEventListener("pointerup", dragstop);
      const {left,top} = el.getBoundingClientRect()
      offset = {left,top}
      mousePos(e)
    }

    function clamp(min,val,max){
      return Math.max(min, Math.min(max, val));
    }
    function mousePos(e){
        //limit point movements
        var x = clamp(0,(e.offsetX) / w,1)
        var y = clamp(0,(e.offsetY) / h,1)
        points[pointselected] = [x,y]      
    }
    function drag(e){
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
        pt.style.left=e[0]*w-pt.offsetWidth/2+'px'
        pt.style.top=e[1]*h-pt.offsetHeight/2+'px'
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
        #mousecanvas{width:${w}px;height:${h}px;overflow:hidden;border:0px solid white;}
        .point{position:absolute;background-color: white; width: ${pointsize}px;height: ${pointsize}px; border-radius: 50%;cursor:pointer;border: 15px solid transparent;background-clip: padding-box;box-sizing: border-box;}
      </style>
      <div id="mousecontainer" @dblclick="${reset}">
        <canvas id="mousecanvas" width="${w}" height="${h}"></canvas>
        ${points?.map((e,i)=>html`
            <div id="mouse${i}" class="point" style="left:${e[0]*w}px;top:${e[1]*h}px;"></div>
          `)}
      </div>
  `
}