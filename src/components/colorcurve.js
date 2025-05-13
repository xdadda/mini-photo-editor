import { html, reactive, onMount, onUnmount} from '@xdadda/mini'
import {Spline} from '@xdadda/mini-gl'
import './colorcurve.css'
import { debounce } from '../js/tools.js'

export default function CC(curve, onUpdate){

    const size=256
    const pointsize=45
    const numpoints = reactive(curve?.numpoints || 5)

    let colorspace = curve?.space || 0  //0=all, 1=R, 2=G, 3=B,
    let points = curve?.curvepoints || new Array(4).fill(null) //one for each colorspace

    //setup monitoring of which colorspace is modified or not
    let modified = new Array(4)
    points.forEach((e,i)=>{
      if(!e) modified[i]=null
      else modified[i]=true
    })

    function resetOne(space){
      points[space]=[]
      for (let i=0; i<numpoints._value;i++){
        const x = i/(numpoints._value-1)
        points[space].push([x,x])
      }
      modified[space]=null
    }
    function dblclick(){
      resetOne(colorspace)
      draw()
    }

    if(!points[colorspace]?.length) resetOne(colorspace)

    let w, h, c
    onMount(()=>{
      curvecontainer.addEventListener("pointerdown", dragstart);
      w = curvescanvas.offsetWidth
      h = curvescanvas.offsetHeight
      c = curvescanvas.getContext('2d');

      setColorSpace('space'+colorspace)

      curve.resetFn = ()=>{
        //RESET EVERYTHING
        curve.space=0
        curve.curvepoints= null //[null,null,null,null]

        colorspace=0
        points=new Array(4).fill(null) 
        setColorSpace('space'+colorspace)
      };
    })

    onUnmount(()=>{
      curvecontainer.removeEventListener("pointerdown", dragstart);
    })  


    function setColorSpace(id){
      id=typeof id==='string'?id:this?.id
      const el=document.getElementById(id)
      if(!el) return //console.log('cant find',id)
      cccolors.getElementsByClassName('selected')[0]?.classList.remove('selected');
      el.classList.add('selected');

      colorspace=parseInt(id.replace('space',''))
      curve.space=colorspace
      if(points[colorspace]) {
        draw()
      }
      else {
        resetOne(colorspace);
        draw()
      }
    }


  /// CORE DRAWING & DRAGGING FUNCTIONS

    let dragging=false
    let pointselected

    function dragstop(e){
      dragging=false
      curvecontainer.releasePointerCapture(e.pointerId)
      curvecontainer.removeEventListener("pointermove", drag);
      curvecontainer.removeEventListener("pointerup", dragstop);    
      pointselected=undefined
    }

    function dragstart(e){
      dragging=true
      curvecontainer.setPointerCapture(e.pointerId)
      curvecontainer.addEventListener("pointermove", drag);
      curvecontainer.addEventListener("pointerup", dragstop);

      w = curvescanvas.offsetWidth
      h = curvescanvas.offsetHeight

      const el = document.elementFromPoint(e.x,e.y)
      if(el.id.startsWith('pt')) {
        pointselected=parseInt(el.id.replace('pt',''))
      }
      modified[colorspace]=true 
      mousePos(e)
    }

    function clamp(min,val,max){
      return Math.max(min, Math.min(max, val));
    }
    function mousePos(e){
        //limit point movements
        const minx = pointselected ? points[colorspace][pointselected-1][0]+0.1 : 0
        const maxx = pointselected<numpoints._value-1 ? points[colorspace][pointselected+1][0]-0.1 : 1
        var x = clamp(minx,(e.offsetX) / w,maxx)
        var y = clamp(0,1 - (e.offsetY) / h,1)
        points[colorspace][pointselected] = [x,y]
    }


    function drag(e){
      if(dragging && pointselected!==undefined){
        mousePos(e)
        debounce('curve',()=>draw(),20)
      }
    }


    function draw(){
      if(!points?.[colorspace]) return
      //position draggable points
      points[colorspace].forEach((e,i)=>{
        const pt = document.getElementById('pt'+i)
        pt.style.left=e[0]*w-pointsize/2+'px'
        pt.style.bottom=e[1]*h-pointsize/2+'px'
      })

      //draw spline
      const xs = points[colorspace].map(e=>e[0])
      const ys = points[colorspace].map(e=>e[1])
      //const spline = new Spline(xs,ys);
      const spline = new Spline(points[colorspace]);

      let y //,curve=[]
      c.clearRect(0, 0, size, size);
      c.lineWidth = 4;
      c.strokeStyle = '#4B4947';
      c.beginPath();
      for (var i = 0; i < size; i++) {
          if(i<xs[0]*size) y=ys[0]
          else if(i>xs[xs.length-1]*size) y=ys[ys.length-1]
          else y = clamp(0,spline.at(i / (size-1)),1)
          //curve.push(y)
          c.lineTo(i, (1 - y ) * size);
      }
      c.stroke();
      c.fillStyle = 'white';
      if(onUpdate) onUpdate(points,modified)
    }


  return html`
      <style>
        #curvecontainer{position: relative;width:200px;height: 120px;margin:auto;background-image: radial-gradient(#5b5b5b 1px, transparent 0);background-size: 10% 10%;border-radius: 10px;border: 1px solid #5b5b5b;}
        #curvescanvas{width:inherit;height: inherit;overflow:hidden;border:0px solid white;}
        .point{position:absolute;background-color: white; width: ${pointsize}px;height: ${pointsize}px; border-radius: 50%;cursor:pointer;border: 17px solid transparent;background-clip: padding-box;box-sizing: border-box;}
      </style>
      <div id="cccolors" style="display:flex;flex-direction:row; max-width:275px;">
        <div style="width:60px;">
          <button id="space0" @click="${setColorSpace}" class="clrspace selected" style="border-color:white;" title="all colors"></button>
          <button id="space1" @click="${setColorSpace}" class="clrspace" style="border-color:#c13119;" title="red"></button>
          <button id="space2" @click="${setColorSpace}" class="clrspace" style="border-color:#0c9427;" title="green"></button>
          <button id="space3" @click="${setColorSpace}" class="clrspace" style="border-color:#1e73be;" title="blue"></button>
        </div>
        <div id="curvecontainer" @dblclick="${dblclick}">
          <canvas id="curvescanvas" width=${size} height=${size}></canvas>
          ${()=>numpoints.value && points[colorspace]?.map((e,i)=>html`
              <div id="pt${i}" class="point"></div>
            `)}
        </div>
      </div>
  `
}



