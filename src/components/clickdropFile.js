import { html } from 'mini'
import { alert } from 'mini/components'

import { openFile } from '../js/tools.js'


//filetype es 'image/*'
export default function clickdropFile(txt, filetype, onFileOpened){


  ///// FILE CLICK
    async function handleClick(){
      const file = await openFile(filetype)
      if(!file) return
      onFileOpened(file)
    }


  ///// FILE DRAG&DROP
    function dropHandler(ev) {
      ev.preventDefault();
      const btn = ev.target
      btn.style.borderColor='';
      if (ev.dataTransfer.items) {
        const item = ev.dataTransfer.items[0];
        if(!item.type.match("^"+filetype.split(',').map(e=>'^'+e).join('|'))) 
          return alert('unknown format')

        const file = item.getAsFile();
        //console.log('file',file);
        onFileOpened(file)
      } else {
        const file = ev.dataTransfer.files[0]
        //console.log('file',file);
        onFileOpened(file)
      }
    }
    function dragOverHandler(ev) {
      //console.log("File(s) in drop zone",ev);
      ev.preventDefault();
      const btn = ev.target
      if(!btn.style.borderColor) btn.style.borderColor='darkorange'
    }
    function dragLeaveHandler(ev) {
      ev.preventDefault();
      const btn = ev.target
      if(btn.style.borderColor) btn.style.borderColor=''
    }
  /////////////////


  return html`
        <button id="clickdrop_btn" 
            @click="${handleClick}"             
            @drop="${dropHandler}"
            @dragover="${dragOverHandler}"
            @dragleave="${dragLeaveHandler}"
        >
          ${txt}
        </button>

  `
}