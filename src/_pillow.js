import { html, reactive } from '@xdadda/mini'
import section from './__section.js'

const pillowFilters = [
  { type: 'blur', label: 'Blur', desc: 'PIL blur filter' },
  { type: 'sharpen', label: 'Sharpen', desc: 'PIL sharpen filter' },
  { type: 'emboss', label: 'Emboss', desc: 'Emboss effect' },
  { type: 'find_edges', label: 'Find Edges', desc: 'Edge detection' },
  { type: 'contour', label: 'Contour', desc: 'Contour detection' },
  { type: 'detail', label: 'Detail', desc: 'Detail enhancement' },
  { type: 'smooth', label: 'Smooth', desc: 'Smooth filter' },
  { type: 'edge_enhance', label: 'Edge+', desc: 'Edge enhancement' },
  { type: 'autocontrast', label: 'Auto-Contrast', desc: 'Auto contrast' },
  { type: 'equalize', label: 'Equalize', desc: 'Histogram equalization' },
  { type: 'posterize', label: 'Posterize', desc: 'Reduce colors' },
  { type: 'solarize', label: 'Solarize', desc: 'Solarize effect' }
]

export default function pillow($selection, _params, onUpdate) {
  const params = _params.pillow

  let selected = reactive(false)
  let processing = reactive(false)
  let pyodideStatus = reactive('not-loaded')

  reactive(async () => {
    if (typeof loadPyodide !== 'undefined') {
      pyodideStatus.value = 'available'
    } else {
      pyodideStatus.value = 'unavailable'
    }
  }, { effect: true })

  reactive(async () => {
    if ($selection.value === null) {
      if (_params.pillow?.filterType) {
        const idx = pillowFilters.findIndex(e => e.type === _params.pillow.filterType)
        if (idx >= 0) selectFilter(idx)
      }
    }
  }, { effect: true })

  async function selectFilter(idx) {
    if (processing.value) return

    if (selected.value !== idx) {
      selected.value = idx
      processing.value = true
      btn_reset_pillow?.removeAttribute('disabled')

      const filter = pillowFilters[parseInt(idx)]
      params.filterType = filter.type
      params.filterLabel = filter.label
      params.needsProcessing = true

      processing.value = false
      onUpdate()
    } else {
      resetFilters()
    }
  }

  function resetFilters() {
    btn_reset_pillow?.setAttribute('disabled', true)
    selected.value = false
    params.filterType = null
    params.filterLabel = null
    params.needsProcessing = false
    onUpdate()
  }

  return html`
    <style>
      .btn_pillow {
        width: 70px;
        color: light-dark(white, white);
        font-size: 11px;
        height: 35px;
      }
      .pillow-status {
        font-size: 10px;
        color: gray;
        margin-bottom: 10px;
        text-align: center;
      }
    </style>

    ${section(
      'pillow',
      280,
      $selection,
      _params,
      onUpdate,
      resetFilters,
      () => html`
        ${() => pyodideStatus.value === 'unavailable' && html`
          <div class="pillow-status" style="color:orange">
            ⚠️ PyOdide required for Pillow filters
          </div>
        `}

        ${() => pyodideStatus.value === 'available' && html`
          <div class="pillow-status">
            🖼️ Pillow (PIL) Filters
            ${() => processing.value ? html`<br><i>Processing...</i>` : ''}
          </div>
        `}

        <div style="display: flex; flex-wrap: wrap; gap: 5px; justify-content: center;">
          ${pillowFilters.map((f, idx) => html`
            <button
              class="btn_pillow"
              @click="${() => selectFilter(idx)}"
              :selected="${() => selected.value === idx}"
              :disabled="${() => pyodideStatus.value === 'unavailable' || processing.value}"
              title="${f.desc}"
            >
              ${f.label}
            </button>
          `)}
        </div>

        ${() => selected.value !== false && html`
          <div style="margin-top: 15px; font-size: 11px; text-align: center; color: gray;">
            <i>Filter: ${pillowFilters[selected.value].label}</i><br>
            <i style="font-size: 10px;">First use: ~10s load time</i>
          </div>
        `}
      `
    )}
  `
}
