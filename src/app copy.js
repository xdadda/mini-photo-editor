//TODO: checkout shaders at https://img.ly/products/photo-sdk/demo
//TODO: fix zoom not readibly available on Safari .. need dblclick or something ..
//TODO: implement perspective correction tool

import { html, reactive, onMount, onUnmount} from 'mini'
import { alert, confirm } from 'mini/components'
import 'mini/components.css'
import store from 'mini/store' //'./store.js'

import { readEXIF, writeEXIFtoJPG } from 'mini-exif'
import { minigl} from 'mini-gl'
import logo from '/icon.png'

import { zoom_pan } from './js/zoom_pan.js'
import { readImage, downloadFile, filesizeString } from './js/tools.js'

import ThemeToggle from './components/themetoggle.js'
import Histogram from './components/histogram.js'
import GPSMap from './components/gpsmap.js'
import Cropper from './components/cropper.js'
import SplitView from './components/splitview.js'
import clickdropFile from './components/clickdropFile.js'

import adjustments from './_adjustments.js'
import curves from './_curves.js'
import filters from './_filters.js'

const initstate = {
  appname:'MiNi PhotoEditor',
  appver:'0.1.0'
}

import './app.css'
import './editor.css'

import icon_rotate from './assets/icon_rotate.svg?raw'
import icon_flip from './assets/icon_flip.svg?raw'


//////////////////////////////////////////////////


