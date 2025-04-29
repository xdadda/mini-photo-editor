import { html} from 'mini'
import icon_shutter_rotate from './assets/icon_shutter_rotate.svg?raw'

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
    {type:'MTX',label:'greeni', mtx: 'greeni'},
    {type:'MTX',label:'vintage', mtx: 'vintage'},
  ]

  async function loadFilterLUT(url){
    const img = new Image();
    img.src = url;
    await img.decode();
    return img
  }

export default function filters($selection, handleSelection,  params,onUpdate){

  async function setFilter(id){
      id=id.replace('flt_','')
      const t = setTimeout(()=>loader.style.display='',20) //show loader only if it's taking more than 20ms
      const _f=filtersLUT[parseInt(id)]
      if(_f.map1 && typeof _f.map1==='function') _f.map1=await loadFilterLUT((await _f.map1()).default)
      if(_f.map2 && typeof _f.map2==='function') _f.map2=await loadFilterLUT((await _f.map2()).default)
      //await new Promise(r => setTimeout(r,1000))
      const {type,mtx,map1,map2,label} = _f
      params.opt={type,mtx,map1,map2,label}
      clearTimeout(t)
      loader.style.display='none'

  }

  let selection=false
  async function selectFilter(){
    const el = document.getElementById(this.id)
    //preview=false
    if(!selection || selection!==this.id){
      //select
      instafilters.querySelector('[selected]')?.removeAttribute('selected');
      el.setAttribute('selected',true)
      btn_reset_filters?.removeAttribute('disabled')
      selection=this.id
      await setFilter(this.id)
      onUpdate()
    } 
    else {
      //deselect
      el.removeAttribute('selected')
      btn_reset_filters?.setAttribute('disabled',true)
      selection=false
      //previewFilter.call(this)
      params.opt=0
      onUpdate()
    }
  }

  /*
  let preview=false
  async function previewFilter(){
    if(selection) return
    if(!preview){
      preview=true
      await setFilter(this.id)
    } else {
      preview=false
      params.opt=0
    }
    onUpdate()
  }
  */

  function resetFilters(){
    const instafilters=document.getElementById('instafilters')
    btn_reset_filters?.setAttribute('disabled',true)
    instafilters?.querySelector('[selected]')?.removeAttribute('selected');
    params.opt=0
    selection=false
    //preview=false
    onUpdate()
  }

  return html`
    <style>.btn_insta{width:70px;color: light-dark(white, white);}</style>
    <div class="section" id="filters" :style="${()=>$selection.value==='filters'&&'height:235px;'}">
        <div style="display:flex;justify-content: space-between;cursor:pointer; color" @click="${()=>handleSelection('filters')}">
          <b>filters</b>
            <style type="text/css">@keyframes animate { 0.00% {animation-timing-function: cubic-bezier(0.51,0.03,0.89,0.56);transform: translate(0.00px,0.00px) rotate(0.00deg) scale(1.00, 1.00) skew(0deg, 0.00deg) ;opacity: 1.00;}52.00% {animation-timing-function: cubic-bezier(0.17,0.39,0.55,0.91);transform: translate(0.00px,0.00px) rotate(211.13deg) ;}100.00% {animation-timing-function: cubic-bezier(0.17,0.39,0.55,0.91);transform: translate(0.00px,0.00px) rotate(360.00deg) ;} }</style>
            <div id="loader" style="width:23px;fill: grey;display:none;">${icon_shutter_rotate}</div>

          <a id="btn_reset_filters" class="reset_btn" @click="${()=>resetFilters()}" disabled title="reset">\u00D8</a>
        </div>
        ${()=>$selection.value==='filters' && html`
          <div id="instafilters" style="font-size: 12px;">
              <hr>
              ${filtersLUT.map((f,idx)=>html`
                <button class="btn_insta" id="flt_${idx}" @click="${selectFilter}" selected="${params.opt?.label===f.label}">${f.label}</button>
                `)}
          </div>

        `}
    </div>
  `
}

//                <button class="btn_insta" id="flt_${idx}" @click="${selectFilter}" @mouseenter="${previewFilter}" @mouseleave="${previewFilter}" selected="${params.opt?.label===f.label}">${f.label}</button>

