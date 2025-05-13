import { html, onMount, onUnmount } from '@xdadda/mini'

import Worker from './histogram_worker.js?worker'
import {handlePointer} from '../js/zoom_pan.js'


export default function Histogram(colorspace, onSetup){
    let cleanevt

    onMount(()=>{
      setupHistogramWorker()
      if(onSetup) onSetup(drawHistogram)
      if(cleanevt) cleanevt()
      cleanevt = handlePointer({
            el:histo,
            onMove: ({ev,x,y,el})=>{
              ev.stopPropagation()
              const pos=el.style.transform.match(/translate\((.*?)\)/)?.[1].split(',').map(e=>parseFloat(e)) || [0,0]
              const scale=1 //args.el.parentElement.style.transform.match(/scale\((.*?)\)/)?.[1].split(',').map(e=>parseFloat(e))[0] || 1
              pos[0]+=x/scale
              pos[1]+=y/scale
              el.style.transform=`translate(${pos[0]}px,${pos[1]}px)`
            }
          })

    })
    onUnmount(()=>{
      worker.terminate()
      cleanevt()
    })


    let thumb, thumbctx, histoctx
    let worker, updating=false
    async function setupHistogramWorker(){
      try{
        //console.log('>>INIT webworker<<')
        thumb = new OffscreenCanvas(10,10)
        thumb.width = 350
        thumbctx = thumb.getContext('2d',{colorSpace: colorspace, willReadFrequently: true})
        histoctx = document.getElementById('histogram').getContext("2d")
        worker = new Worker(); 
        worker.onmessage = async (event) => {
          if(event.data.bitmap) {
            histoctx.clearRect(0, 0, histoctx.canvas.width, histoctx.canvas.height)
            histoctx.drawImage(event.data.bitmap,0,0)
            updating=false
            //setTimeout(()=>updating=false,10) //debounce
          } else console.log(event.data)
        };
        worker.onerror = (error) => {
          console.error(`Worker error: ${error.message}`);
          throw error;
        };
        worker.postMessage({init:true,width:histoctx.canvas.width,height:histoctx.canvas.height})
      }
      catch(e){console.error(e)}
    }

    async function drawHistogram() {
      if(worker && !updating) {
        updating=true
        thumb.height = thumb.width / (canvas.width/canvas.height)
        thumbctx.drawImage(canvas,0,0,canvas.width,canvas.height,0,0,thumb.width,thumb.height)
        const pixels = thumbctx?.getImageData(0,0,thumbctx.canvas.width,thumbctx.canvas.height).data
        worker.postMessage({pixels}) 
      }
      return
    }


  return html`
      <div id="histo" style="position:absolute;left:10px;width:260px;height:100px;background-color:grey;padding:5px;cursor:pointer;">
        <div style="position:absolute;color:grey;right:40px;font-size:80%;">${colorspace}</div>
        <canvas id="histogram" width="256" height="150" style="width:100%;height:100%;background-color: #121212;"></canvas>
      </div>
  `
}