import { html, reactive, onMount, onUnmount } from '@xdadda/mini'
import section from './__section.js'
//import {debounce} from './js/tools.js'
//import InpaintTelea from './js/inpaint.js'

//el: element to "cover" with mouse grid
function healer(el, params, onPointerUp){

    const {top,left,width:ow,height:oh}=el.getBoundingClientRect()
    //let ow = el.offsetWidth, oh = el.offsetHeight
    let w = el.width, h = el.height,
        scale = ow / w,
        ctx, offset, dragging = false,
        mousepos,
        brushrad = 10

    const inpaintmask = params.heal.healmask || new Uint8Array(w * h).fill(0)
    const arr = new Uint8ClampedArray(w*h*4);

    for(var i = 0; i < inpaintmask.length; i++){
        arr[i*4+0]=0
        arr[i*4+1]=190
        arr[i*4+2]=0
        arr[i*4+3]=inpaintmask[i] ? 128 : 0 //transparent
    }
    const maskimage = new ImageData(arr,w,h)

    onMount(()=>{
        mousecontainer.addEventListener("pointerdown", dragstart);
        mousecontainer.addEventListener("pointermove", dragmove);
        mousecontainer.style.height=pannable.getBoundingClientRect().height+'px'
        mousecontainer.style.width=pannable.getBoundingClientRect().width+'px'
        mousecanvas.style.width=canvas.style.width
        mousecanvas.style.height=canvas.style.height
        ctx = mousecanvas.getContext('2d'); //if we want to draw on it
        ctx.putImageData(maskimage, 0, 0);
        editor.appendChild(mousecontainer) //move mousecontainer inside pannable div
    })
    onUnmount(()=>{
        mousecontainer.removeEventListener("pointerdown", dragstart);
        mousecontainer.removeEventListener("pointermove", dragmove);
        mousecontainer.remove()
    })

    function clamp(min,val,max){
        return Math.max(min, Math.min(max, val));
    }
    function mousePos(e){
        //limit point movements
        let x = clamp(0,(e.offsetX) / ow,1)
        let y = clamp(0,(e.offsetY) / oh,1)
        mousepos = [x,y]
    }
    function dragstart(e){
        dragging=true
        mousecontainer.setPointerCapture(e.pointerId)
        mousecontainer.addEventListener("pointerup", dragstop);
        draw()
    } 
    function dragstop(e){
        dragging=false
        mousecontainer.releasePointerCapture(e.pointerId)
        mousecontainer.removeEventListener("pointerup", dragstop);
        if(onPointerUp) onPointerUp(inpaintmask)
    }

    function dragmove(e){
        const el = document.elementFromPoint(e.x,e.y)
        if(el.id!=='mousecanvas') return
        if(dragging){
          mousePos(e)
          draw()
          //debounce('mouse',()=>draw(),20)
        }
        else {
          //hovering
          mousePos(e)
          hover()
        }
    }

    function hover(){
        if(!mousecursor.style.display || mousecursor.style.display==='none') mousecursor.style.display='unset'
        const e = mousepos
        const pt = document.getElementById('mousecursor')
        const left = e[0]*ow-pt.offsetWidth/2+'px'
        const top = e[1]*oh-pt.offsetHeight/2+'px'
        if(pt.style.left!==left) pt.style.left=left
        if(pt.style.top!==top) pt.style.top=top

    }


    function draw(){
        const imgpos = [ Math.round(mousepos[0]*w), Math.round(mousepos[1]*h)]

        //set mask
        var rad = Math.round(brushrad/scale)
        const i = Math.round(imgpos[0]+imgpos[1]*w)
        //console.log('brush',rad)
        for(var dx = -rad; dx <= rad; dx++){
          for(var dy = -rad; dy <= rad; dy++){
            if(dx * dx + dy * dy <= rad * rad){
              inpaintmask[i + dx + dy * w] = 1;
              maskimage.data[(i + dx + dy * w)*4+3]=128 //semitransparent
            }
          }
        }
        ctx.putImageData(maskimage, 0, 0);
        hover()
    }

    return html`
        <style>
          #mousecontainer{position: fixed;top:${top}px;left:${left}px;width:${w}px;height:${h}px;}
          #mousecanvas{overflow:hidden;border:0px solid white;}
          #mousecursor{position:absolute;border:2px solid darkorange;border-radius:50%;width:${brushrad*2}px;height:${brushrad*2}px;pointer-events:none;display:none;}
        </style>
          <div id="mousecontainer">
            <canvas id="mousecanvas" width="${w}" height="${h}"></canvas>
            <div id="mousecursor"></div>
          </div>
    `
}

