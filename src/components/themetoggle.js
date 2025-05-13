import { html, reactive} from '@xdadda/mini'
import store from '@xdadda/mini/store'


    function toggleMode(noauto){
      const sysmode = window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'
      const altmode = sysmode==='dark'?'light':'dark'
      const currmode = store('thememode').value

      if(currmode==='auto') {
        root.classList.add(altmode)
        root.classList.remove(sysmode)
        store('thememode').value=altmode
      }
      else if(currmode===altmode){
        root.classList.add(sysmode)
        root.classList.remove(altmode)
        store('thememode').value=sysmode
      }
      else if(!noauto && currmode===sysmode) {
        root.classList.remove(altmode)
        root.classList.remove(sysmode)
        store('thememode').value='auto'
      }
      else if(noauto && currmode===sysmode){
        root.classList.add(altmode)
        root.classList.remove(currmode)
        store('thememode').value=altmode
      }
    }

export default function ThemeToggle(start='auto',noauto=false){
  if(!store('thememode')) store('thememode',reactive(start))

  if(start){
    root.classList.add(start)
  }

  const icons = {
    auto:'\u273B',
    dark:'\u263E',
    light:'\u273A'
  }


  return html`<div>
      <a style="rotate: -90deg;" :title="${()=>store('thememode').value}" @click="${()=>toggleMode(noauto)}">
        ${()=>icons[store('thememode').value]}
      </a>
  </div>`
}

