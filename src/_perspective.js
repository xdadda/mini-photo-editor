import { html, reactive, onMount } from '@xdadda/mini'
import section from './__section.js'
import Perspective from './components/perspective2.js'


export default function _perspective($selection, params, onUpdate){
  let prevselection

  reactive(()=>{

    if($selection.value==='perspective2'){
      prevselection=$selection.value
      //Do something
      //center canvas
    }
    else if(prevselection==='perspective2') {
        //Do something else
    }
  },{effect:true})


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
      if(checkParamszero(section)) el.setAttribute('disabled',true)
      else el.removeAttribute('disabled')
    }
  /////////////////

  ///// PERSPECTIVE v2
    let persp2=reactive(false)
    //let perspel
    async function showPerspective2(){
      console.log('show',params.perspective2)
      persp2.value=params.perspective2
    }
    function hidePerspective2(){
      persp2.value=false
    }
    function togglePerspective2(){
      console.log('toggle')
      if(persp2.value) hidePerspective2()
      else showPerspective2()
    }
    function lockPerspective2(){
      console.log('lock',params.perspective2)
      if(!params.perspective2.before) return
      params.perspective2.after=0
      persp2.value=false
      persp2.value=params.perspective2
    }
    function unlockPerspective2(){
      params.perspective2.before=0
      params.perspective2.after=0
      persp2.value=false
      persp2.value=params.perspective2
    }
  /////////////////


  return html`
    ${section(
      'perspective2', 
      150, 
      $selection,       //signal with active sectioname, that opens/closes section
      params,           //section's params obj of which $skip field will be set on/off
      null,             //called when section is enabled/disabled
      resetSection,     //section name provided to onReset
      ()=>html`
            <style>
              .close_btn {display:none !important;}
            </style>

            <button class="done_btn" @click="${()=>$selection.value=''}">done</button>

            <hr>
              /* PERSPECTIVE V2 */
              Perspective <button @click="${togglePerspective2}">toggle</button> 
              <button @click="${unlockPerspective2}">unlock ctrl</button> 
              <button @click="${lockPerspective2}">lock ctrl</button>

            ${()=>persp2.value && html`${Perspective(canvas,persp2.value,()=>{updateResetBtn();onUpdate()})}`}


      `)}



  `
}
