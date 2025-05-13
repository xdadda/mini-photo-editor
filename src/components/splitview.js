import { html, onMount, onUnmount} from '@xdadda/mini'
import './splitview.css'

export default function SplitView(image, stylewidth, styleheight, splitwidth, onUpdate) {

    onMount(()=>{
      resetSplitRect(splitwidth)    
      splitview_container.addEventListener("pointerdown", dragstart);
    })

    onUnmount(()=>{
      splitview_container.removeEventListener("pointerdown", dragstart);
    })

    function resetSplitRect(splitw){
      if(!splitw) splitwidth=0.5

      splitview.src=image.src
      splitview.width=image.width
      splitview.height=image.height
      splitview_container.style.width=stylewidth
      splitview_container.style.height=styleheight
      splitview_container.style.aspectRatio='auto '+image.width+'/'+image.height
      splitview.style.clipPath=`inset(0px ${(1-splitwidth)*100}% 0px 0px)`
      splitview_bar.style.left=`calc(${(splitwidth)*100}% - 5px)`

    }

    let dragging=false, _x
    
    function dragstart(e){
      dragging=true
      splitview_container.setPointerCapture(e.pointerId)
      splitview_container.addEventListener("pointermove", drag);
      splitview_container.addEventListener("pointerup", dragstop);
      _x=e.clientX
    }
    
    function dragstop(e){
      dragging=false
      splitview_container.releasePointerCapture(e.pointerId)
      splitview_container.removeEventListener("pointermove", drag);
      splitview_container.removeEventListener("pointerup", dragstop);
      if(onUpdate) onUpdate(splitwidth)
    }

    function drag(e){
      if(dragging){
          e.preventDefault()
          e.stopPropagation()
          //RESIZE SPLITVIEW
          const splitscale = 1/splitview_container.clientWidth
          const parentscale=zoomable.style.transform.match(/scale\((.*?)\)/)?.[1].split(',').map(e=>parseFloat(e))[0] || 1
          //console.log(e.x,e.clientX,e.clientX-_x)
          splitwidth += (e.clientX-_x)*splitscale/parentscale
          _x=e.clientX
          splitwidth =  Math.max(0.1,Math.min(0.9,splitwidth)) //clip
          splitview.style.clipPath=`inset(0px ${(1-splitwidth)*100}% 0px 0px)`
          splitview_bar.style.left=`calc(${(splitwidth)*100}% - 5px)`
      }
    }


  return html`
    <div id="splitview_container">
      <img id="splitview"></img>
      <div id="splitview_bar"></div>
    </div>
  `
}
