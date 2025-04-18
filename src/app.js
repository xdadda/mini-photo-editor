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
import github from './assets/icon_github.png'

import { zoom_pan } from './js/zoom_pan.js'
import { readImage, downloadFile, filesizeString } from './js/tools.js'

import ThemeToggle from './components/themetoggle.js'
import Histogram from './components/histogram.js'
import GPSMap from './components/gpsmap.js'
import Cropper from './components/cropper.js'
import SplitView from './components/splitview.js'
import clickdropFile from './components/clickdropFile.js'

import composition from './_composition.js'
import adjustments from './_adjustments.js'
import curves from './_curves.js'
import filters from './_filters.js'

const initstate = {
  appname:'MiNi PhotoEditor',
  appver:'0.1.0'
}

import './app.css'
import './editor.css'


//////////////////////////////////////////////////


export function App(){ //this -- includes url and user
  store(initstate) //just for fun
  const $file = reactive(false)
  const $canvas = reactive()
  const $selection = reactive()


  let _minigl, zp
  let adj={
      trs: { translateX:0, translateY:0, angle:0, scale:0, flipv:0, fliph:0},
      crop: {currentcrop:0, glcrop:0, canvas_angle:0, ar:0, arindex:0},
      lights: { brightness:0, exposure:0, gamma:0, contrast:0, shadows:0, highlights:0, bloom:0, },
      colors: { temperature:0, tint:0, vibrance:0, saturation:0, sepia:0, },
      effects: { clarity:0, noise:0, vignette:0, },
      curve: {curvearray: 0},
      filter: { opt:0, mix:0 },
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

    async function onImageLoaded(arrayBuffer, filedata, img){
        if($file.value) resetAll()

        let meta = await readEXIF(arrayBuffer);
        if(!meta) meta={}
        meta.file = {...filedata, hsize:filesizeString(filedata.size), width:img?.width || img?.videoWidth || '-', height:img?.height || img?.videoHeight || '-'};
        meta.img = img;
        meta.colorspace = meta.icc?.ColorProfile?.[0].includes("P3") ? "display-p3" : "srgb"
        console.log('metadata',{...meta});
        $file.value=meta;
    }

    function resetAll(){
      $selection.value=null
      hideHisto()
      hideSplitView()
      splitwidth=0.5
      for(const s in adj){
        for(const v in adj[s]) adj[s][v]=0
      }
    }

    //SETUP canvas and initiate minigl  
    reactive(()=>{
      if($canvas.value){
        const meta = $file._value

        if(_minigl) _minigl.destroy()
        _minigl = minigl(document.getElementById("canvas"), meta.img, meta.colorspace)

        //setup zoom&pan for canvas
        if(zp) zp() //clean previous events
        zp = zoom_pan(zoomable,pannable)

        centerCanvas()
        updateGL()
      }
    },{effect:true})
  
    function updateGL(){
      let flatparams = {}
      Object.keys(adj).forEach(e=>flatparams={...flatparams,...adj[e]}) //flatten the adj object

      _minigl.loadImage() //load image's texture

      // TRANSLATE/ROTATE/SCALE filter
      if(cropping || adj.crop.glcrop){
        adj.trs.angle+=adj.crop.canvas_angle
        _minigl.filterMatrix(adj.trs)
        adj.trs.angle-=adj.crop.canvas_angle        
      }

      // RUN CROP when set (crop image after TRS but before other filters)
      if(adj.crop.glcrop) {
        _minigl.crop(adj.crop.glcrop)
        adj.crop.glcrop=0
        return updateGL()
      }

      // other filters
      _minigl.filterAdjustments({...flatparams})
      if(flatparams.bloom) _minigl.filterBloom(flatparams.bloom)
      if(flatparams.noise) _minigl.filterNoise(flatparams.noise)
      if(flatparams.shadows||flatparams.highlights) _minigl.filterHighlightsShadows(flatparams.highlights||0,-flatparams.shadows||0)
      if(flatparams.curvearray) _minigl.filterCurves(flatparams.curvearray)
      if(flatparams.opt) _minigl.filterInsta(flatparams.opt,flatparams.mix)


      _minigl.paintCanvas()  //draw to canvas
      if(updateHistogram) updateHistogram()
    } 
  /////////////////

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
        hideCrop() //set other UI elements and call _minigl.crop()
      }
      else if(section==='composition') showCrop() //set other UI elements
      $selection.value=section
      const el =document.getElementById(section)

      document.querySelector('[s_selected]')?.removeAttribute('s_selected');
      el.setAttribute('s_selected',true)

    }
  /////////////////

  ///// CENTER CANVAS
    function centerCanvas(){
      const canvas = document.getElementById("canvas")
      const editor = document.getElementById("editor")
      //little trick to keep the canvas centered in container
      const canvasAR = canvas.width/canvas.height
      if(editor.offsetWidth/canvasAR > editor.offsetHeight) {
        canvas.style.height='90%'
        canvas.style.width=''
      }
      else {
        canvas.style.width='90%'
        canvas.style.height=''
      }

      //reset canvas position
      zoomable.style.transform=''
      pannable.style.transform=''
    }

    function canvas_dblclick(e){
      e?.preventDefault()
      centerCanvas()
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
        centerCanvas()
        cropping=true
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
      handleCrop()
    }

    function handleCrop(){
      if(!croprect) return //croprect is the DOM element with the crop size
      const ratio=canvas.width/crop.offsetWidth
      adj.crop.glcrop={
        left:Math.round((croprect.offsetLeft)*ratio),
        top:Math.round((croprect.offsetTop)*ratio),
        width:Math.round((croprect.offsetWidth)*ratio),
        height:Math.round((croprect.offsetHeight)*ratio)
      }
      updateGL()
      centerCanvas()
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
                    ${()=>$selection.value==='composition' && Cropper(canvas, adj.crop, adj.trs)}
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
                ${composition($selection,handleSelection,adj,updateGL,()=>_minigl,centerCanvas)}

                /******** ADJUSTMENT *******/
                ${adjustments($selection,handleSelection,adj,updateGL)}

                /******** COLOR CURVE *******/
                ${curves($selection,handleSelection,adj.curve,updateGL)}

                /******** FILTERS *******/
                ${filters($selection,handleSelection,adj.filter,updateGL)}


              </div>
            <div>
          
            ${()=>$histo.value && Histogram($file._value.colorspace,(fn)=>{updateHistogram=fn;updateGL();})}

        </div>
      `}

      <div class="footer" style="height:30px;">
        <div style="width: 100%;margin:0 10px;text-align: right;font-size: 10px;">
          <a href="https://github.com/xdadda/mini-photo-editor" target="_blank"><img src="${github}" style="width:15px;"></a>
        </div>
      </div>

    </div>
  `
}

/*
*/


