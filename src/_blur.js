import { html, reactive } from '@xdadda/mini'
import section from './__section.js'
import {debounce} from './js/tools.js'
import canvasMouse from './components/canvasmouse.js'
import {centerCanvas} from './app.js'

export default function blur($selection, params, onUpdate){

    const paramszero = { bokehstrength:0, bokehlensout:0.5, gaussianstrength:0, centerX:0.5, centerY:0.5}
    //first setup
    if(!checkParamszero('blur')) resetParamsToZero('blur')

    const showmouse=reactive(false)
    reactive(()=>{
      if($selection.value==='blur'){
        showmouse.value=[[params.blur.centerX,params.blur.centerY]]
        centerCanvas()
      }
      else {
        showmouse.value=false
        if($selection.value===null) updateResetBtn('blur')
      }
    },{effect:true})

    function onMouseMove(pts){
      params.blur.centerX=pts[0][0]
      params.blur.centerY=pts[0][1]
      onUpdate()
    }

  /////////////////////////////

  ///// SECTION HANDLING FN ////////
    function checkParamszero(section) {
      for (const key of Object.keys(paramszero)) {
        if (!(key in params[section]) || params[section][key] !== paramszero[key]) return false
      }
      return true
    }
    function resetParamsToZero(section) {
      for (const key of Object.keys(paramszero)) {
          if (params[section][key] !== paramszero[key]) {
            params[section][key]=paramszero[key]
            updateParamCtrl(section+'_'+key)            
          };
      }
    }

    function resetSection(section){
      resetParamsToZero(section)
      onUpdate()
      updateResetBtn(section)
      //switch mousefilter on/off to update position .. bit hacky but for now it works
      showmouse.value=false 
      showmouse.value=[[params.blur.centerX,params.blur.centerY]]
    }

    function updateResetBtn(section){
      const el=document.getElementById('btn_reset_'+section)
      if(!el) return
      //if all section's params are set to default values disable reset
      if(checkParamszero(section)) el.setAttribute('disabled',true)
      else el.removeAttribute('disabled')
    }

    //flag: true when section enabled, false when disabled
    function onEnableSection(flag){
      if(flag) centerCanvas()
      onUpdate()
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
    ${section(
      'blur', 
      125, 
      $selection,       //signal with active sectioname, that opens/closes section
      params,           //section's params obj of which $skip field will be set on/off
      onEnableSection,  //called when section is enabled/disabled
      resetSection,     //section name provided to onReset
      ()=>html` /* mouse canvas */
                <style>.point{background-color:red !important;border:2px solid darkorange;}</style>
                ${()=>showmouse.value && canvasMouse(canvas,showmouse.value,onMouseMove)}

                ${['bokehstrength','gaussianstrength','bokehlensout'].filter(e=>!e.startsWith('$')).map((e,idx)=>html`
                    /* RANGE INPUTS */
                    <div style="display:flex;justify-content: space-around;align-items: center;">
                      <div class="rangelabel">${['bokeh strength','gauss strength','cirble radius'][idx]}</div>
                      <input id="${'blur'+'_'+e}"      type="range"  style="width:130px;"  value="${params['blur'][e]}" min=0 max=1 step=0.01 @input="${_setParam}" @dblclick="${resetParamCtrl}">
                      <input id="${'blur'+'_'+e+'_'}"  type="number" class="rangenumb"     value="${params['blur'][e]}" min=0 max=1 step=0.01 @input="${_setParam}">
                    </div>

                `)}
                <div style="text-align:left;color:gray;"><i>(center red dot)</i></div>
      `)}
  `
}




