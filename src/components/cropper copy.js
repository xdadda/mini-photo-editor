import { html, reactive, onMount, onUnmount} from 'mini'
import './cropper.css'

export default function Cropper(canvas, currentcrop, ar, onUpdate) {

  onMount(()=>{
    console.log('mount Cropper')
    resetCropRect()    
    crop.addEventListener("pointerdown", dragstart);
    crop.addEventListener("pointermove", drag);
    crop.addEventListener("pointerup", dragstop);
  })

  onUnmount(()=>{
    crop.removeEventListener("pointerdown", dragstart);
    crop.removeEventListener("pointermove", drag);
    crop.removeEventListener("pointerup", dragstop);    
  })


    let dragging=false
    let crop_mouse_pos
    let _left,_right,_top,_bottom
    let box, rect
    const hotspot=40, minsize=100

    function dragstop(e){
      dragging=false
      crop.releasePointerCapture(e.pointerId)
      updateRect()
      if(onUpdate) onUpdate(rect)
    }

    function updateRect(){
      rect=croprect.getBoundingClientRect()
      const {offsetTop, offsetLeft, offsetHeight, offsetWidth} = croprect
      rect={...JSON.parse(JSON.stringify(rect)), offsetTop, offsetLeft, offsetHeight, offsetWidth}
      rect.offsetBottom=box.height-offsetTop-offsetHeight
      rect.offsetRight=box.width-offsetLeft-offsetWidth
    }

    function dragstart(e){
      dragging=true
      crop.setPointerCapture(e.pointerId)

      crop_mouse_pos = {x:e.x, y:e.y}
      box=crop.getBoundingClientRect()
      updateRect()

      //CHECK POINTER pos vs hot spots
      const checkHotspot=(v)=>v>=0 && v<=hotspot
      _left = checkHotspot(crop_mouse_pos.x-rect.left) //distance from left border
      _right = checkHotspot(rect.right-crop_mouse_pos.x) //distance from right border
      _top = checkHotspot(crop_mouse_pos.y-rect.top)
      _bottom = checkHotspot(rect.bottom-crop_mouse_pos.y)

      //SET inset coordinates to avoid artifacts with 'auto' and aspectRatio
      croprect.style.top=croprect.offsetTop+'px'
      croprect.style.bottom=box.height - croprect.offsetTop - croprect.offsetHeight+'px'
      croprect.style.left=croprect.offsetLeft+'px'
      croprect.style.right=box.width - croprect.offsetLeft - croprect.offsetWidth+'px'
    }

    function drag(e){
      if(dragging){
        //calculate translation and new croprect size
        let dx = e.x-crop_mouse_pos.x
        let dy = e.y-crop_mouse_pos.y

        /*
          box
           -------------------
          |    _________      |
          |   | rect    |     |
          |    ---------      |
          |___________________|
        */

        // offsetHeight = box.height - offsetTop - offsetBottom +/- dx
        // offsetWidth = box.width - offsetRight - offsetLeft +/- dx


        let corner
        let ar = !!croprect.style.aspectRatio
        
        if(_top) {
          if(!ar) croprect.style.top=Math.max(0,rect.offsetTop+Math.min(dy,rect.offsetHeight-minsize))+'px'
          else{ 
            if(_right||_left) {
              croprect.style.top='auto'
              croprect.style.bottom=box.height - croprect.offsetTop - croprect.offsetHeight + 'px'
            }
          }
        }
        if(_bottom) {
          if(!ar) croprect.style.bottom=Math.max(0,rect.offsetBottom+Math.min(-dy,rect.offsetHeight-minsize))+'px'
          else {
              croprect.style.top=croprect.offsetTop+'px'
              croprect.style.bottom='auto'            
          }
        }
        if(_left) {
          croprect.style.left=Math.max(0,rect.offsetLeft+Math.min(dx,rect.offsetWidth-minsize))+'px'
        }
        if(_right) {
          croprect.style.right=Math.max(0,rect.offsetRight+Math.min(-dx,rect.offsetWidth-minsize))+'px'
        }
        
        if(!_top&&!_bottom&&!_left&&!_right) {
          croprect.style.top=Math.max(0,Math.min(rect.offsetTop+dy, box.height-rect.offsetHeight))+'px'
          croprect.style.bottom=Math.max(0,Math.min(rect.offsetBottom-dy, box.height-rect.offsetHeight))+'px'
          croprect.style.left=Math.max(0,Math.min(rect.offsetLeft+dx, box.width-rect.offsetWidth))+'px'
          croprect.style.right=Math.max(0,Math.min(rect.offsetRight-dx, box.width-rect.offsetWidth))+'px'
        }

      }
    }

    function resetCropRect(){

      const crop = document.getElementById('crop')
      crop.style.width= Math.round(canvas.getBoundingClientRect().width)+'px'
      crop.style.height = Math.round(canvas.getBoundingClientRect().height)+'px'

      if(ar) croprect.style.aspectRatio=ar

      if(!currentcrop) croprect.style.inset='0'
      else {
        const c = currentcrop
        croprect.style.inset=`${c.offsetTop}px ${c.offsetRight}px ${c.offsetBottom}px ${c.offsetLeft}px`
      }

    }
    
  return html`
      <div id="crop" @dblclick="${resetCropRect}">
       <div id="croprect">
          <div class="cropcorner" id="top_left" ></div>
          <div class="cropcorner" id="top_right" ></div>
          <div class="cropcorner" id="bottom_left" ></div>
          <div class="cropcorner" id="bottom_right" ></div>
          <div class="cropcorner" id="left" ></div>
          <div class="cropcorner" id="right" ></div>
          <div class="cropcorner" id="top" ></div>
          <div class="cropcorner" id="bottom" ></div>
        </div>
      </div>
  `

}