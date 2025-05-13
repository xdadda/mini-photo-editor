import { html, reactive } from '@xdadda/mini'
import CC from './components/colorcurve.js'

import section from './__section.js'

export default function curves($selection, _params, onUpdate){
    let params=_params.curve

  ///// COLOR CURVE
    let curve = {
      space:0, //0=all, 1=R, 2=G, 3=B,
      numpoints:5,
      curvepoints: _params.curve?.curvepoints || null, //[ [[x,y],...], null, null, null ]
      modifiedflag: null, //for each colorspace indicates if curve is reset/linear 
      resetFn: null,
    }

    reactive(()=>{
      if($selection.value===null) {
        if(_params.curve?.curvepoints) {
          params=_params.curve
          setCurve(params.curvepoints,[true,true,true,true])
        }
        //updateResetBtn()
      }
    },{effect:true})


    function setCurve(_curvepoints, _curvemodified){
      //just record modified arrays
      curve.curvepoints = _curvemodified.map((e,i)=>e&&_curvepoints[i])
      if(curve.curvepoints.reduce((p,v)=>p+=v,0)===0) params.curvepoints=0 //if all null
      else params.curvepoints=curve.curvepoints
      updateResetBtn()
      onUpdate()
    }

    function resetCurve(){
      if(curve.resetFn) curve.resetFn()
    }

    function updateResetBtn(){
      const el=document.getElementById('btn_reset_curve')
      if(!el) return
      if(curve?.curvepoints?.reduce((p,v)=>p+=v,0) === 0){
        btn_reset_curve?.setAttribute('disabled',true)
      } 
      else btn_reset_curve?.removeAttribute('disabled')
    }
  /////////////////


  return html`
    ${section(
      'curve', 
      190, //height 
      $selection, 
      _params, 
      onUpdate,
      resetCurve, 
      ()=>html`<div class="cc_container">
              ${()=>CC(curve,setCurve)}
          </div>`
      )}
  `
}
