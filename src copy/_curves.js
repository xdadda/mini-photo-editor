import { html } from 'mini'
import CC from './components/colorcurve.js'

export default function curves($selection, handleSelection,  params,onUpdate){

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
    <div class="section" id="curves" :style="${()=>$selection.value==='curves'&&'height:175px;'}">
        <div class="section_header" @click="${()=>handleSelection('curves')}">
          <b class="section_label">color curve</b>
          <a id="btn_reset_curve" class="reset_btn" @click="${resetCurve}" disabled title="reset">\u00D8</a>
        </div>
        ${()=>$selection.value==='curves' && html`
          <div>
              <hr>
              ${()=>CC(curve,setCurve)}
          </div>
        `}
    </div>


  `
}

/*

    <div>
      <hr>
        ${()=>CC(curve,setCurve)}
    </div>

*/