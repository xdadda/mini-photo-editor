import { html} from 'mini'



export default function adjustments($selection, handleSelection,  adj, onUpdate){

  ///// ADJUSTMENTS
    function setAdj(e){ //id= "section:adj"
      const value = e.target.value
      const id = this.id.split('_')
      adj[id[0]][id[1]]=parseFloat(value)
      if(id.length===3){//it's the number input
        this.previousElementSibling.value=value
      }
      else {//it's the range input
        this.nextElementSibling.value=value
      }
      onUpdate()
      //debounce(pushHistory,500)
      updateResetBtn(id[0])
    }


    function setAdjCtrl(_id){
      const el = document.getElementById(_id)
      if(!el) return
      const id = _id.split('_')
      el.value=adj[id[0]][id[1]]
      el.nextElementSibling.value=el.value
    }

    function resetAdjCtrl(){
      if(!this) return
      const id = this.id.split('_')
      adj[id[0]][id[1]]=0
      setAdjCtrl(this.id)
      onUpdate()
      //debounce(pushHistory,500)
      updateResetBtn(id[0])
    }

    function resetSection(section){
      if(adj[section].$skip) return
      if(adj[section]) {
        Object.keys(adj[section]).forEach(e=>{
          adj[section][e]=0
          setAdjCtrl(section+'_'+e)
        })
        onUpdate()
      }
      updateResetBtn(section)
    }

    function updateResetBtn(section){
      //if all section's adjustments are set to 0 disable reset
      const el=document.getElementById('btn_reset_'+section)
      if(Object.values(adj[section]).reduce((p,v)=>p+=v,0)===0){
        if(el) el.setAttribute('disabled',true)
      }
      else {
        if(el) el.removeAttribute('disabled')
      }

    }
  /////////////////

  const heights={
    lights:190,
    colors:150,
    effects:105
  }

  function handleSkipSection(e, section){
    e.preventDefault()
    e.stopPropagation()
    const el_btn = document.getElementById('btn_skip_'+section)
    const el_sec = document.getElementById(section)
    const el_div = document.getElementById(section+'_content')

    if(!adj[section].$skip) {
      adj[section].$skip=true
      el_btn?.setAttribute('disabled',true)
      el_sec?.setAttribute('skipped',true)
      el_div?.classList.add('skip')
    }
    else {
      adj[section].$skip=false
      el_btn?.removeAttribute('disabled')
      el_sec?.removeAttribute('skipped')
      el_div?.classList.remove('skip')
      el_sec.style.opacity=''
    }
  }

  return html`
    ${['lights','colors','effects'].map(s=>html`
      <div class="section" id="${s}" :style="${()=>$selection.value===s&&`height:${heights[s]}px;`}">
        <div class="section_header" @click="${()=>handleSelection(s)}">
          <a id="btn_skip_${s}" style="width: 20px;color:darkorange;cursor:cell;" @click="${(e)=>handleSkipSection(e,s)}" title="toggle">\u2609</a>
          <b class="section_label">${s}</b>
          <a id="btn_reset_${s}" class="reset_btn" @click="${()=>resetSection(s)}" disabled title="reset">\u00D8</a>
        </div>

        ${()=>$selection.value===s && html`
          <div id="${s}_content" class="${adj[s]?.$skip?'skip':''}">
            <hr>
            ${Object.keys(adj[s]).filter(e=>!e.startsWith('$')).map(e=>html`

                <div style="display:flex;justify-content: space-around;align-items: center;">
                  <label class="rangelabel">${e}</label>
                  <input id="${s+'_'+e}" style="width:130px;" type="range" value="${adj[s][e]}" min=-1 max=1 step=0.01 @input="${setAdj}" @dblclick="${resetAdjCtrl}"/>
                  <input id="${s+'_'+e+'_'}" type="number" class="rangenumb" step=0.01 min=-1 max=1 value="${adj[s][e]}" @input="${setAdj}">
                </div>

            `)}
          </div>
        `}
      </div>
    `)}
  `
}
