import { html} from 'mini'
import section from './__section.js'

export default function resizer($selection, params, onUpdate, centerCanvas){





  function resize(newwidth,newheight){
    resize_width.value=params.resizer.width=newwidth
    resize_height.value=params.resizer.height=newheight
    //centerCanvas()
    onUpdate()
  }


  function resetResizer(){
    params.resizer.width=0
    params.resizer.height=0
  }

  function setWidth(){
    const ar = canvas.width/canvas.height
    const width=Math.max(100,this.value)
    const height=Math.floor(width/ar)
    resize(width,height)
  }
  function setHeight(){
    const ar = canvas.width/canvas.height
    const height=Math.max(100,this.value)
    const width=Math.floor(height*ar) 
    resize(width,height)
  }

  return html`
    ${section(
      'resizer',    //section name
      75,          //section height
      $selection,
      params, 
      onUpdate,
      resetResizer, 
      ()=>html`<div style="color:grey">
            <input id="resize_width" type="number" value="${canvas.width}" style="text-align:center" @change="${setWidth}"> 
            x 
            <input id="resize_height" type="number" value="${canvas.height}" style="text-align:center" @change="${setHeight}">
          </div>`
      )}

  `
}
