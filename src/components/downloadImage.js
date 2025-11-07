import { html, reactive } from '@xdadda/mini'
import { confirm } from '@xdadda/mini/components'
import '@xdadda/mini/components.css'
import { shareBlob } from '../js/tools.js'

import isMobile from 'ismobilejs';

import miniExif from '@xdadda/mini-exif'

// Detect if running in Tauri
const isTauri = typeof window !== 'undefined' && window.__TAURI_INTERNALS__ !== undefined

    async function base64ToArrayBuffer(dataURL) {
        const arr = dataURL.split(',');
        const mime = arr[0].match(/:(.*?);/)[1];
        return (fetch(dataURL)
            .then(function (result) {
                return result.arrayBuffer();
            }));
    }

    // Save file using Tauri's native save dialog
    async function saveTauriFile(filename, blob, originalPath) {
        try {
            // Import Tauri APIs dynamically
            const { save } = await import('@tauri-apps/plugin-dialog');
            const { writeFile } = await import('@tauri-apps/plugin-fs');

            // Use original path if available, otherwise just filename
            const defaultPath = originalPath || filename;

            // Show native save dialog
            const filePath = await save({
                defaultPath: defaultPath
            });

            // User cancelled the dialog
            if (!filePath) return false;

            // Convert blob to array buffer
            const arrayBuffer = await blob.arrayBuffer();
            const uint8Array = new Uint8Array(arrayBuffer);

            // Write file using Tauri's fs API
            await writeFile(filePath, uint8Array);

            return true;
        } catch (error) {
            console.error('Error saving file with Tauri:', error);
            return false;
        }
    }


export default async function downloadImage($file,_exif,_minigl, onSave){
        const meta = $file.value;
        const filename=meta.file.name

        // Detect original format from filename and preserve exact case
        const filenameParts = filename.split('.');
        const fileExtOriginalCase = filenameParts.pop(); // Get extension with original case
        const fileExt = fileExtOriginalCase.toLowerCase();
        const originalFormat = (fileExt === 'png') ? 'png' : 'jpeg';

        const newfilename=reactive(filenameParts.join('.'))
        const format=reactive(originalFormat)
        const quality=reactive('0.9')

        function handleSelect(e){
          format.value=e.target.value
          //updateName()
        }

        // In Tauri mode, skip dialog and save directly
        let resp = true;
        if (!isTauri) {
          resp = await confirm(()=>html`
            <div style="margin:10px 0">
                   <div style="height:38px;">${onSave?'Save ':'Download '}image</div>

                    <div style="display:flex;flex-direction:column;font-size:14px;">
                      <div>
                        <input style="width:225px;font-size:14px;" type="text" :value="${()=>newfilename.value}" @change="${(e=>newfilename.value=e.target.value)}" disabled="${!!onSave}">
                        <select style="width:60px;height:29px;font-size:14px;" @change="${handleSelect}">
                          <option value='jpeg' ${originalFormat === 'jpeg' ? 'selected' : ''}>jpeg</option>
                          <option value='png' ${originalFormat === 'png' ? 'selected' : ''}>png</option>
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
        }

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
        // Build final filename with original extension case preserved
        const finalExtension = format._value === originalFormat ? fileExtOriginalCase : format._value;
        newfilename.value+='.'+finalExtension

        if(!onSave) {
          const blob = new Blob([_newexif.image()]);

          // Use Tauri's native save dialog if running in Tauri
          if(isTauri) {
            // Pass original file path if available
            const originalPath = meta.file.path || newfilename.value;
            await saveTauriFile(newfilename.value, blob, originalPath);
          }
          // Mobile: use native share
          else if(isMobile(window.navigator).any) {
            shareBlob(newfilename.value, blob);
          }
          // Web: use browser download
          else {
            _newexif.download(newfilename.value);
          }
        }
        else {
          onSave(filename,new Blob([_newexif.image()]),format._value)
        }
      }
    }