import { html, reactive } from '@xdadda/mini'
import icon_shutter_rotate from './assets/icon_shutter_rotate.svg?raw'

import section from './__section.js'


  const filtersLUT = [
    {type:'1',label:'aden', map1: async()=> import('./assets/LUT/LUT_aden.png')},
    {type:'1',label:'crema', map1: async()=> import('./assets/LUT/LUT_crema.png')},
    {type:'2',label:'clarendon', map1: async()=> import('./assets/LUT/LUT_clarendon1.png'), map2: async()=> import('./assets/LUT/LUT_clarendon2.png')},
    {type:'3',label:'gingham', map1: async()=> import('./assets/LUT/LUT_gingham1.png'), map2: async()=> import('./assets/LUT/LUT_gingham_lgg.png')},
    {type:'1',label:'juno', map1: async()=> import('./assets/LUT/LUT_juno.png')},
    {type:'1',label:'lark', map1: async()=> import('./assets/LUT/LUT_lark.png')},
    {type:'1',label:'ludwig', map1: async()=> import('./assets/LUT/LUT_ludwig.png')},
    {type:'4',label:'moon', map1: async()=> import('./assets/LUT/LUT_moon1.png'), map2: async()=> import('./assets/LUT/LUT_moon2.png')},
    {type:'1',label:'reyes', map1: async()=> import('./assets/LUT/LUT_reyes.png')},
    {type:'MTX',label:'polaroid', mtx: 'polaroid'},
    {type:'MTX',label:'kodak', mtx: 'kodachrome'},
    {type:'MTX',label:'browni', mtx: 'browni'},
    {type:'MTX',label:'vintage', mtx: 'vintage'},
  ]

  async function loadFilterLUT(url){
    const img = new Image();
    img.src = url;
    await img.decode();
    return img
  }

export default function filters($selection, _params, onUpdate){
  const params=_params.filters

  let selected=reactive(false)

  reactive(async()=>{
    if($selection.value===null) {
      //load from recipe
      if(_params.filters?.label) {
        const idx = filtersLUT.findIndex(e=>e.label===_params.filters.label)
        selectFilter(idx)
      }
    }
  },{effect:true})


  async function setFilter(idx){
      const loader = document.getElementById('loader')
      let t 
      if(loader) setTimeout(()=>loader.style.display='',20) //show loader only if it's taking more than 20ms
      const _f=filtersLUT[parseInt(idx)]
      if(_f.map1 && typeof _f.map1==='function') _f.map1=await loadFilterLUT((await _f.map1()).default)
      if(_f.map2 && typeof _f.map2==='function') _f.map2=await loadFilterLUT((await _f.map2()).default)
      //await new Promise(r => setTimeout(r,1000))
      const {type,mtx,map1,map2,label} = _f
      params.opt={type,mtx,map1,map2,label}
      if(t) clearTimeout(t)
      if(loader) loader.style.display='none'
  }

  async function selectFilter(idx){
    if(selected.value!==idx){
      //select
      selected.value=idx
      btn_reset_filters?.removeAttribute('disabled')
      await setFilter(idx)
      onUpdate()
    } 
    else {
      //deselect
      resetFilters()
    }
  }

  function resetFilters(){
    btn_reset_filters?.setAttribute('disabled',true)
    selected.value=false
    params.opt=0
    onUpdate()
  }

  return html`
    <style>.btn_insta{width:70px;color: light-dark(white, white); font-size: 12px;}</style>
    <style type="text/css">@keyframes animate { 0.00% {animation-timing-function: cubic-bezier(0.51,0.03,0.89,0.56);transform: translate(0.00px,0.00px) rotate(0.00deg) scale(1.00, 1.00) skew(0deg, 0.00deg) ;opacity: 1.00;}52.00% {animation-timing-function: cubic-bezier(0.17,0.39,0.55,0.91);transform: translate(0.00px,0.00px) rotate(211.13deg) ;}100.00% {animation-timing-function: cubic-bezier(0.17,0.39,0.55,0.91);transform: translate(0.00px,0.00px) rotate(360.00deg) ;} }</style>

    ${section(
      'filters',    //section name
      235,          //section height
      $selection,
      _params, 
      onUpdate,
      resetFilters, 
      ()=>html`<div id="loader" style="width:23px;fill: orange;display:none;position:absolute;top:-30px;">${icon_shutter_rotate}</div>
              ${filtersLUT.map((f,idx)=>html`
                <button class="btn_insta" @click="${()=>selectFilter(idx)}" :selected="${()=>selected.value===idx}">${f.label}</button>
                `)}            
      `)}
  `

}






