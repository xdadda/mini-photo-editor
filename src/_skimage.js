import { html, reactive } from '@xdadda/mini'
import section from './__section.js'

const skimageFilters = [
  { type: 'denoise_tv', label: 'Denoise TV', desc: 'Total variation denoising' },
  { type: 'denoise_bilateral', label: 'Bilateral', desc: 'Bilateral denoising' },
  { type: 'canny_edges', label: 'Canny', desc: 'Canny edge detection' },
  { type: 'morph_opening', label: 'Opening', desc: 'Morphological opening' },
  { type: 'morph_closing', label: 'Closing', desc: 'Morphological closing' },
  { type: 'adjust_gamma', label: 'Gamma', desc: 'Gamma correction' },
  { type: 'equalize_adaptive', label: 'Adapt Eq', desc: 'Adaptive equalization' },
  { type: 'unsharp_mask', label: 'Unsharp', desc: 'Unsharp mask sharpening' }
]

export default function skimage($selection, _params, onUpdate) {
  const params = _params.skimage

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
      if (_params.skimage?.filterType) {
        const idx = skimageFilters.findIndex(e => e.type === _params.skimage.filterType)
        if (idx >= 0) selectFilter(idx)
      }
    }
  }, { effect: true })

  async function selectFilter(idx) {
    if (processing.value) return

    if (selected.value !== idx) {
      selected.value = idx
      processing.value = true
      btn_reset_skimage?.removeAttribute('disabled')

      const filter = skimageFilters[parseInt(idx)]
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
    btn_reset_skimage?.setAttribute('disabled', true)
    selected.value = false
    params.filterType = null
    params.filterLabel = null
    params.needsProcessing = false
    onUpdate()
  }

  return html`
    <style>
      .btn_skimage {
        width: 70px;
        color: light-dark(white, white);
        font-size: 11px;
        height: 35px;
      }
      .skimage-status {
        font-size: 10px;
        color: gray;
        margin-bottom: 10px;
        text-align: center;
      }
    </style>

    ${section(
      'skimage',
      280,
      $selection,
      _params,
      onUpdate,
      resetFilters,
      () => html`
        ${() => pyodideStatus.value === 'unavailable' && html`
          <div class="skimage-status" style="color:orange">
            ⚠️ PyOdide required for Scikit-Image
          </div>
        `}

        ${() => pyodideStatus.value === 'available' && html`
          <div class="skimage-status">
            🔬 Scikit-Image Advanced Processing
            ${() => processing.value ? html`<br><i>Processing...</i>` : ''}
          </div>
        `}

        <div style="display: flex; flex-wrap: wrap; gap: 5px; justify-content: center;">
          ${skimageFilters.map((f, idx) => html`
            <button
              class="btn_skimage"
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
            <i>Filter: ${skimageFilters[selected.value].label}</i><br>
            <i style="font-size: 10px;">First use: ~10s load time</i>
          </div>
        `}
      `
    )}
  `
}
