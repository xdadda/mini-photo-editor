import { html} from 'mini'



export default function adjustments($selection, handleSelection,  adj, onUpdate){

  ///// ADJUSTMENTS
    function setAdj(e){ //id= "section:adj"
      const value = e.target.value
      const id = this.id.split('_')
      adj[id[0]][id[1]]=parseFloat(value)
      this.nextElementSibling.textContent=value
      onUpdate()
      //debounce(pushHistory,500)
      const el=document.getElementById('btn_reset_'+id[0])
      if(el) el.removeAttribute('disabled')
    }

    function setAdjCtrl(_id){
      const el = document.getElementById(_id)
      if(!el) return
      const id = _id.split('_')
      el.value=adj[id[0]][id[1]]
      el.nextElementSibling.textContent=el.value
    }

    function resetAdjCtrl(){
      if(!this) return
      const id = this.id.split('_')
      adj[id[0]][id[1]]=0
      setAdjCtrl(this.id)
      onUpdate()
      //debounce(pushHistory,500)
      //if all section's adjustments are set to 0 disable reset
      if(Object.values(adj[id[0]]).reduce((p,v)=>p+=v,0)===0){
        const el=document.getElementById('btn_reset_'+id[0])
        if(el) el.setAttribute('disabled',true)
      }
    }

    function resetSection(section){
      if(adj[section]) {
        Object.keys(adj[section]).forEach(e=>{
          adj[section][e]=0
          setAdjCtrl(section+'_'+e)
        })
        onUpdate()
      }
      const el=document.getElementById('btn_reset_'+section)
      if(el) el.setAttribute('disabled',true)
    }
  /////////////////


  return html`
    ${['lights','colors','effects'].map(s=>html`
      <div class="section" id="${s}">
        <div style="display:flex;justify-content: space-between;cursor:pointer;" @click="${()=>handleSelection(s)}">
          <b>${s}</b><a id="btn_reset_${s}" class="reset_btn" @click="${()=>resetSection(s)}" disabled title="reset">\u00D8</a>
        </div>

        ${()=>$selection.value===s && html`
          <div>
            <hr>
            ${Object.keys(adj[s]).map(e=>html`

                <div style="display:flex;justify-content: space-around;align-items: center;">
                  <label style="width:100px;text-align:left;color:gray;">${e}</label>
                  <input id="${s+'_'+e}" style="width:130px;" type="range" value="${adj[s][e]}" min=-1 max=1 step=0.01 @input="${setAdj}" @dblclick="${resetAdjCtrl}"/>
                  <span style="width:40px;text-align:right;color:gray;">${adj[s][e]}</span>
                </div>

            `)}
          </div>
        `}
      </div>
    `)}
  `
}
