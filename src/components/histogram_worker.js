
let canvas, glcanvas, ctx, drawing
self.onmessage = async (event) => {
  
  if(event.data.init && !canvas) {
    const {width,height} = event.data
    canvas = new OffscreenCanvas(width,height)
    ctx = canvas.getContext('2d')
    drawing=false
    //postMessage('worker ready')
  }
  
  else if(event.data.pixels) {
    //console.log('histo')
      if(drawing) return 
      drawing=true
      //const xx=performance.now()
      const data = event.data.pixels
      DrawHistogram(data,ctx)
      //console.log('draw histo',performance.now()-xx) //ms
      createImageBitmap(canvas).then(t=>{
        postMessage({bitmap:t})
        drawing = false
      })
  
  }
};


const histogram = [
  new Uint32Array(256), //RED
  new Uint32Array(256), //GREEN
  new Uint32Array(256), //BLUE
];

function DrawHistogram(data,ctx){
        function Draw(color, colorarray, width, height, max) {
            ctx.beginPath();
            ctx.moveTo(0, height);
            let x = 0;
            for (let c = 0; c < 256; c++) {
                const h = Math.round(colorarray[c] * height / max);
                x = Math.round(c * width / 255);
                ctx.lineTo(x, height - h);
            }
            ctx.lineTo(x, height);
            ctx.fillStyle = color;
            ctx.fill();
            ctx.closePath();
        }

      histogram[0].fill(0)
      histogram[1].fill(0)
      histogram[2].fill(0)
      const max = [0,0,0]
      for (let i = 0; i < data.length; ++i) {
        const pixel = data[i], col=i%4;//, alpha=4-col;
        //if(data[i+alpha]){
          if(col<3&&pixel>2&&pixel<253) {
            ++histogram[col][pixel];
            if(histogram[col][pixel]>max[col]) ++max[col];
          }          
        //}
      }

      const {width, height} = ctx.canvas;
      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = "lighter"; //"lighter"
      ctx.globalAlpha = 1;
      Draw("#c13119", histogram[0], width, height, max[0]);
      Draw("#0c9427", histogram[1], width, height, max[1]);
      Draw("#1e73be", histogram[2], width, height, max[2]);
}
