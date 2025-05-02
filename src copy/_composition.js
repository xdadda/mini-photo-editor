import { render, html, reactive, onMount } from 'mini'
import icon_rotate from './assets/icon_rotate.svg?raw'
import icon_flip from './assets/icon_flip.svg?raw'

import Quad from './components/perspective.js'


export default function composition($selection, handleSelection,  adj, onUpdate, get_minigl, centerCanvas){
  let _minigl
  let prevselection

  reactive(()=>{
    if($selection.value==='composition'){
      _minigl=get_minigl()
      //set current aspect ratio
      arsvalues[1]=_minigl.gl.canvas.width/_minigl.gl.canvas.height
      arsvalues[2]=1/arsvalues[1]
      _minigl.resetCrop()
      updateCanvasAngle()
      onUpdate()
      prevselection=$selection.value
      updateResetBtn()
    }
    else {
      if(prevselection==='composition') {
        updateResetBtn()
        hidePerspective()
        prevselection=undefined
      }
    }
  },{effect:true})



  ///// CROP
  
    function resetComposition(){
      const croprect = document.getElementById('croprect')
      if(!croprect) return

        Object.keys(adj['crop']).forEach(e=>{
          adj['crop'][e]=0
        })
        setCropAR(0)
        updateCanvasAngle()
  
        Object.keys(adj['trs']).forEach(e=>{
          adj['trs'][e]=0
          setTRSCtrl('trs_'+e)
        })

        const fliph=document.getElementById('fliph')
        const flipv=document.getElementById('flipv')
        fliph.removeAttribute('selected')
        flipv.removeAttribute('selected')

        if(adj.perspective?.resetFn) adj.perspective.resetFn()
        hidePerspective()

        resetCropRect()
        updateResetBtn()

        //showCrop()
        onUpdate()
    }

    function resetCropRect(currentc){
      const crop = document.getElementById('crop')
      const croprect=document.getElementById('croprect')
      crop.style.width= Math.round(canvas.getBoundingClientRect().width)+'px'
      crop.style.height = Math.round(canvas.getBoundingClientRect().height)+'px'
      if(adj.crop.ar) croprect.style.aspectRatio=adj.crop.ar
      croprect.style.inset='0'
      adj.crop.currentcrop=0
    }


    function flip(dir){
      if(dir==='v') {
        adj.trs.flipv=!adj.trs.flipv
        if(adj.trs.flipv) flipv.setAttribute('selected',true) 
        else flipv.removeAttribute('selected')
      }
      else {
        adj.trs.fliph=!adj.trs.fliph
        if(adj.trs.fliph) fliph.setAttribute('selected',true) 
        else fliph.removeAttribute('selected')
      }
      updateResetBtn()
      onUpdate()
    }

    function updateCanvasAngle(){
      if(adj.crop.canvas_angle%180){
        const {width,height} = _minigl.img
        _minigl.gl.canvas.width=height
        _minigl.gl.canvas.height=width
        _minigl.setupFiltersTextures() //recreacte working textures with new canvas size!        
      }
      else {
        const {width,height} = _minigl.img
        _minigl.gl.canvas.width=width
        _minigl.gl.canvas.height=height
        _minigl.setupFiltersTextures() //recreacte working textures with new canvas size!
      }
      //ensure canvas is centered
      centerCanvas()
    }

    function rotateCanvas(deg){
      adj.crop.canvas_angle = (adj.crop.canvas_angle+deg) % 360
      updateCanvasAngle()
      //reset crop view
      crop.style.width= Math.round(canvas.getBoundingClientRect().width)+'px'
      crop.style.height = Math.round(canvas.getBoundingClientRect().height)+'px'
      croprect.style.inset='0'

      updateResetBtn()
      onUpdate()
    }

    function updateResetBtn(){
      const flag = Object.values(adj.trs).reduce((p,v)=>p+=v,0)===0 && Object.values(adj.crop).reduce((p,v)=>p+=v,0)===0 && adj.perspective.modified==0
      if(flag) btn_reset_comp.setAttribute('disabled',true)
      else btn_reset_comp.removeAttribute('disabled')
    }

    const ars=['free','pic','1:pic','1:1','4:3','16:9','3:4','9:16']
    let arsvalues=[0,0,0,1,4/3,16/9,3/4,9/16]
    function setCropAR(idx){
      adj.crop.arindex=idx
      adj.crop.ar=arsvalues[idx]
      if(croprect) croprect.style.aspectRatio=arsvalues[idx]
      const aspects = document.getElementById('aspects')
      if(aspects){
        aspects.querySelector('[selected]')?.removeAttribute('selected')
        aspects.querySelector('#ar_'+idx)?.setAttribute('selected',true)     
      }
      updateResetBtn()
    }
  /////////////////

  ///// ROTATE CANVAS
    function setTRS(e){ //id= "section:adj"
      const value = e.target.value
      const id = this.id.split('_')
      adj[id[0]][id[1]]=parseFloat(value)
      if(id.length===3){//it's the number input
        this.previousElementSibling.value=value
      }
      else {//it's the range input
        this.nextElementSibling.value=value
      }

      if(id[1]==='angle'){
        const rad = parseFloat(Math.abs(value)) * Math.PI / 180.0
        const newwidth=canvas.width*Math.cos(rad)+canvas.height*Math.sin(rad)
        const newheight=canvas.width*Math.sin(rad)+canvas.height*Math.cos(rad)
        const zoom=Math.max(newwidth/canvas.width-1, newheight/canvas.height-1)
        adj.trs.scale=zoom
        updateResetBtn()
        //setAdjCtrl('trs_scale')
      }
      onUpdate()
    }


    function setTRSCtrl(_id){
      const el = document.getElementById(_id)
      if(!el) return
      const id = _id.split('_')
      el.value=adj[id[0]][id[1]]
      el.nextElementSibling.value=el.value
    }

    function resetTRSCtrl(){
      if(!this) return
      const id = this.id.split('_')
      adj[id[0]][id[1]]=0
      setTRSCtrl(this.id)
      
      if(id[1]==='angle'){
        adj.trs.scale=0
      }
      
      updateResetBtn()
      onUpdate()
    }
  /////////////////

  ///// PERSPECTIVE
    let persp=reactive(false)
    let perspel
    async function showPerspective(){
      persp.value=true
      perspel = await render(plcquad,()=>Quad(canvas,adj,()=>{updateResetBtn();onUpdate()}))
      crop.style.display='none'
    }
    function hidePerspective(){
      if(!perspel) return
      perspel.destroy()
      perspel=undefined
      const crop=document.getElementById('crop')
      if(crop) crop.style.display='' //will be set by handleCrop
      persp.value=false
    }
    function togglePerspective(){
      if(persp.value) hidePerspective()
      else showPerspective()
    }
  /////////////////

  return html`
    <style>
      .crop_btn {
        width: 38px;
        color: light-dark(black,white);
        padding: 0;
        margin: 2px;
        border-radius:50%;
        fill: white;
        stroke: white;
      }
    </style>
    <div class="section" id="composition" :style="${()=>$selection.value==='composition'&&'height:225px;'}">
        <div class="section_header" @click="${()=>$selection.value = 'composition'}">
          <b class="section_label">composition</b>
          <a id="btn_reset_comp" class="reset_btn" @click="${resetComposition}" disabled title="reset">\u00D8</a>
        </div>

        ${()=>$selection.value==='composition' && html`
          <div>
            <hr>

            <div style="display:flex;justify-content: space-around;align-items: center;">
              <label style="width:100px;text-align:left;color:gray;">rotate</label>
              <input id="trs_angle" style="width:130px;" type="range" value="${adj['trs']['angle']}" min=-45 max=45 step=0.25 @input="${setTRS}" @dblclick="${resetTRSCtrl}"/>
              <input id="trs_angle_" type="number" class="rangenumb" step=0.25 min=-45 max=45 value="${adj['trs']['angle']}" @input="${setTRS}">
            </div>

            <div style="display:flex;justify-content: flex-end;color:grey; margin-right: 3px;">
              <button id="fliph" class="crop_btn" title="flip x" selected="${!!adj.trs.fliph}" @click="${()=>flip('h')}">${icon_flip}</button>
              <button id="flipv" class="crop_btn" title="flip y" selected="${!!adj.trs.flipv}" @click="${()=>flip('v')}" style="rotate: 270deg;">${icon_flip}</button>
              <button class="crop_btn" title="rotate left" @click="${()=>rotateCanvas(-90)}">${icon_rotate}</button>

            </div>
            <hr>
              <div style="text-align:left;" id="aspects">
                ${ars.map((e,i)=>html`
                  <button id="ar_${i}" @click="${()=>setCropAR(i)}" class="crop_btn" selected="${i===adj.crop.arindex }" @dblclick="${resetCropRect}">${e}</button>
                `)}
              </div>
            <hr>
              <button :selected="${()=>!!persp.value}" @click="${togglePerspective}">perspective</button>
          </div>
        `}
    </div>

  `
}
