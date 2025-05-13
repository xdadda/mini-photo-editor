import { html, reactive } from '@xdadda/mini'
import section from './__section.js'
import {debounce} from './js/tools.js'


export default function adjustments($selection, params, onUpdate){

  const heights={
    lights:190,
    colors:150,
    effects:105
  }

  reactive(()=>{
    if($selection.value===null) {
      //app has been reset, new values loaded
      ['lights','colors','effects'].forEach(s=>updateResetBtn(s))
    }
  },{effect:true})
  
  /////////////////////////////

  ///// SECTION HANDLING FN ////////
    function checkParamszero(section) {
      return Object.values(params[section]).reduce((p,v)=>p+=v,0)===0
    }
    function resetParamsToZero(section) {
      for (const key of Object.keys(params[section])) {
        params[section][key]=0
        updateParamCtrl(section+'_'+key)            
      }
    }

    function resetSection(section){
      resetParamsToZero(section)
      onUpdate()
      updateResetBtn(section)
    }

    function updateResetBtn(section){
      const el=document.getElementById('btn_reset_'+section)
      if(!el) return
      //if all section's params are set to default values disable reset
      if(checkParamszero(section)) el.setAttribute('disabled',true)
      else el.removeAttribute('disabled')
    }
  /////////////////////////////


  ///// RANGE INPUT FN ////////
    function _setParam(e){
      debounce('param',()=>setParam.call(this,e),30)
    }
    function setParam(e){ //id= "section_field"
      const value = e.target.value
      const id = this.id.split('_')
      params[id[0]][id[1]]=parseFloat(value)
      updateParamCtrl(this.id)
      onUpdate()
      updateResetBtn(id[0])
    }

    function updateParamCtrl(_id){
      const el = document.getElementById(_id)
      if(!el) return
      const id = _id.split('_')
      el.value=params[id[0]][id[1]]
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
      params[id[0]][id[1]]=0
      updateParamCtrl(this.id)
      onUpdate()
      updateResetBtn(id[0])
    }
  /////////////////////////////


  return html`
    ${['lights','colors','effects'].map(secname=>html`

        ${section(
            secname,          //section's name
            heights[secname], // section's height once open
            $selection,       //signal with active sectioname, that opens/closes section
            params,           //section's params obj of which $skip field will be set on/off
            onUpdate,         //called when section is enabled/disabled
            resetSection,     //section name provided to onReset
            ()=>html`${Object.keys(params[secname]).filter(e=>!e.startsWith('$')).map(e=>html`
                          /* RANGE INPUTS */
                          <div style="display:flex;justify-content: space-around;align-items: center;">
                            <div class="rangelabel">${e}</div>
                            <input id="${secname+'_'+e}"      type="range"  style="width:130px;"  value="${params[secname][e]}" min=-1 max=1 step=0.01 @input="${_setParam}" @dblclick="${resetParamCtrl}">
                            <input id="${secname+'_'+e+'_'}"  type="number" class="rangenumb"     value="${params[secname][e]}" min=-1 max=1 step=0.01 @input="${_setParam}">
                          </div>

                      `)}
            `)}



    `)}
  `
}





