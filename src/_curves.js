import { html } from 'mini'
import CC from './components/colorcurve.js'

import section from './__section.js'

export default function curves($selection, _params, onUpdate){
    const params=_params.curve
  ///// COLOR CURVE
    let curve = {
      space:0, //0=all, 1=R, 2=G, 3=B,
      numpoints:5,
      curvepoints: null, //[ [[x,y],...], null, null, null ]
      modifiedflag: null, //for each colorspace indicates if curve is reset/linear 
      resetFn: null,
    }

    function setCurve(_curvepoints, _curvemodified){
      //just record modified arrays
      curve.curvepoints = _curvemodified.map((e,i)=>e&&_curvepoints[i])

      //update resetBtn
      if(curve.curvepoints.reduce((p,v)=>p+=v,0) === 0){
        btn_reset_curve?.setAttribute('disabled',true)
      } 
      else btn_reset_curve?.removeAttribute('disabled')

      params.curvepoints = curve.curvepoints
      onUpdate()
    }

    function resetCurve(){
      if(curve.resetFn) curve.resetFn()
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
