import { html, onMount, onUnmount} from '@xdadda/mini'

//////// GPS MAP ///////////////////////


export default function GPSMap(coord){
    let map

    onMount(async()=>{
      //console.log('MAP',coord)
      map = new maplibregl.Map({
        container: 'map',
        style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json', //', // stylesheet location
        center: coord, // starting position [lng, lat]
        zoom: 9 // starting zoom
      });
      const marker = new maplibregl.Marker()
          .setLngLat(coord)
          .addTo(map);

    })
    onUnmount(()=>{
      map?.remove()}
    )

    return html`
      <style>#map{height: 180px;width:180px;color:black;border-radius: 15px;margin:10px auto;}</style>
      <style>.maplibregl-ctrl-attrib{display:none;}</style>
      <div id="map"></div>
    `
  }
////////////////////////////////////////