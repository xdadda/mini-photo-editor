import { html } from 'mini'
import CC from './components/colorcurve.js'

export default function curves($selection, handleSelection,  params,onUpdate){

  ///// COLOR CURVE
    let curve = {
      space:0, //0=all, 1=R, 2=G, 3=B
      curvearray:[null,null,null,null],
      reset:null,
    }

    function setCurve(curvearray){
      //if all arrays are null disable reset btn
      if(curvearray.reduce((p,v)=>p+=v,0) === 0 || curvearray===0){
        btn_reset_curve?.setAttribute('disabled',true)
        curvearray=0
      } 
      else btn_reset_curve?.removeAttribute('disabled')
      params.curvearray = curvearray
      onUpdate()
    }

    function resetCurve(){
      if(!curve.reset) return
      curve.reset()
      setCurve(curve.curvearray)
    }
  /////////////////


  return html`
    <div class="section" id="curves">
        <div style="display:flex;justify-content: space-between;cursor:pointer;" @click="${()=>handleSelection('curves')}">
          <b>color curve</b><a id="btn_reset_curve" class="reset_btn" @click="${()=>resetCurve()}" disabled title="reset">\u00D8</a>
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