
import { html, reactive, onMount, onUnmount} from '@xdadda/mini'
import { alert } from '@xdadda/mini/components'
//import '@xdadda/mini/components.css'
import store from '@xdadda/mini/store'
import './app.css'
import './editor.css'

import miniExif from '@xdadda/mini-exif'
import { minigl} from '@xdadda/mini-gl'
import logo from './assets/icon.png'
import github from './assets/icon_github.png'
import icon_split from './assets/icon_split.svg?raw'
import icon_histo from './assets/icon_histo.svg?raw'
import icon_info from './assets/icon_info.svg?raw'

import { zoom_pan } from './js/zoom_pan.js'
import { readImage, downloadFile, filesizeString } from './js/tools.js'

import ThemeToggle from './components/themetoggle.js'
import FullScreen from './components/fullscreen.js'


import Histogram from './components/histogram.js'
import GPSMap from './components/gpsmap.js'
import Cropper from './components/cropper.js'
import SplitView from './components/splitview.js'
import clickdropFile from './components/clickdropFile.js'
import downloadImage from './components/downloadImage.js'


import composition from './_composition.js'
//import perspective from './_perspective.js'
import adjustments from './_adjustments.js'
import curves from './_curves.js'
import filters from './_filters.js'
import blender from './_blender.js'
import blur from './_blur.js'
import recipes from './_recipes.js'
import heal from './_heal.js'
import InpaintTelea from './js/inpaint.js'

const initstate = {
  appname:'MiNi PhotoEditor',
}



//////////////////////////////////////////////////
    //keep this function pure
    export function centerCanvas(){
      const canvas = document.getElementById("canvas")
      const editor = document.getElementById("editor")
      //little trick to keep the canvas centered in container
      const canvasAR = canvas.width/canvas.height
      if(editor.offsetWidth/canvasAR > editor.offsetHeight) {
        canvas.style.height='99%'
        canvas.style.width=''
      }
      else {
        canvas.style.width='99%'
        canvas.style.height=''
      }

      //reset canvas position
      zoomable.style.transform=''
      pannable.style.transform=''
    }
