import { html, reactive } from '@xdadda/mini'
import { confirm } from '@xdadda/mini/components'
import '@xdadda/mini/components.css'
import { shareBlob } from '../js/tools.js'

import isMobile from 'ismobilejs';

import miniExif from '@xdadda/mini-exif'

    async function base64ToArrayBuffer(dataURL) {
        const arr = dataURL.split(',');
        const mime = arr[0].match(/:(.*?);/)[1];
        return (fetch(dataURL)
            .then(function (result) {
                return result.arrayBuffer();
            }));
    }


export default async function downloadImage($file,_exif,_minigl, onSave){
        const meta = $file.value;
        const filename=meta.file.name
        const newfilename=reactive(filename.split('.')[0])
        const format=reactive('jpeg')
        const quality=reactive('0.9')

        function handleSelect(e){
          format.value=e.target.value
          //updateName()
        }

        const resp = await confirm(()=>html`
          <div style="margin:10px 0">
                 <div style="height:38px;">${onSave?'Save ':'Download '}image</div>

                  <div style="display:flex;flex-direction:column;font-size:14px;">
                    <div>
                      <input style="width:225px;font-size:14px;" type="text" :value="${()=>newfilename.value}" @change="${(e=>newfilename.value=e.target.value)}" disabled="${!!onSave}">
                      <select style="width:60px;height:29px;font-size:14px;" @change="${handleSelect}">
                        <option value='jpeg' selected>jpeg</option>
                        <option value='png'>png</option>
                      </select>
                    </div>
                   <div style="height:60px;display:flex;justify-content: space-between;align-items: center;">
                      ${()=>format.value==='jpeg' &&html`
                        <div style="display:flex;align-items: center;"> 
                          <label style="color:gray;margin-right:10px;">Quality</label>
                          <input type="range" min="0.1" max="1.0" step="0.1" :value="${()=>quality.value}" @input="${(e)=>quality.value=e.target.value}">
                          <span style="width:30px;text-align:right;">${()=>quality.value.padEnd(3,'.0')}</span>
                        </div>
                      `}
                    </div>
                  </div>
          </div>`)

      if(resp){
        const currentExifData = _exif.extract()
        
        const img = _minigl.captureImage("image/"+format.value, format.value==='jpeg' && parseFloat(quality.value)) //return Image with src=image/jpeg dataUrl
        let imgdataurl =  img.src
        const imgdataArrayBuffer = await base64ToArrayBuffer(imgdataurl)

        const _newexif = miniExif(imgdataArrayBuffer)
        if(currentExifData) {
          //insert original exif data
          _newexif.replace(currentExifData)
          //patch orientation to match canvas (if present in tiff!)
          //[Note: some HEIC viewers don't use EXIF Orientation but HEIC 'irot' data! ]
          if(meta?.tiff?.Orientation) _newexif.patch({area:'tiff',field:'Orientation',value:1})          
        }
        newfilename.value+='.'+format._value
        if(!onSave) {
          const mob = isMobile(window.navigator).any;
          if(mob) shareBlob(newfilename.value,new Blob([_newexif.image()]))
          else _newexif.download(newfilename.value)          
        }
        else {
          onSave(filename,new Blob([_newexif.image()]),format._value)
        }
      }
    }