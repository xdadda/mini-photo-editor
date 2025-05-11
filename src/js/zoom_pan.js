export {handlePointer, zoom_pan}

  function handlePointer({el,onStart,onMove,onEnd,onZoom,onPinch,disableleave=false}){
    //console.log('handlePointer',el)
    const evCache = []; //[]
    let prevDiff = 0;
    let _x,_y;
    let firstpinch=true; //avoids strange behaviour where first pinch/zoom is always wrong direction

    const start      = (ev) => {
      evCache.push(ev);
      onStart&&onStart({el,ev});
      _x=ev.clientX;_y=ev.clientY;
      firstpinch=true
    }
    const end      = (ev) => {
      if(!evCache.length) return
      //remove event cache
      const index = evCache.findIndex(
        (cachedEv) => cachedEv.pointerId === ev.pointerId,
      );
      evCache.splice(index, 1);
      onEnd&&onEnd({el,ev});
    }
    const move      = (ev) => {
      if(!evCache.length) return
      //update event cache
      const index = evCache.findIndex(
        (cachedEv) => cachedEv.pointerId === ev.pointerId,
      );
      evCache[index] = ev;
      if(evCache.length === 1) {
          onMove&&onMove({el,ev,x:ev.clientX-_x,y:ev.clientY-_y});
          _x=ev.clientX;
          _y=ev.clientY;
      }
      // If two pointers are down, check for pinch gestures
      else if (evCache.length === 2) {
        // Calculate the distance between the two pointers
        const curDiff = Math.abs(evCache[0].x - evCache[1].x);
        if (prevDiff > 0) {
          let deltaDiff = curDiff-prevDiff //if >0 zoom in, <0 zoom out
          if(firstpinch) {
            firstpinch=false
            deltaDiff*=-1            
          }
          ev.preventDefault();
          onPinch&&onPinch({el, ev0:evCache[0], ev1:evCache[1], diff:deltaDiff})
        }
        // Cache the distance for the next move event
        prevDiff = curDiff;
      }

    }
    const prevent = (ev) => {
      if(ev.touches.length===2) ev.preventDefault();
    }

    const dragStart = (ev) => {/*el.setPointerCapture(ev.pointerId); */start(ev);}
    const drag      = (ev) => /*el.hasPointerCapture(ev.pointerId) && */move(ev);
    const dragEnd   = (ev) => {/*el.releasePointerCapture(ev.pointerId); */end(ev);}
    const wheel     = (ev) => onZoom&&onZoom({el,ev,zoom:ev.deltaY/100});

    el.addEventListener("pointerdown", dragStart);
    el.addEventListener("pointermove", drag);
    el.addEventListener("pointerup", dragEnd);
    if(!disableleave){
      el.addEventListener("pointercancel", dragEnd);
      el.addEventListener("pointerout", dragEnd);
    }
    el.addEventListener("pointerleave", dragEnd);
    el.addEventListener('touchstart', prevent); //to disable default safari zoom/pinch

    if(onZoom) el.addEventListener("wheel", wheel, { passive: false });
    return ()=>{
      //console.log('removing listeners')
      el.removeEventListener("pointerdown", dragStart);
      el.removeEventListener("pointermove", drag);
      el.removeEventListener("pointerup", dragEnd);
      if(!disableleave){
        el.removeEventListener("pointercancel", dragEnd);
        el.removeEventListener("pointerout", dragEnd);
      }
      el.removeEventListener("pointerleave", dragEnd);
      el.removeEventListener("touchstart", prevent);
      if(onZoom) el.removeEventListener("wheel", wheel);      
    }
  }

  /*
    @el       Element to zoom
    @p        {x:,y:} zoom center 
    @delta    -1/+1 to know if zoom IN or OUT
    @factor   zoom factor //prefer x2 factor to avoid scaling artifacts
    @min_scale
    @max_scale
  */
  function zoomOnPointer(el, p, delta, factor, min_scale, max_scale){
    if(!el.style.transformOrigin) el.style.transformOrigin='0 0'

    //get current position and scale
    let pos=el.style.transform.match(/translate\((.*?)\)/)?.[1].split(',').map(e=>parseFloat(e)) || [0,0]
    let scale=el.style.transform.match(/scale\((.*?)\)/)?.[1].split(',').map(e=>parseFloat(e))[0] || 1
    var zoom_target = {x:0,y:0}
    var zoom_point = {x:0,y:0}
    zoom_point.x = p.x - el.parentElement.offsetLeft
    zoom_point.y = p.y - el.parentElement.offsetTop
    delta = Math.max(-1,Math.min(1,delta/10)) // cap the delta to [-1,1] for cross browser consistency
    if(!delta) return //critical in Safari apparently
    // determine the point on where the el is zoomed in
    zoom_target.x = (zoom_point.x - pos[0])/scale
    zoom_target.y = (zoom_point.y - pos[1])/scale
    // apply zoom
    scale += delta * factor * scale
    scale = Math.max(min_scale,Math.min(max_scale,scale))
    // calculate x and y based on zoom
    pos[0] = -zoom_target.x * scale + zoom_point.x
    pos[1] = -zoom_target.y * scale + zoom_point.y
    //update
    el.style.transform='translate('+(pos[0])+'px,'+(pos[1])+'px) scale('+scale+','+scale+')'
  } 


  //NOTE: if child's inner children stop mouse event (preventing zoom and pan), add "pointer-events: none;" to their css
  /*
    @parent eg div
    @child  eg img or canvas

  */
  function zoom_pan(parent,child){
      //NOTE: it's easier to handle pan on child element and zoom/scale on parent element
      //PAN child
      const destroyChild = handlePointer({
        el:child,
        onMove:(args)=>{
          //only pan if cursor is on firschild (it's just a UX decision)
          const elp = document.elementFromPoint(args.ev.pageX,args.ev.pageY)
          if(elp===parent||elp===child) return
          //get element current position, where (0,0) = centered
          const pos=args.el.style.transform.match(/translate\((.*?)\)/)?.[1].split(',').map(e=>parseFloat(e)) || [0,0]
          //get parent's scale (which is used to zoom on point)
          const scale=args.el.parentElement.style.transform.match(/scale\((.*?)\)/)?.[1].split(',').map(e=>parseFloat(e))[0] || 1
          pos[0]+=args.x/scale
          pos[1]+=args.y/scale
          args.el.style.transform=`translate(${pos[0]}px,${pos[1]}px)`
        },
      })
      //ZOOM parent
      const destroyParent = handlePointer({
        el:parent,
        onZoom:(args)=>{
          const e = args.ev
          e.preventDefault(); //disables desktop browser's default zoom when pinch
          //find center of zoom
          const p={x:e.pageX,y:e.pageY}
          //only zoom if cursor is on firstchild (it's just a UX decision)
          const elp = document.elementFromPoint(p.x, p.y)
          if(elp===parent||elp===child) return
          var delta = e.wheelDelta || e.detail;// e.detail need for firefox
          zoomOnPointer(args.el,p,delta,0.06,0.9,8)
        },
        onPinch:(args)=>{
          const e0 = args.ev0, e1=args.ev1
          //find center of pinch
          const p={x:(e0.pageX+e1.pageX)/2,y:(e0.pageY+e1.pageY)/2}
          //only zoom if center is on firstchild (it's just a UX decision)
          const elp = document.elementFromPoint(p.x, p.y)
          if(elp===parent||elp===child) return
          var delta = args.diff //if>0 zoomIN, if <0 zoomOUT
          zoomOnPointer(args.el,p,delta,0.05*2,0.9,8) //zoom factor x2 wheel (from tests on iPhone vs MacBook)
        }
      })

      return ()=>{
        destroyChild()
        destroyParent()
      }
  }