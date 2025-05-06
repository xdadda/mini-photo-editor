import { alert } from 'mini/components'

//////// DEBOUNCE //////////////////////
  export const timerids = new Map();
  export function debounce(id,cb,delay=100){
    if(timerids.has(id)) {
      //console.log('debouncing,...',id)
    }
    else {
      const t = setTimeout(()=>{cb();timerids.delete(id);},delay)
      timerids.set(id,t)      
    }
  }
////////////////////////////////////////

//////// FILE FUNCS ////////////////////

  export async function openFile(ext){
    let input = document.createElement('input');
    try{
      input.setAttribute("hidden", "");
      input.type = 'file';
      input.value=null;
      if(ext) input.accept=ext;
      document.body.appendChild(input); // doesn't work reliably in Safari if the input is not in the DOM!?
      const ev=await new Promise(r=> {input.onchange=r; input.oncancel=r; input.click()} );
      input.remove();
      if(ev.type==='cancel') return
      const file = ev.target.files[0];
      if(!file) return await alert('File not recognized!')
      //if(file.size>60*1024*1024) return await alert('Upload files smaller than 60MB!')
      return file
    } catch(error){
      await alert('Error opening file')
      console.error(error)
    }
  }

  export function downloadFile(blob, name){
    if(!blob || !name) return console.error('download missing inputs')
    try {
      var el = document.createElement('a')
      el.href = URL.createObjectURL(blob)
      el.download = name
      el.click()
    } catch(error){
      console.error(error)
    }
  }

  export async function readImage(file, onLoaded=null){
    try {
      if(!file) return
      const reader= new FileReader()
      await new Promise(r=> reader.onload=r, reader.readAsArrayBuffer(file))
      const {name,size,type,lastModified} = file;
      const blob = new Blob([reader.result],{type})
      const img = new Image();
      img.src=URL.createObjectURL(blob);
      await img.decode();
  
      if(onLoaded) onLoaded(reader.result, {name,size,type,lastModified}, img)

    } catch(error){
      console.error(error)
      await alert('Unknown format')
    }
  }


  export function filesizeString(fileSizeInBytes) {
    var i = -1;
    var byteUnits = [' kB', ' MB', ' GB', ' TB', 'PB', 'EB', 'ZB', 'YB'];
    do {fileSizeInBytes /= 1024;i++;} while (fileSizeInBytes > 1024);
    return Math.max(fileSizeInBytes, 0.1).toFixed(1) + byteUnits[i];
  }

////////////////////////////////////////
