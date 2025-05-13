import { html, reactive } from '@xdadda/mini'
import clickdropFile from './components/clickdropFile.js'
import { readImage } from './js/tools.js'
import section from './__section.js'
import {debounce} from './js/tools.js'

export default function blender($selection, _params, onUpdate){
  const params = _params.blender
  const disablerange=reactive(!params.blendmap)
  const blendname = reactive('')

  function resetBlender(){
    if(params.$skip) return
    params.blendmap=0
    params.blendmix=0.5
    updateParamCtrl('blender_blendmix')
    disablerange.value=true
    blendname.value=''
    if(onUpdate) onUpdate()
    updateResetBtn('blender')
  }

  function onBlend(arrayBuffer, filedata, img){
    if(!img) return
    img.filename = filedata?.name
    params.blendmap=img
    blendname.value=filedata?.name
    params.blendmix=0.5
    disablerange.value=false
    if(onUpdate) onUpdate()
    updateResetBtn('blender')
  }

  function updateResetBtn(section){
    //if all section's adjustments are set to 0 disable reset
    const el=document.getElementById('btn_reset_'+section)
    if(params.blendmap===0){
      if(el) el.setAttribute('disabled',true)
    }
    else {
      if(el) el.removeAttribute('disabled')
    }
  }

  ///// RANGE INPUT FN ////////
      function _setParam(e){
        debounce('param',()=>setParam.call(this,e),30)
      }
      function setParam(e){ //id= "section_param"
      const value = e.target.value
      const id = this.id.split('_')
      params[id[1]]=parseFloat(value)
      updateParamCtrl(this.id)
      onUpdate()
      updateResetBtn(id[0])
    }

    function updateParamCtrl(_id){
      const el = document.getElementById(_id)
      if(!el) return
      const id = _id.split('_')
      el.value=params[id[1]]
      if(id.length===3){//it's the number input
        el.previousElementSibling.value=el.value
      }
      else {//it's the range input
        el.nextElementSibling.value=el.value
      }
    }

    function resetParamCtrl(){
      if(!this) return
      const id = this.id.split('_')
      params[id[1]]=0.5
      updateParamCtrl(this.id)
      onUpdate()
      updateResetBtn(id[0])
    }
  /////////////////////////////

  return html`
    ${section(
      'blender', 
      100, 
      $selection, 
      _params, 
      onUpdate,
      resetBlender, 
      html`<div >
            ${()=>!blendname.value 
              ? html`${clickdropFile('click or drop<br> to blend file', 'image/*', (file)=>readImage(file, onBlend), 'width:90%; height:50px;')} `
              : html`
                <input type="text" :value="${()=>blendname.value}" disabled style="width:90%;margin-bottom:10px;padding-right:20px;">
                /* RANGE INPUT */
                <div style="display:flex;justify-content: space-around;align-items: center;">
                  <div class="rangelabel">blend mix</div>
                  <input id="blender_blendmix" style="width:130px;" type="range" value="${params.blendmix}" min=0 max=1 step=0.01 @input="${_setParam}" @dblclick="${resetParamCtrl}" :disabled="${()=>disablerange.value}"/>
                  <input id="blender_blendmix_" type="number" class="rangenumb" step=0.01 min=0 max=1 value="${params.blendmix}" @input="${_setParam}" :disabled="${()=>disablerange.value}">
                </div>
              `
            }                
          </div>`
      )}
  `
}




