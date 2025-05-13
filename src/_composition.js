import { html, reactive, onMount } from '@xdadda/mini'
import icon_rotate from './assets/icon_rotate.svg?raw'
import icon_flip from './assets/icon_flip.svg?raw'
import icon_skew from './assets/icon_skew.svg?raw'

import Quad from './components/perspective.js'
import section from './__section.js'


export default function composition($selection, adj, onUpdate, get_minigl, centerCanvas){
  let _minigl
  let prevselection

  reactive(()=>{

    if($selection.value==='composition'){
      _minigl=get_minigl()
      _minigl.resetCrop() //resetCrop will restore original/ resized image size
      
      //get current aspect ratio and save it in the pic - 1/pic AR settings
      arsvalues[1]=_minigl.gl.canvas.width/_minigl.gl.canvas.height
      arsvalues[2]=1/arsvalues[1]
      updateCanvasAngle()
      onUpdate()
      prevselection=$selection.value
    }
    else {
      if(prevselection==='composition') {
        hidePerspective()
        prevselection=undefined
        handleCrop()
      }
    }
  },{effect:true})

    async function handleCrop(){
      const params=adj
      if(!croprect) return //croprect is the DOM element with the crop size
      crop.style.display='' //if it was hidden by perspective
      const ratio=canvas.width/crop.offsetWidth
      params.crop.glcrop={
        left:Math.round((croprect.offsetLeft)*ratio),
        top:Math.round((croprect.offsetTop)*ratio),
        width:Math.round((croprect.offsetWidth)*ratio),
        height:Math.round((croprect.offsetHeight)*ratio)
      }
      onUpdate()
      centerCanvas()
    }

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
        
        Object.keys(adj['perspective']).forEach(e=>{
          adj['perspective'][e]=0
        })

        const fliph=document.getElementById('fliph')
        const flipv=document.getElementById('flipv')
        fliph.removeAttribute('selected')
        flipv.removeAttribute('selected')

        //if(adj.perspective?.resetFn) adj.perspective.resetFn()
        //persp.value=false
        hidePerspective()

        resetCropRect()
        resetResizer()
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



    function updateResetBtn(){
      const flag = Object.values(adj.trs).reduce((p,v)=>p+=v,0)===0 && Object.values(adj.crop).reduce((p,v)=>p+=v,0)===0 && adj.perspective.modified==0 && adj.resizer.width===0
      if(flag) btn_reset_composition.setAttribute('disabled',true)
      else btn_reset_composition.removeAttribute('disabled')
    }

    const ars=['free','pic','1:pic','1:1','4:3','16:9','3:4','9:16']
    let arsvalues=[0,0,0,1,4/3,16/9,3/4,9/16]
    function setCropAR(idx){
      hidePerspective()
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

    function updateCanvasAngle(){
      const {width,height} = _minigl
      if(adj.crop.canvas_angle%180){
        _minigl.gl.canvas.width=height
        _minigl.gl.canvas.height=width
      }
      else {
        _minigl.gl.canvas.width=width
        _minigl.gl.canvas.height=height
      }
      _minigl.setupFiltersTextures() //recreacte working textures with new canvas size!
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
        hidePerspective()

      updateResetBtn()
      onUpdate()
    }

    function setTRS(e){ //id= "section:adj"
      const value = e.target.value
      const id = this.id.split('_')
      adj[id[0]][id[1]]=parseFloat(value)
      if(id.length===3){//it's the number input
        this.nextElementSibling.value=value
      }
      else {//it's the range input
        this.previousElementSibling.value=value
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
      el.previousElementSibling.value=el.value
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
    //let perspel
    async function showPerspective(){
      persp.value=adj.perspective
      //perspel = await render(plcquad,()=>Quad(canvas,adj.perspective,()=>{updateResetBtn();onUpdate()}))
      crop.style.display='none'
    }
    function hidePerspective(){
      //if(!perspel) return
      //perspel.destroy()
      //perspel=undefined
      const crop=document.getElementById('crop')
      if(crop) crop.style.display='' //will be set by handleCrop
      persp.value=false
    }
    function togglePerspective(){
      if(persp.value) hidePerspective()
      else showPerspective()
    }
  /////////////////

  ///// RESIZER
    const resizeperc=reactive(100)

    function resize(newwidth,newheight){
      resize_width.value=adj.resizer.width=newwidth
      resize_height.value=adj.resizer.height=newheight
      //centerCanvas()
      _minigl.resize(newwidth,newheight)
      resizeperc.value=Math.round(newwidth/_minigl.img.width*1000)/10
      updateCanvasAngle()
      resetCropRect()
      updateResetBtn()
      onUpdate()
    }

    function resetResizer(){
      _minigl.resetResize()
      adj.resizer.width=0
      adj.resizer.height=0
      resize_width.value=_minigl.width
      resize_height.value=_minigl.height
      resizeperc.value=100
    }

    function setWidth(){
      const ar = arsvalues[1]
      const width=Math.max(100,this.value)
      const height=Math.floor(width/ar)
      resize(width,height)
    }
    function setHeight(){
      const ar = arsvalues[1]
      const height=Math.max(100,this.value)
      const width=Math.floor(height*ar) 
      resize(width,height)
    }
  /////////////////

  return html`
    ${section(
      'composition', 
      235, 
      $selection,       //signal with active sectioname, that opens/closes section
      adj,              //section's params obj of which $skip field will be set on/off
      null,             //called when section is enabled/disabled
      resetComposition,     //section name provided to onReset
      ()=>html`
            <style>
              .crop_btn {
                width: 38px;
                color: white;
                padding: 0;
                margin: 2px;
                border-radius:50%;
                fill: white;
                stroke: white;
                font-size: 12px;
              }
              .close_btn {display:none !important;}
            </style>

            <button class="done_btn" @click="${()=>$selection.value=''}">done</button>
              <div style="display:flex;justify-content: flex-end;color:grey; margin-right: 3px;">
                <div style="flex: 1; align-content: center; text-align: left;">
                  <span>rotation </span>
                  <input id="trs_angle_" style="width:75px;" type="number" class="rangenumb" step=0.25 min=-45 max=45 value="${adj['trs']['angle']}" @input="${setTRS}">
                  <input id="trs_angle" type="range" value="${adj['trs']['angle']}" min=-45 max=45 step=0.25 @input="${setTRS}" @dblclick="${resetTRSCtrl}"/>

                </div>

                <button id="fliph" class="crop_btn" title="flip x" selected="${!!adj.trs.fliph}" @click="${()=>flip('h')}">${icon_flip}</button>
                <button id="flipv" class="crop_btn" title="flip y" selected="${!!adj.trs.flipv}" @click="${()=>flip('v')}" style="rotate: 270deg;">${icon_flip}</button>
                <button class="crop_btn" title="rotate left" @click="${()=>rotateCanvas(-90)}">${icon_rotate}</button>
                <button class="crop_btn" title="perspective" :selected="${()=>!!persp.value}" @click="${togglePerspective}">${icon_skew}</button>
              </div>
            <hr>
              <div style="text-align:left;color:gray;">crop ratio</div>
              <div style="text-align:left;" id="aspects">
                ${ars.map((e,i)=>html`
                  <button id="ar_${i}" @click="${()=>setCropAR(i)}" class="crop_btn" selected="${i===adj.crop.arindex }" @dblclick="${resetCropRect}">${e}</button>
                `)}
              </div>
            <hr>
              <div style="text-align:left;color:gray;">image size</div>
              <div style="display:flex;justify-content: space-around;align-items: center;">
                <div style="width:100px;text-align:left;color:gray;">(${()=>resizeperc.value+'%'})</div>
                <input id="resize_width" type="number" value="${canvas.width}" style="text-align:center;width:90px;" @change="${setWidth}"> 
                x 
                <input id="resize_height" type="number" value="${canvas.height}" style="text-align:center;width:90px;" @change="${setHeight}">
              </div>

            ${()=>persp.value && html`${Quad(canvas,persp.value,()=>{updateResetBtn();onUpdate()})}`}

      `)}



  `
}
