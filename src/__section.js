import { html, reactive, onMount, onUnmount } from '@xdadda/mini'


//Note: if onEnable notdefined/null the enable/disable button will not be visible
export default function section(sectionname, height, $selection, params, onEnable, onReset, sectionComponent){


    function resetSection(){
      if(params[sectionname]?.$skip) return
      if(onReset) onReset(sectionname)
    }

    function handleSkipSection(e){
      e.preventDefault()
      e.stopPropagation()
      const el_btn = document.getElementById('btn_skip_'+sectionname)
      const el_sec = document.getElementById(sectionname)
      const el_div = document.getElementById(sectionname+'_content')

      if(!params[sectionname].$skip) {
        //disable section
        params[sectionname].$skip=true
        el_btn?.setAttribute('disabled',true)
        el_sec?.setAttribute('skipped',true)
        el_div?.classList.add('skip')
        onEnable(false)
      }
      else {
        //enable section
        params[sectionname].$skip=false
        el_btn?.removeAttribute('disabled')
        el_sec?.removeAttribute('skipped')
        el_div?.classList.remove('skip')
        el_sec.style.opacity=''
        onEnable(true)
      }
    }


  return html`
    <div class="section" id="${sectionname}" :style="${()=>$selection.value===sectionname&&`height:${height}px;`}" :selected="${()=>$selection.value===sectionname}" @click="${(e)=>{e.stopPropagation();$selection.value=sectionname}}">
        <div class="section_header" >
          ${!!onEnable && html`<a id="btn_skip_${sectionname}" class="section_skip" @click="${handleSkipSection}" title="toggle">\u2609</a>`}
          <b class="section_label">${sectionname}</b>
          ${!!onReset && html`<a id="btn_reset_${sectionname}" class="reset_btn" @click="${resetSection}" disabled title="reset">\u00D8</a>`}
        </div>

        ${()=>$selection.value===sectionname && html`
          <div id="${sectionname}_content" class="section_content ${params[sectionname]?.$skip?'skip':''}" @click="${(e)=>e.stopPropagation()}">
            <div class="section_scroll">
              <hr>
              <button class="close_btn" @click="${()=>$selection.value=''}">X</button>
              ${sectionComponent}
            </div>
          </div>
        `}
    </div>`
}