/*

        <div id="mousezoomable"><div id="mousepannable">
        </div></div>

*/

export default function heal($selection, params, onUpdate){

  let save_btn_disabled=true
  let prevselection


  reactive(()=>{
    if($selection.value==="heal"){
      prevselection='heal'
    }
    else {
      if(prevselection==='heal'){
       // console.log('unmount heal')
        //pannable.appendChild(mousecontainer) //move mousecontainer inside pannable div

      }
    }
  },{effect:true})
  /////////////////////////////

  function onPointerUp(mask_u8){
    params.heal.healmask=mask_u8
    params.heal.healit=true


      onUpdate()

    updateResetBtn('heal')
      /*
      var c = document.createElement('canvas')
      c.style.position='absolute'
      c.style.top='0px'
      c.width = w;
      c.height = h;
      document.body.appendChild(c)
      var ctx = c.getContext('2d');
      // render result back to canvas
      ctx.putImageData(newimgdata, 0, 0);
      */
  }

  function clearMask(){
    //console.log('clearMask')
    params.heal.healmask=null
    params._minigl.resetImage()
    onUpdate()
    const mousecanvas=document.getElementById('mousecanvas')
    if(mousecanvas){
      const ctx = mousecanvas.getContext('2d'); //if we want to draw on it
      ctx.clearRect(0, 0, mousecanvas.width, mousecanvas.height);      
    }
    //litle hack to reset healer
    $selection.value=null
    $selection.value='heal'
  }


  const switchlabel=reactive('hide')
  function handleSwitch(e){
    if(e.target.checked){
      mousecanvas.style.opacity=1
      switchlabel.value='hide'
    }
    else {
      mousecanvas.style.opacity=0
      switchlabel.value='show'
    }
  }


  ///// SECTION HANDLING FN ////////
    function checkParamszero(section) {
      if(params.heal.healmask) return false
      else return true
    }

    function resetSection(section){
      clearMask()
      updateResetBtn(section)
    }

    function updateResetBtn(section){
      const el=document.getElementById('btn_reset_'+section)
      if(!el) return
      //if all section's params are set to default values disable reset
      if(checkParamszero(section)) el.setAttribute('disabled',true)
      else el.removeAttribute('disabled')
    }


  return html`
    ${section(
      'heal', 
      70, 
      $selection,       //signal with active sectioname, that opens/closes section
      params,           //section's params obj of which $skip field will be set on/off
      null,             //called when section is enabled/disabled; null to hide disable button
      resetSection,             //section name provided to onReset
      ()=>html` 
        ${()=>healer(canvas, params, onPointerUp)}
<style>
.switch {
  position: relative;
  display: inline-block;
  width: 60px;
  height: 34px;
}

.switch input { 
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  -webkit-transition: .4s;
  transition: .4s;
}

.slider:before {
  position: absolute;
  content: "";
  height: 26px;
  width: 26px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  -webkit-transition: .4s;
  transition: .4s;
}

input:checked + .slider {
  background-color: light-dark(#b6b5b5,#191919);
}

input:focus + .slider {
  box-shadow: 0 0 1px light-dark(#b6b5b5,#191919);
}

input:checked + .slider:before {
  -webkit-transform: translateX(26px);
  -ms-transform: translateX(26px);
  transform: translateX(26px);
}

/* Rounded sliders */
.slider.round {
  border-radius: 34px;
}
.slider.round:before {
  border-radius: 50%;
}

</style>
        <div style="text-align:left; color:grey;">
          <label style="width:80px;display: inline-block;">${()=>switchlabel.value} mask:</label>
          <label class="switch" style="transform: scale(0.7);">
            <input type="checkbox" checked @change="${handleSwitch}">
            <span class="slider round"></span>
          </label>
          <br>
        </div>
      `)}
  `
}

//          <button @click="${clearMask}">clear</button>




