import { html } from '@xdadda/mini'
import store from '@xdadda/mini/store'
import isMobile from 'ismobilejs';


//calls onToggle(flag), where flag=true if entering fullscreen, false if leaving fullscreen mode
export default function Fullscreen(onToggle=null){

  const iphone = isMobile(window.navigator).apple.phone;
  if(iphone) return html`<div></div>`

  ///// FULLSCREEN
    async function toggleFullScreen() {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else if (document.exitFullscreen) {
        await document.exitFullscreen();
      }
    }
    
    function detectFullScreen(e) {
      //when in/out fullscreen reset view to ensure proper UI alignments
      if (document.fullscreenElement) {
        if(onToggle) onToggle(true)
        //log(`Element: ${document.fullscreenElement.id} entered fullscreen mode.`);
      } else {
        //log("Leaving fullscreen mode.");
        if(onToggle) onToggle(false)
      }      
    }
    if(onToggle) document.addEventListener("fullscreenchange", detectFullScreen)
    
  /////////////////

  return html`
    <div><a @click="${toggleFullScreen}">\u26F6</a></div>
  `
}
