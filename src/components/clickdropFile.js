import { html } from '@xdadda/mini'
import { alert } from '@xdadda/mini/components'

import { openFile } from '../js/tools.js'


//filetype es 'image/*'
export default function clickdropFile(txt, filetype, onFileOpened, cstyle){


  ///// FILE CLICK
    async function handleClick(){
      try {
        const file = await openFile(filetype)
        if(!file) return
        onFileOpened(file)        
      }
      catch(e){console.error(e)}
    }


  ///// FILE DRAG&DROP
    function dropHandler(ev) {
      ev.preventDefault();
      const btn = ev.target;
      btn.style.borderColor='';
      let file;
      if (ev.dataTransfer.items) {
        const item = ev.dataTransfer.items[0];
        if(!item.type.match("^"+filetype.split(',').map(e=>'^'+e).join('|'))) 
          return alert('unknown format');
        file = item.getAsFile();
      } else {
        file = ev.dataTransfer.files[0];
      }
      onFileOpened(file);
    }
    function dragOverHandler(ev) {
      ev.preventDefault();
      const btn = ev.target;
      if(!btn.style.borderColor) btn.style.borderColor='darkorange';
    }
    function dragLeaveHandler(ev) {
      ev.preventDefault();
      const btn = ev.target;
      if(btn.style.borderColor) btn.style.borderColor='';
    }
  /////////////////


  return html`
        <button id="clickdrop_btn" 
            @click="${handleClick}"             
            @drop="${dropHandler}"
            @dragover="${dragOverHandler}"
            @dragleave="${dragLeaveHandler}"
            style="${cstyle||''}"
        >
          ${txt}
        </button>

  `
}