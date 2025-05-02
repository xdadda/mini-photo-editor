import { html, reactive } from 'mini'

export default function section(sectionname, height, $selection, params, onUpdate, onReset, sectionComponent){


    function resetSection(){
      if(params[sectionname].$skip) return
      if(onReset) onReset()
    }

    function handleSkipSection(e){
      e.preventDefault()
      e.stopPropagation()
      const el_btn = document.getElementById('btn_skip_'+sectionname)
      const el_sec = document.getElementById(sectionname)
      const el_div = document.getElementById(sectionname+'_content')

      if(!params[sectionname].$skip) {
        params[sectionname].$skip=true
        el_btn?.setAttribute('disabled',true)
        el_sec?.setAttribute('skipped',true)
        el_div?.classList.add('skip')
      }
      else {
        params[sectionname].$skip=false
        el_btn?.removeAttribute('disabled')
        el_sec?.removeAttribute('skipped')
        el_div?.classList.remove('skip')
        el_sec.style.opacity=''
      }
      onUpdate()
    }

  return html`
    <div class="section" id="${sectionname}" :style="${()=>$selection.value===sectionname&&`height:${height}px;`}" :selected="${()=>$selection.value===sectionname}">
        <div class="section_header" @click="${()=>$selection.value=sectionname}">
          <a id="btn_skip_${sectionname}" class="section_skip" @click="${handleSkipSection}" title="toggle">\u2609</a>
          <b class="section_label">${sectionname}</b>
          <a id="btn_reset_${sectionname}" class="reset_btn" @click="${resetSection}" disabled title="reset">\u00D8</a>
        </div>

        ${()=>$selection.value===sectionname && html`
          <div id="${sectionname}_content" class="${params[sectionname]?.$skip?'skip':''}" style="position:relative;">
            <hr>
            ${sectionComponent}
          </div>
        `}
    </div>`
}