//////////////////////////////////////////////////
/*
input = {
    "url": "http://127.0.0.1:5170/api/$streamfile?file=%2Fexif.png",
    "name": "exif.png"
}
*/
export function Editor(input=false){
  store(initstate)
  let sample=true
  if(input?.sample===false) sample=false

  let _exif, _minigl, zp
  const $file = reactive(false)
  const $canvas = reactive()

  let params={
      trs: { translateX:0, translateY:0, angle:0, scale:0, flipv:0, fliph:0},
      crop: {currentcrop:0, glcrop:0, canvas_angle:0, ar:0, arindex:0},
      lights: { brightness:0, exposure:0, gamma:0, contrast:0, shadows:0, highlights:0, bloom:0, },
      colors: { temperature:0, tint:0, vibrance:0, saturation:0, sepia:0, },
      effects: { clarity:0, noise:0, vignette:0, },
      curve: {curvepoints: 0},
      filters: { opt:0, mix:0 },
      perspective: {quad:0, modified:0},
      perspective2: {before:0, after:0, modified:0},
      blender: {blendmap:0, blendmix:0.5},
      resizer: {width:0, height:0},
      blur: { bokehstrength:0, bokehlensout:0.5, gaussianstrength:0, gaussianlensout:0.5, centerX:0.5, centerY:0.5},
      heal: { healmask:0 }
    }

  ///// INPUT/SAVE FUNCTIONs (for future integrations)
    //@data: Image, Blob, ArrayBuffer, url  it's an image feeded programmatically
    async function openInput(data, name){
      if(!data) return
      try {
          let arrayBuffer, blob, img, info={name}
          if(typeof data === 'string' && data.startsWith('http')) {
            const resp = await fetch(data)
            if(resp.status!==200) return console.error(await resp.json())
            arrayBuffer = await resp.arrayBuffer()
          }
          else if(data instanceof Image) {
            const resp = await fetch(data.src)
            if(resp.error) return console.error(resp.error)
            arrayBuffer = await resp.arrayBuffer()
            img=data
          }
          else if(data instanceof ArrayBuffer) {
            arrayBuffer = data
          }
          else if(data instanceof Blob) {
            blob=data
            arrayBuffer = await data.arrayBuffer()
          }
          else return console.error('Unknown data type')
          info.size=arrayBuffer.byteLength

          if(!blob) blob = new Blob( [ arrayBuffer ] )
          if(!img) {
            img = new Image();
            img.src=URL.createObjectURL(blob)
            await img.decode();
          }
          onImageLoaded(arrayBuffer, info, img)
      }
      catch(e){
        console.error(e)
        await alert(`<div style="margin:10px;text-wrap: auto;">${e}</div>`)
        history.back()
      }
    }
    if(input?.data) openInput(input.data,input.name)
  /////////////////

  ///// SETUP

    async function onImageLoaded(arrayBuffer, filedata, img){
        if($file._value) resetAll()
        try{
          _exif=await miniExif(arrayBuffer)
        }
        catch(e){console.error(e)}

        let meta=_exif?.read()
        if(!meta) meta={}
        //const parser = new DOMParser();
        //if(meta.xml) meta.xml = parser.parseFromString(meta.xml.slice(meta.xml.indexOf('<')), 'application/xml');
        if(meta.xml) {
          meta.xml = meta.xml.slice(meta.xml.indexOf('<')).replace(/ +(?= )/g,'').replace(/\r\n|\n|\r/gm,'')
        }
        meta.file = {...filedata, hsize:filesizeString(filedata.size), width:img?.width || img?.videoWidth || '-', height:img?.height || img?.videoHeight || '-'};
        meta.img = img;
        meta.colorspace = meta.icc?.ColorProfile?.[0].includes("P3") ? "display-p3" : "srgb"
        //if(meta.format==='JXL') meta.colorspace="display-p3"
        console.log('metadata',{...meta});
        $file.value=meta;
    }

    function resetAll(){
      $selection.value=null
      hideHisto()
      hideSplitView()
      splitwidth=0.5
      for(const s in params){
        for(const v in params[s]) params[s][v]=0
      }
    }

    //SETUP canvas and initiate minigl  
    reactive(()=>{
      if($canvas.value){
        const meta = $file._value
        try {
          if(_minigl?.destroy) _minigl.destroy()
          _minigl = minigl(document.getElementById("canvas"), meta.img, meta.colorspace)
          params._minigl = _minigl
          //setup zoom&pan for canvas
          if(zp) zp() //clean previous events
          zp = zoom_pan(zoomable,pannable)

          updateGL()          
          centerCanvas()
        }
        catch(e){console.error(e)}
      }
    },{effect:true})
  /////////////////

  ///// RUN GL PIPELINE

    async function updateGL(){
      //load image's texture
      _minigl.loadImage()

      if(params.heal.healit){
        //INPAINT
        const mask_u8 = params.heal.healmask
        const data = _minigl.readPixels()
        const w = _minigl.width, h=_minigl.height
        // RUN INPAINT for each channel
        for(var channel = 0; channel < 3; channel++){
          var img_u8 = new Uint8Array(w * h)
          for(var n = 0; n < data.length; n+=4){
            img_u8[n / 4] = data[n + channel]
          }
          InpaintTelea(w, h, img_u8, mask_u8)
          for(var i = 0; i < img_u8.length; i++){
            data[4 * i + channel] = img_u8[i]
            if(channel===0) data[4 * i + 3] = 255; //opacity 1 
          } 
        }
        const newimgdata = new ImageData(new Uint8ClampedArray(data.buffer),w,h)
        //console.log(newimgdata,_minigl)
        _minigl.loadImage(newimgdata)
        params.heal.healit=0
      }


      if(params.perspective2.after) {
          let before = params.perspective2.before.map(e=>[(e[0]*canvas.width),(e[1]*canvas.height)])
          let after = params.perspective2.after.map(e=>[(e[0]*canvas.width),(e[1]*canvas.height)])
          _minigl.filterPerspective(before,after, false, false)
      }


      // TRANSLATE/ROTATE/SCALE filter
      if(cropping || params.crop.glcrop){


        params.trs.angle+=params.crop.canvas_angle
        _minigl.filterMatrix(params.trs)
        params.trs.angle-=params.crop.canvas_angle

        // PERSPECTIVE correction
        if(params.perspective.quad) {
          let before=[[0.25,0.25], [0.75,0.25], [0.75,0.75],[0.25,0.75]]
          before = before.map(e=>[(e[0]*canvas.width),(e[1]*canvas.height)])
          let after = (params.perspective.quad).map(e=>[(e[0]*canvas.width),(e[1]*canvas.height)])
          _minigl.filterPerspective(before,after, false, false)
        }


      }

      // RUN CROP when set (crop image after TRS but before other filters)
      if(params.crop.glcrop) {
        _minigl.crop(params.crop.glcrop)
        params.crop.glcrop=0
        return updateGL()
      }

      //blend here so that following filters apply to both images
      if(!params.blender.$skip && params.blender.blendmap) _minigl.filterBlend(params.blender.blendmap,params.blender.blendmix)

      /////////// adjustment filters
      let adjparams = {}
      if(!params.lights.$skip) adjparams = {...adjparams, ...params.lights}
      if(!params.colors.$skip) adjparams = {...adjparams, ...params.colors}
      if(!params.effects.$skip) adjparams = {...adjparams, ...params.effects}
      _minigl.filterAdjustments({...adjparams})

      if(adjparams.bloom) _minigl.filterBloom(adjparams.bloom)
      if(adjparams.noise) _minigl.filterNoise(adjparams.noise)
      if(adjparams.shadows||adjparams.highlights) _minigl.filterHighlightsShadows(adjparams.highlights||0,-adjparams.shadows||0)
      ///////////

      if(!params.curve.$skip && params.curve.curvepoints) _minigl.filterCurves(params.curve.curvepoints)
      if(!params.filters.$skip && params.filters.opt) _minigl.filterInsta(params.filters.opt,params.filters.mix)      
      
      if(!params.blur.$skip && params.blur.bokehstrength) {
        _minigl.filterBlurBokeh(params.blur)
      }
      if(!params.blur.$skip && params.blur.gaussianstrength) {
        params.blur.gaussianlensout = params.blur.bokehlensout
        _minigl.filterBlurGaussian(params.blur)
      }

      //draw to canvas
      _minigl.paintCanvas();

      if(updateHistogram) updateHistogram()
    } 
  /////////////////

  ///// CENTER CANVAS
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
    function sidebar_click(e){
      e.preventDefault()
      $selection.value=''      
    }
  /////////////////

  ///// INFO
    async function showInfo(e){
      e?.stopPropagation()
      const meta = $file.value
      await alert(()=>html`
          <div style="text-align:left;font-size:12px;max-height:50vh;overflow:auto;">
            <div class="section">FILE</div>
              <div>name: ${meta.file.name}</div>
              <div>size: ${meta.file.width} x ${meta.file.height} (${meta.file.hsize})</div>
              <div>date: ${meta.exif?.DateTimeOriginal?.value || new Date(meta.file.lastModified).toLocaleString('en-UK')}</div>
              <div>prof: ${meta.colorspace}</div>

            ${meta.tiff && html`<div class="section">TIFF</div>`}
            ${meta.tiff && Object.entries(meta.tiff)
                .sort((a,b)=>a[0]?.toString().localeCompare(b[0]?.toString()))
                .map(e=>html`
                  <div>${e[0]}: ${e[1].hvalue || e[1].value}</div>
                `)}

            ${meta.gps && html`<div class="section">GPS</div>`}
            ${()=>meta.gps&&GPSMap([meta.gps.GPSLongitude.hvalue,meta.gps.GPSLatitude.hvalue])}

            ${meta.exif && html`<div class="section">EXIF</div>`}
            ${meta.exif && Object.entries(meta.exif)
                .sort((a,b)=>a[0]?.toString().localeCompare(b[0]?.toString()))
                .map(e=>html`
                  <div>${e[0]}: ${e[1].hvalue || e[1].value}</div>
                `)}

          </div>`
        ,400)
    }
  /////////////////

  ///// SELECTION
    const $selection = reactive()
    let currentselection=null

    //reactive effect to handle selection changes
    reactive(()=>{

      //disable-enable UI elements when cropping
      if($selection.value==='composition') onshowCrop() 
      else if(currentselection==='composition') onhideCrop()

      currentselection=$selection.value

    },{effect:true})
  /////////////////

  ///// CROP
    let cropping=false
    function onshowCrop(){
        hideSplitView()
        hideHisto()
        centerCanvas()
        cropping=true
        btn_info.setAttribute('disabled',true)
        btn_histo.setAttribute('disabled',true)
        btn_split.setAttribute('disabled',true)
        if(zp) zp() //DISABLE ZOOMPAN
    }
  
    function onhideCrop(){
      cropping=false
      btn_info.removeAttribute('disabled')
      btn_histo.removeAttribute('disabled')
      btn_split.removeAttribute('disabled')
      zp = zoom_pan(zoomable,pannable) //ENABLE ZOOMPAN
    }

    function onCropUpdate(){
      ////this is a UI hack, need to change a button inside Composition component ... sorry
      //toggle btn_reset_comp
      if(Object.values(params.trs).reduce((p,v)=>p+=v,0)===0 && Object.values(params.crop).reduce((p,v)=>p+=v,0)===0 && params.perspective.modified==0 && params.resizer.width===0) btn_reset_composition.setAttribute('disabled',true)
      else btn_reset_composition.removeAttribute('disabled')
    }
  /////////////////

  ///// HISTOGRAM
    let updateHistogram  //will receive the "updateHisto" function from the component
    const $showhisto=reactive(false)

    function toggleHisto(e){
      e?.stopPropagation()
      if(cropping) return
      if($showhisto.value) $showhisto.value=false
      else $showhisto.value=true
    }
    function hideHisto(){
      $showhisto.value=false      
    }
  /////////////////

  ///// SPLIT VIEW
    let splitwidth, splitimage
    const $showsplit = reactive(false)

    function hideSplitView(){
      $showsplit.value = false
    }
    function toggleSplitView(e){
      e?.stopPropagation()
      if(cropping) return
      if($showsplit._value) $showsplit.value = false
      else {
        splitimage = _minigl.img_cropped || _minigl.img
        $showsplit.value = true        
      }
    }
    function onSplitUpdate(sw){
      splitwidth=sw
    }
  /////////////////

  ///// SAMPLE IMAGES
    async function samples(){
      await alert((handleClose)=>html`
          <div style="position:relative;height:250px;overflow:auto;">
            <img id="snail.jpg" @click="${openSample}" style="cursor:pointer;position:absolute;top:50px;left:20px;border-radius:10px;" src="/samples/snail-8577681_1280.jpg" title="jpg" width=130>
            <img id="seagull.png" @click="${openSample}" style="cursor:pointer;position:absolute;top:50px;left:160px;border-radius:10px;" src="/samples/seagull-8547189_1280.png" title="png" width=150>
            <img id="water.jpg" @click="${openSample}" style="cursor:pointer;position:absolute;top:145px;left:160px;border-radius:10px;" src="/samples/water-8100724_1280.jpg" title="jpg" width=150>
            <img id="perspective.jpg" @click="${openSample}" style="cursor:pointer;position:absolute;top:50px;left:320px;border-radius:10px;" src="/samples/perspective2.jpg" title="jpg" width=137>
          </div>
      `,460)
    }

    function openSample(){
      openInput(this.src, this.id)
      //quick hack to close the samples window
      root.lastElementChild.remove()
    }
  ///////////////// 


  return html`
  <div class="minieditor">
    <div class="app" >


      /******** LOADING PAGE ********/
      ${()=>(!$file.value && !input.data) && html`
        <div class="main" style="justify-content: center;">
            <img src="${logo}" width=130 alt="logo"/>
            <h1> ${store('appname')} </h1>
            <div>
              ${clickdropFile('click or drop<br> to load file','image/*',(file)=>readImage(file, onImageLoaded),'height: 120px;')}
              ${sample && html`<button style="height: 80px;width:80px;" @click="${samples}">sample images</button>`}
            </div>
            <div style="font-size:13px;color:gray;margin-top:20px;"><i>100% private and offline!<br>100% free and opensource <a style="font-size: 10px;" href="https://github.com/xdadda/mini-photo-editor" target="_blank"><img src="${github}" style="width:15px;"></a></i></div>
        </div>
      `}

      /******** IMGEDITOR PAGE ********/
      ${()=>$file.value &&  html`

        ${!input ? html`
          <div class="header">
            <div class="banner">
              <img src="${logo}" width=30 alt="logo"/> ${store('appname')}
            </div>
            <div></div>
            <div style="display:flex;">
              <div class="btn_fullscreen">${()=>FullScreen(null)}</div>
              <div class="btn_theme">${()=>ThemeToggle('dark',true)}</div>
            </div>
          </div>
        ` : `<div class="header" style="backdrop-filter: unset;"></div>`}

        <div class="main">

            <div class="container">

              <div id="editor" class="editor">
                <div id="zoomable" @dblclick="${canvas_dblclick}" @click="${canvas_click}">
                  <div id="pannable">

                    /******** PAINT CANVAS *******/
                    <canvas :ref="${$canvas}" id="canvas" class="checkered"></canvas>

                    /******** SPLIT VIEW *******/
                    ${()=>$showsplit.value && SplitView(splitimage,canvas.style.width,canvas.style.height,splitwidth,onSplitUpdate)}                    
                    
                    /******** CROP CANVAS *******/
                    ${()=>$selection.value==='composition' && Cropper(canvas, params, onCropUpdate)}


                  </div>
                </div>
              </div>

              <div class="sidebar" @click="${sidebar_click}">

                <div class="menubuttons">
                  <div style="display: flex;align-items: center;justify-content: center;">
                    ${!input?.data && html`
                      ${clickdropFile('open','image/*',(file)=>readImage(file, onImageLoaded),'width:105px;height:30px;')}
                    `}
                    ${!!input?.data && html`
                      <button style="width:105px;height:30px;" @click="${()=>input.cb()}">cancel</button>
                    `}
                    <button style="width:105px;height:30px;" id="btn_download" @click="${()=>{$selection.value='';downloadImage($file,_exif,_minigl,input?.cb||null)}}">${input?.data?'save':'download'}</button>
                  </div>

                  <div style="display: flex;align-items: center;justify-content: center;">
                    <button style="width:70px;height:30px;fill:white;" id="btn_info" @click="${showInfo}" title="file info"><div style="scale:0.35;margin-top: -15px;">${icon_info}</div></button>
                    <button style="width:70px;height:30px;fill:white;" id="btn_histo" @click="${toggleHisto}" :selected="${()=>$showhisto.value}" tile="histogram"><div style="scale:0.4;margin-top: -15px;">${icon_histo}</div></button>
                    <button style="width:70px;height:30px;fill:white;" id="btn_split" @click="${toggleSplitView}" :selected="${()=>$showsplit.value}" tile="splitview"><div style="scale:0.5;margin-top: -15px;">${icon_split}</div></button>
                  </div>
                </div>
                <div class="menusections">

                  /******** COMPOSITION *******/
                  ${composition($selection, params, updateGL, ()=>_minigl, centerCanvas)}

                  /******** PERSPECTIVE *******/

                  /******** ADJUSTMENTS *******/
                  ${adjustments($selection, params, updateGL)}

                  /******** COLOR CURVE *******/
                  ${curves($selection, params, updateGL)}

                  /******** FILTERS *******/
                  ${filters($selection, params, updateGL)}

                  /******** BLENDER *******/
                  ${blender($selection, params, updateGL)}

                  /******** BLUR *******/
                  ${blur($selection, params, updateGL)}

                  /******** RECIPES *******/
                  ${recipes($selection, params, updateGL)}

                  /******** HEAL BRUSH *******/
                  ${heal($selection, params, updateGL)}


                </div>

              </div>
            </div>
          
            /******** HISTOGRAM *******/
            ${()=>$showhisto.value && Histogram($file._value.colorspace, (fn)=>{updateHistogram=fn;updateGL();})}

        </div>
      `}

      <div class="footer">
        <a style="margin-right:10px;font-size: 10px;" href="https://github.com/xdadda/mini-photo-editor" target="_blank"><img src="${github}" style="width:15px;"></a>
      </div>

    </div>
  </div>
  `
}

/*
                  ${perspective($selection, params, updateGL)}
*/





