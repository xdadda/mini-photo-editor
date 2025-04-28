import { html } from 'mini'


export default function perspective($selection, handleSelection,  params,onUpdate){



  function resetPerspective(){
    const quadcontainer = document.getElementById('quadcontainer')
    if(!quadcontainer) return
    params.resetFn()
  }

  return html`
    <div class="section" id="perspective" :style="${()=>$selection.value==='perspective'&&'height:175px;'}">
        <div style="display:flex;justify-content: space-between;cursor:pointer;" @click="${()=>handleSelection('perspective')}">
          <b>perspective</b><a id="btn_reset_perspective" class="reset_btn" @click="${()=>resetPerspective()}" disabled title="reset">\u00D8</a>
        </div>
        ${()=>$selection.value==='perspective' && html`
          <div>

          </div>
        `}
    </div>


  `
}
