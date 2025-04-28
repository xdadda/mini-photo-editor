import { html, reactive, onMount, onUnmount} from 'mini'


export default function Quad(canvas, params, onUpdate){



    onMount(()=>{
      quadcontainer.addEventListener("pointerdown", dragstart);
      quadcanvas.width=canvas.width
      quadcanvas.height=canvas.height
      w = canvas.offsetWidth
      h = canvas.offsetHeight
      c = quadcanvas.getContext('2d');
      quadcontainer.style.width=w+'px'
      quadcontainer.style.height=h+'px'
      draw()
      params.resetFn=resetQuad
    })

    onUnmount(()=>{
      quadcontainer.removeEventListener("pointerdown", dragstart);
    })

    let dragging=false
    let pointselected
    let points = params?.quad || [[0.25,0.25], [0.75,0.25], [0.75,0.75],[0.25,0.75]]
    //let points = params?.quad || [[0,0], [1,0], [1,1], [0,1]]

    const pointsize=10
    let w, h, c, offset

    function dragstop(e){
      dragging=false
      pointselected=undefined
      quadcontainer.releasePointerCapture(e.pointerId)
      quadcontainer.removeEventListener("pointermove", drag);
      quadcontainer.removeEventListener("pointerup", dragstop);    

    }

    function dragstart(e){
      dragging=true
      params.modified=true
      const el = document.elementFromPoint(e.x,e.y)
      if(el.id.startsWith('qpt')) {
        pointselected=parseInt(el.id.replace('qpt',''))
      }
      quadcontainer.setPointerCapture(e.pointerId)
      quadcontainer.addEventListener("pointermove", drag);
      quadcontainer.addEventListener("pointerup", dragstop);
      const {left,top} = canvas.getBoundingClientRect()
      offset = {left,top}
    }

    function clamp(min,val,max){
      return Math.max(min, Math.min(max, val));
    }

    function drag(e){
      if(dragging && pointselected!==undefined){

        //limit point movements
        var x = clamp(0,(e.offsetX) / w,1)
        var y = clamp(0,(e.offsetY) / h,1)
        points[pointselected] = [x,y]
        draw()
      }
    }

    function draw(){
      //position draggable points
      points.forEach((e,i)=>{
        const pt = document.getElementById('qpt'+i)
        pt.style.left=e[0]*w-pointsize/2+'px'
        pt.style.top=e[1]*h-pointsize/2+'px'
      })

      c.fillStyle = "blue";
      c.clearRect(0, 0, canvas.width, canvas.height);
      c.lineWidth = 8;
      c.strokeStyle = 'red';
      c.beginPath();
      for (var i = 0; i < 4; i++) {
          const x = points[i][0]*canvas.width
          const y = points[i][1]*canvas.height
          c.lineTo(x,y)
      }
      c.closePath();
      c.stroke();
      toggleResetComposition()
      if(params.quad!==undefined) params.quad=points //.map(e=>[e[0]*canvas.width,e[1]*canvas.height])
      if(onUpdate) onUpdate()
    }

    function resetQuad(){
      params.modified=false
      points = [[0.25,0.25], [0.75,0.25], [0.75,0.75],[0.25,0.75]]
      draw()
    }

    ////this is a UI hack, need to change a button outside of this component ... sorry
    function toggleResetComposition(){      
      if(params.modified==0) btn_reset_perspective.setAttribute('disabled',true)
      else btn_reset_perspective.removeAttribute('disabled')
    }


  return html`
      <style>
        #quadcontainer{position: absolute;}
        #quadcanvas{width:inherit;height: inherit;overflow:hidden;border:0px solid white;background-image: repeating-linear-gradient(#ccc 0 1px, transparent 1px 100%), repeating-linear-gradient(90deg, #ccc 0 1px, transparent 1px 100%);background-size: 9.99% 9.99%;}
        .point{position:absolute;background-color: white; width: ${pointsize}px;height: ${pointsize}px; border-radius: 50%;cursor:pointer;}
      </style>
      <div id="quadcontainer" @dblclick="${resetQuad}">
        <canvas id="quadcanvas"></canvas>
        ${points?.map((e,i)=>html`
            <div id="qpt${i}" class="point"></div>
          `)}
      </div>
  `
}