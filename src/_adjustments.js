import { html} from 'mini'
import section from './__section.js'


export default function adjustments($selection, params, onUpdate){

  const heights={
    lights:190,
    colors:150,
    effects:105
  }
  
  /////////////////////////////
    function resetSection(section){
      if(params[section].$skip) return
      Object.keys(params[section]).forEach(e=>{
        params[section][e]=0
        updateParamCtrl(section+'_'+e)
      })
      onUpdate()
      updateResetBtn(section)
    }

    function updateResetBtn(section){
      //if all section's params are set to 0 disable reset
      const el=document.getElementById('btn_reset_'+section)
      if(Object.values(params[section]).reduce((p,v)=>p+=v,0)===0){
        if(el) el.setAttribute('disabled',true)
      }
      else {
        if(el) el.removeAttribute('disabled')
      }

    }
  /////////////////////////////


  ///// RANGE INPUT FN ////////
    function setParam(e){ //id= "section_field"
      const value = e.target.value
      const id = this.id.split('_')
      params[id[0]][id[1]]=parseFloat(value)
      updateParamCtrl(this.id)
      onUpdate()
      updateResetBtn(id[0])
    }

    function updateParamCtrl(_id){
      const el = document.getElementById(_id)
      if(!el) return
      const id = _id.split('_')
      el.value=params[id[0]][id[1]]
      el.nextElementSibling.value=el.value
    }

    function resetParamCtrl(){
      if(!this) return
      const id = this.id.split('_')
      params[id[0]][id[1]]=0
      updateParamCtrl(this.id)
      onUpdate()
      updateResetBtn(id[0])
    }
  /////////////////////////////


  return html`
    ${['lights','colors','effects'].map(secname=>html`

        ${section(
            secname, 
            heights[secname], 
            $selection, 
            params, 
            onUpdate,
            ()=>resetSection(secname), 
            ()=>html`
                    <div >
                      ${Object.keys(params[secname]).filter(e=>!e.startsWith('$')).map(e=>html`
                          /* RANGE INPUTS */
                          <div style="display:flex;justify-content: space-around;align-items: center;">
                            <label class="rangelabel">${e}</label>
                            <input id="${secname+'_'+e}"      type="range"  style="width:130px;"  value="${params[secname][e]}" min=-1 max=1 step=0.01 @input="${setParam}" @dblclick="${resetParamCtrl}">
                            <input id="${secname+'_'+e+'_'}"  type="number" class="rangenumb"     value="${params[secname][e]}" min=-1 max=1 step=0.01 @input="${setParam}">
                          </div>

                      `)}
                    </div>
          `)}



    `)}
  `
}





