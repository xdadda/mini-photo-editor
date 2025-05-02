import { html, reactive } from 'mini'
import clickdropFile from './components/clickdropFile.js'
import { readImage } from './js/tools.js'

export default function blender($selection, handleSelection,  adj,onUpdate){
  const params = adj.blend
  const disablerange=reactive(!params.blendmap)
  const blendname = reactive('')

  function resetBlender(){
    params.blendmap=0
    params.blendmix=0.5
    setAdjCtrl('blender_blendmix')
    disablerange.value=true
    blendname.value=''
    if(onUpdate) onUpdate()
    updateResetBtn('blender')
  }

  function onBlend(arrayBuffer, filedata, img){
    if(!img) return
    params.blendmap=img
    blendname.value=filedata?.name
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

  ////
      function setAdj(e){ //id= "section:adj"
      const value = e.target.value
      const id = this.id.split('_')
      params[id[1]]=parseFloat(value)
      if(id.length===3){//it's the number input
        this.previousElementSibling.value=value
      }
      else {//it's the range input
        this.nextElementSibling.value=value
      }
      onUpdate()
      //debounce(pushHistory,500)
      updateResetBtn(id[0])
    }


    function setAdjCtrl(_id){
      const el = document.getElementById(_id)
      if(!el) return
      const id = _id.split('_')
      el.value=params[id[1]]
      el.nextElementSibling.value=el.value
    }

    function resetAdjCtrl(){
      if(!this) return
      const id = this.id.split('_')
      params[id[1]]=0.5
      setAdjCtrl(this.id)
      onUpdate()
      //debounce(pushHistory,500)
      updateResetBtn(id[0])
    }


  return html`
    <style>.btn_insta{width:70px;color: light-dark(white, white);}</style>
    <div class="section" id="blender" :style="${()=>$selection.value==='blender'&&'height:100px;'}">
        <div class="section_header" @click="${()=>$selection.value='blender'}">
          <b class="section_label">blender</b>
          <a id="btn_reset_blender" class="reset_btn" @click="${()=>resetBlender()}" disabled title="reset">\u00D8</a>
        </div>
        ${()=>$selection.value==='blender' && html`
          <div id="blenders" style="font-size: 12px;">
              <hr>
                <div >
                  ${()=>!blendname.value 
                    ? html`${clickdropFile('click or drop<br> to blend file', 'image/*', (file)=>readImage(file, onBlend), 'width:90%; height:50px;')} `
                    : html`
                      <input type="text" :value="${()=>blendname.value}" disabled style="width:90%;margin-bottom:10px;padding-right:20px;">
                      <div style="display:flex;justify-content: space-around;align-items: center;">
                        <label class="rangelabel">blend mix</label>
                        <input id="blender_blendmix" style="width:130px;" type="range" value="${params.blendmix}" min=0 max=1 step=0.01 @input="${setAdj}" @dblclick="${resetAdjCtrl}" :disabled="${()=>disablerange.value}"/>
                        <input id="blender_blendmix_" type="number" class="rangenumb" step=0.01 min=0 max=1 value="${params.blendmix}" @input="${setAdj}" :disabled="${()=>disablerange.value}">
                      </div>
                    `
                  }
                  
                </div>


          </div>

        `}
    </div>
  `
}