export function App(){ //this -- includes url and user
  store(initstate) //just for fun
  const $file = reactive(false)
  const $canvas = reactive()
  const $selection = reactive()
  const $ar=reactive()


  let _minigl, zp
  let adj={
      lights: { brightness:0, exposure:0, gamma:0, contrast:0, shadows:0, highlights:0, bloom:0, },
      colors: { temperature:0, tint:0, vibrance:0, saturation:0, sepia:0, },
      effects: { clarity:0, noise:0, vignette:0, },
      trs: { translateX:0, translateY:0, angle:0, scale:0, flipv:0, fliph:0, canvas_angle:0, ar:0},
      filter: { opt:0, mix:0 },
      curve: {curvearray: 0},
    }

  ///// CORE FUNCTIONS


    async function downloadImage(){
      if(await confirm('Download image?')){
        const meta = $file.value;
        const img = _minigl.captureImage() //return Image with src=image/jpeg dataUrl
        let imgdataurl =  img.src
        if(meta.exif_raw) {
          imgdataurl = writeEXIFtoJPG(meta,imgdataurl) //input jpeg dataUrl i.e. data:image/jpeg;base64,xxxx data:image/jpg;base64,xxx
        }
        const blob = await fetch(imgdataurl).then(r => r.blob());
        let name = meta.file.name
        if(!name.toLowerCase().endsWith('.jpeg') && !name.toLowerCase().endsWith('.jpg')) name+='.jpg'
        downloadFile(blob,'__'+name);
      }
    }

    async function onImageLoaded(arrayBuffer, filedata, img ){
        if($file.value) resetAll()

        let meta = await readEXIF(arrayBuffer);
        if(!meta) meta={}
        meta.file = {...filedata, hsize:filesizeString(filedata.size), width:img?.width || img?.videoWidth || '-', height:img?.height || img?.videoHeight || '-'};
        meta.img = img;
        meta.colorspace = meta.icc?.ColorProfile?.[0].includes("P3") ? "display-p3" : "srgb"
        console.log('metadata',{...meta});
        $file.value=meta;
    }

    //SETUP  
    reactive(()=>{
      if($canvas.value){
        const meta = $file._value
        const el = document.getElementById("canvas")

        if(_minigl) _minigl.destroy()
        _minigl = minigl(el, meta.img, meta.colorspace)

        //set current aspect ratio
        arsvalues[1]=_minigl.gl.canvas.width/_minigl.gl.canvas.height
        arsvalues[2]=_minigl.gl.canvas.height/_minigl.gl.canvas.width
        //setup zoom&pan for canvas
        if(zp) zp() //clean previous events
        zp = zoom_pan(zoomable,pannable)


        //resetAll()
        //ensure canvas is centered
        centerCanvas()
        updateGL()
      }
    },{effect:true})

    function resetAll(){
      $selection.value=null
      hideSplitView()
      splitwidth=0.5
      currentcrop=0
      $ar.value=0
      hideHisto()
      for(const s in adj){
        for(const v in adj[s]) adj[s][v]=0
      }
    }

  /////////////////

    function updateGL(){
      let params = {}
      Object.keys(adj).forEach(e=>params={...params,...adj[e]}) //flatten the adj object

      _minigl.loadImage() //load image's texture

      if(cropping || glcrop){
        adj.trs.angle+=adj.trs.canvas_angle
        _minigl.filterMatrix(adj.trs)
        adj.trs.angle-=adj.trs.canvas_angle        
      }

      if(glcrop) {
        //placed here to intercept filterMatrix and before other filters
        _minigl.crop(glcrop)
        glcrop=null
        //resetComposition()
        return updateGL()
      }


      _minigl.filterAdjustments({...params})
      if(params.bloom) _minigl.filterBloom(params.bloom)
      if(params.noise) _minigl.filterNoise(params.noise)
      if(params.shadows||params.highlights) _minigl.filterHighlightsShadows(params.highlights||0,-params.shadows||0)
      if(params.curvearray) _minigl.filterCurves(params.curvearray)
      if(params.opt) _minigl.filterInsta(params.opt,params.mix)


      _minigl.paintCanvas()  //draw to canvas
      if(updateHistogram) updateHistogram()
    } 


  ///// HISTORY
    /*
    let history = [], historypos=reactive(0)
    function pushHistory(){
      //skip if nothing changed
      console.log('pushHistory',historypos._value)
      if(JSON.stringify(adj)===JSON.stringify(history[historypos._value-1])) return
      history.splice(historypos._value) //remove all from pos
      history.push(JSON.parse(JSON.stringify(adj)))
      historypos.value++
      //console.log('>>>',historypos.value,JSON.stringify(history))
    }
    function scrollHistory(direction){
      const v=direction
      if(v===-1) {
        if(historypos.value===0) return
        historypos.value--
        if(historypos.value===0) return resetAdj()
      }
      else if(v===1) {
        if(historypos.value===history.length) return
        historypos.value++
      }
      let h = history[historypos.value-1]
      adj=JSON.parse(JSON.stringify(h||{}))
      //update all controllers
      Object.keys(adj).forEach(e=>setAdjCtrl(e))
      updateGL()
      updateButtons()
    }
    function clearHistory(){
      history=[]
      historypos.value=0
    }
    function updateButtons(){
      //if all adjustments are set to 0
      if(Object.values(adj).reduce((p,v)=>p+=v,0)===0){
        btn_reset.disabled=true
      }
      else {
        btn_reset.disabled=false
      }
    }
    */
  /////////////////

  ///// SELECTION
    function handleSelection(section){
      if($selection.value==='composition' && section!=='composition') {
        //closing crop section => crop the image
        handleCrop()
      }
      else if(section==='composition') showCrop()
      $selection.value=section
      const el =document.getElementById(section)

      document.querySelector('[s_selected]')?.removeAttribute('s_selected');
      el.setAttribute('s_selected',true)

    }
  /////////////////

  ///// CANVAS CENTER and DBLCLICK
    function centerCanvas(){
      const canvas = document.getElementById("canvas")
      if(canvas.width>canvas.height) {
        canvas.style.width='90%'
        canvas.style.height=''
      }
      else if(canvas.width<canvas.height) {
        canvas.style.height='90%'
        canvas.style.width=''
      }
      else {
        canvas.style.height='90%'
        canvas.style.maxWidth='90%'
      }
      //reset canvas position
      zoomable.style.transform=''
      pannable.style.transform=''
    }

    function canvas_dblclick(e){
      e?.preventDefault()
      //reset canvas position
      zoomable.style.transform=''
      pannable.style.transform=''
    }

    let lastclick=0
    function canvas_click(e){
      e.preventDefault()
      //mobile can't intercept double-tap as a double click ... handle it here with a timer! yuk
      if(lastclick && (Date.now()-lastclick)<200) return canvas_dblclick(e)
      lastclick=Date.now()
    }
  /////////////////

  ///// SPLIT VIEW
    let splitwidth, splitimage
    const $showsplit = reactive(false)

    function showSpitView(){
      splitimage = _minigl.img_cropped || _minigl.img
      btn_split.setAttribute('selected',true)
      $showsplit.value = true
    }
    function hideSplitView(){
      $showsplit.value = false
      btn_split.removeAttribute('selected')
    }
    function toggleSplitView(){
      if(cropping) return
      if($showsplit._value) hideSplitView()
      else showSpitView()
    }

    function onSplitUpdate(sw){
      splitwidth=sw
    }
  /////////////////

  ///// INFO
    async function showInfo(){
      const meta = $file._value //use _value otherwhise component below will become reactive!
      await alert(
        ()=>html`<small style="text-align:center;">
          ${meta.file.name}<br>
          ${meta.file.width} x ${meta.file.height} (${meta.file.hsize})<br>
          ${meta.exif?.DateTimeOriginal?.value || new Date(meta.file.lastModified).toLocaleString()}<br>
          ${meta.colorspace}

          ${()=>meta.gps&&GPSMap([meta.gps.GPSLongitude.hvalue,meta.gps.GPSLatitude.hvalue])}
        </small>`)

    }
  /////////////////

  ///// HISTOGRAM
    let updateHistogram
    const $histo=reactive(false)
    function showHisto(){
      if(btn_histo.hasAttribute('selected')){
        btn_histo.removeAttribute('selected')
        $histo.value=false
      }
      else {
        btn_histo.setAttribute('selected',true)
        $histo.value=true
      }
    }
    function hideHisto(){
        btn_histo.removeAttribute('selected')
        $histo.value=false      
    }
  /////////////////

  ///// CROP

    let cropping=false
    function showCrop(){
        hideSplitView()
        hideHisto()
        _minigl.resetCrop()
        updateCanvasAngle()
        centerCanvas()
        cropping=true
        updateGL()
        btn_info.setAttribute('disabled',true)
        btn_histo.setAttribute('disabled',true)
        btn_split.setAttribute('disabled',true)

        //DISABLE ZOOMPAN
        if(zp) zp()
    }
  
    function hideCrop(){
      btn_info.removeAttribute('disabled')
      btn_histo.removeAttribute('disabled')
      btn_split.removeAttribute('disabled')
      cropping=false
      //RESUME ZOOMPAN
      zp = zoom_pan(zoomable,pannable)
    }

    let currentcrop=0
    function onCropUpdate(r){
      currentcrop=r
      toggleResetCrop()
    }

  
    function resetCrop(){
        currentcrop=0
        const croprect=document.getElementById('croprect')
        if(croprect) croprect.style.inset='0'
        adj.trs.canvas_angle=0
        setCropAR(0)
        Object.keys(adj['trs']).forEach(e=>{
          adj['trs'][e]=0
          setTRSCtrl('trs_'+e)
        })
        const fliph=document.getElementById('fliph')
        const flipv=document.getElementById('flipv')
        fliph.removeAttribute('selected')
        flipv.removeAttribute('selected')

        toggleResetCrop()
        showCrop()
        //updateGL()
    }

    function resetCropRect(currentc){
      const crop = document.getElementById('crop')
      crop.style.width= Math.round(canvas.getBoundingClientRect().width)+'px'
      crop.style.height = Math.round(canvas.getBoundingClientRect().height)+'px'
      if($ar.value) croprect.style.aspectRatio=$ar.value
      croprect.style.inset='0'
      currentcrop=0
    }

    let glcrop
    function handleCrop(){
      if(!croprect) return

      const ratio=canvas.width/crop.offsetWidth
      glcrop={
        left:Math.round((croprect.offsetLeft)*ratio),
        top:Math.round((croprect.offsetTop)*ratio),
        width:Math.round((croprect.offsetWidth)*ratio),
        height:Math.round((croprect.offsetHeight)*ratio)
      }

      cropping=false
      hideCrop()

      $selection.value=null
      updateGL()
      centerCanvas()
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
      toggleResetCrop()
      updateGL()
    }

    //let canvas_angle=0
    function updateCanvasAngle(){
      if(adj.trs.canvas_angle%180){
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
      adj.trs.canvas_angle = (adj.trs.canvas_angle+deg) % 360
      updateCanvasAngle()
      //reset crop view
      crop.style.width= Math.round(canvas.getBoundingClientRect().width)+'px'
      crop.style.height = Math.round(canvas.getBoundingClientRect().height)+'px'
      croprect.style.inset='0'

      toggleResetCrop()
      updateGL()
    }

    function toggleResetCrop(){      
      if(!adj.trs.flipv && !adj.trs.fliph && Object.values(adj.trs).reduce((p,v)=>p+=v,0)===0 && currentcrop===0) btn_reset_crop.setAttribute('disabled',true)
      else btn_reset_crop.removeAttribute('disabled')
    }

    const ars=['free','pic','1:pic','1:1','4:3','16:9','3:4','9:16']
    let arsvalues=[0,0,0,1,4/3,16/9,3/4,9/16]
    function setCropAR(idx){
      adj.trs.ar=idx
      $ar.value=arsvalues[idx]
      const aspects = document.getElementById('aspects')
      if(aspects){
        aspects.querySelector('[selected]')?.removeAttribute('selected')
        aspects.querySelector('#ar_'+idx)?.setAttribute('selected',true)     
      }
      toggleResetCrop()
    }
  /////////////////

  ///// CROP - ANGLE
    function setTRS(e){ //id= "section:adj"
      const value = e.target.value
      const id = this.id.split('_')
      adj[id[0]][id[1]]=parseFloat(value)
      this.nextElementSibling.textContent=value

      if(id[1]==='angle'){
        const rad = parseFloat(Math.abs(value)) * Math.PI / 180.0
        const newwidth=canvas.width*Math.cos(rad)+canvas.height*Math.sin(rad)
        const newheight=canvas.width*Math.sin(rad)+canvas.height*Math.cos(rad)
        const zoom=Math.max(newwidth/canvas.width-1, newheight/canvas.height-1)
        adj.trs.scale=zoom
        toggleResetCrop()
        //setAdjCtrl('trs_scale')
      }
      updateGL()
    }


    function setTRSCtrl(_id){
      const el = document.getElementById(_id)
      if(!el) return
      const id = _id.split('_')
      el.value=adj[id[0]][id[1]]
      el.nextElementSibling.textContent=el.value
    }

    function resetTRSCtrl(){
      if(!this) return
      const id = this.id.split('_')
      adj[id[0]][id[1]]=0
      setTRSCtrl(this.id)
      
      if(id[1]==='angle'){
        adj.trs.scale=0
      }
      
      toggleResetCrop()
      updateGL()
    }
  /////////////////



  return html`
    <div class="app">

        <div style="position:absolute;width:50px;top: env(safe-area-inset-top);right:env(safe-area-inset-right);z-index:999;">
          ${()=>ThemeToggle('dark',true)}
        </div>


      ${()=>!$file.value && html`
        <div class="main" style="display: flex;flex-direction: column;align-items: center;">
          <div style="flex: 1;display: flex;flex-direction: column;align-items: center;justify-content: center;">
            <img src="${logo}" style="width:130px;" alt="logo"/>
            <h1>
              ${store('appname')}
            </h1>

            <style>#clickdrop_btn{height: 120px;color:light-dark(white,#dbdbdb);}</style>
            ${clickdropFile('click or drop<br> to load file','image/*',(file)=>readImage(file, onImageLoaded))}
          </div>
        </div>
      `}

      ${()=>$file.value && html`
        <div class="header">
          <div style="margin:5px;display:flex;align-items:center;">
            <img src="${logo}" style="width:30px;" alt="logo"/>&nbsp;&nbsp;${store('appname')}
          </div>
        </div>
  
        <div class="main" style="display: flex;flex-direction: column;align-items: center;">

            <div class="container" style="font-size:15px;">

              <div id="editor" class="editor">
                <div id="zoomable" @dblclick="${canvas_dblclick}" @click="${canvas_click}">
                  <div id="pannable">
                    <canvas :ref="${$canvas}" id="canvas" class="checkered"></canvas>
                    ${()=>$showsplit.value && SplitView(splitimage,canvas.style.width,canvas.style.height,splitwidth,onSplitUpdate)}                    
                    ${()=>$selection.value==='composition' && Cropper(canvas, currentcrop, $ar.value, onCropUpdate)}
                  </div>
                </div>
              </div>

              <div class="sidebar" >
                <div>
                  <style>#clickdrop_btn{width: 120px;}</style>
                  ${clickdropFile('open','image/*',(file)=>readImage(file, onImageLoaded))}
                  <button style="width:120px;" id="btn_download" @click="${downloadImage}">download</button>
                </div>
                <div>
                  <button style="width:70px;" id="btn_info" @click="${showInfo}">info</button>
                  <button style="width:70px;" id="btn_histo" @click="${showHisto}">histo</button>
                  <button style="width:70px;" id="btn_split" @click="${toggleSplitView}">split</button>
                  <br>
                </div>



                /******** COMPOSITION *******/
                <div class="section" id="composition">
                    <div style="display:flex;justify-content: space-between;cursor:pointer;" @click="${()=>handleSelection('composition')}">
                      <b>composition</b><a id="btn_reset_crop" class="reset_btn" @click="${resetCrop}" disabled title="reset">\u00D8</a>
                    </div>

                    ${()=>$selection.value==='composition' && html`
                      <div>
                        <hr>

                        <div style="display:flex;justify-content: space-around;align-items: center;">
                          <label style="width:100px;text-align:left;color:gray;">rotate</label>
                          <input id="trs_angle" style="width:130px;" type="range" value="${adj['trs']['angle']}" min=-45 max=45 step=0.25 @input="${setTRS}" @dblclick="${resetTRSCtrl}"/>
                          <span style="width:40px;text-align:right;color:gray;">${adj['trs']['angle']}</span>
                        </div>

                        <div style="display:flex;justify-content: flex-end;color:grey; margin-right: 3px;">
                          <button id="fliph" class="crop_btn" title="flip x" selected="${!!adj.trs.fliph}" @click="${()=>flip('h')}">${icon_flip}</button>
                          <button id="flipv" class="crop_btn" title="flip y" selected="${!!adj.trs.flipv}" @click="${()=>flip('v')}" style="rotate: 270deg;">${icon_flip}</button>
                          <button class="crop_btn" title="rotate left" @click="${()=>rotateCanvas(-90)}">${icon_rotate}</button>

                        </div>
                        <hr>
                          <div style="text-align:left;" id="aspects">
                            ${ars.map((e,i)=>html`
                              <button id="ar_${i}" @click="${()=>setCropAR(i)}" class="crop_btn" selected="${i===adj.trs.ar}" @dblclick="${resetCropRect}">${e}</button>
                            `)}
                          </div>
                      </div>
                    `}
                </div>


                /******** ADJUSTMENT *******/
                ${adjustments($selection,handleSelection,adj,updateGL)}

                /******** COLOR CURVE *******/
                ${()=>curves($selection,handleSelection,adj.curve,updateGL)}

                /******** FILTERS *******/
                ${filters($selection,handleSelection,adj.filter,updateGL)}


              </div>
            <div>
          
            ${()=>$histo.value && Histogram($file._value.colorspace,(fn)=>{updateHistogram=fn;updateGL();})}

        </div>
      `}

      <div class="footer" style="height:30px;">
        <div style="width: 100%;margin:0 10px;text-align: right;font-size: 10px;">
          <a href="https://github.com/xdadda/minijs" target="_blank">powered by MiNi-js</a>
        </div>
      </div>

    </div>
  `
}

/*
*/


