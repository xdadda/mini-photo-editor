import { html, reactive } from '@xdadda/mini'
import { confirm } from '@xdadda/mini/components'
import section from './__section.js'
import {openFile, downloadFile} from './js/tools.js'

export default function recipes($selection, params, onUpdate){

  let save_btn_disabled=true

  reactive(()=>{
    if($selection.value==="recipes"){
      const recipe=buildRecipe()
      if(Object.keys(recipe).length) save_btn_disabled=false
      else save_btn_disabled=true
    }
  },{effect:true})
  /////////////////////////////

    function buildRecipe(){
      //const recipe = {}
      const recipe = {}
      const list = ['colors','curve','lights','effects'].forEach(e=>{
        const x = Object.keys(params[e]).reduce((p,v)=>{ if(params[e][v]) p[v]=params[e][v];return p }, {})
        if(Object.keys(x).length) recipe[e]=x
        })

      if(params.blur.bokehstrength || params.blur.gaussianstrength) recipe.blur=params.blur
      if(params.filters?.opt?.label) recipe.filters=params.filters.opt.label
      return recipe      
    }

    async function saveRecipe(){

      const recipe=buildRecipe()
      if(!Object.keys(recipe).length) return

      const newfilename=reactive('recipe_'+new Date().toISOString().split('T')[0]+'.json')

        const resp = await confirm(()=>html`
          <div style="margin:10px 0">
                 <div style="height:38px;">Download recipe</div>

                  <div style="display:flex;flex-direction:column;font-size:14px;">
                    <div>
                      <input style="width:225px;font-size:14px;" type="text" :value="${()=>newfilename.value}" @change="${(e=>newfilename.value=e.target.value)}">
                    </div>
                  </div>
          </div>`)
      if(!resp) return

      const bytes = new TextEncoder().encode(JSON.stringify(recipe));
      const blob = new Blob([bytes], {
          type: "application/json;charset=utf-8"
      });
      downloadFile(blob,newfilename.value)
    }

    async function loadRecipe(){
      const f = await openFile('application/json')
      if(!f) return
      const reader= new FileReader()
      await new Promise(r=> reader.onload=r, reader.readAsText(f))
      
      const json = JSON.parse(reader.result)

      const list = ['colors','curve','lights','effects','blur'].forEach(e=>{
        if(json[e]) params[e] = {...params[e],...json[e]}
      })
      if(json.filters) params.filters.label=json.filters
      $selection.value=null
      onUpdate()
    }
    

  return html`
    ${section(
      'recipes', 
      125, 
      $selection,       //signal with active sectioname, that opens/closes section
      params,           //section's params obj of which $skip field will be set on/off
      null,             //called when section is enabled/disabled; null to hide disable button
      null,     //section name provided to onReset
      ()=>html` 
        <div>
          <button @click="${loadRecipe}">load</button>
          <button id="save_btn" @click="${saveRecipe}" disabled="${save_btn_disabled}">save</button>
        </div>
        <div><small>will save: <i>lights, colors, effects, curve, filters and blur</i></small></div>
      `)}
  `
}




