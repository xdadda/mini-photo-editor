import { html, reactive } from '@xdadda/mini'
import section from './__section.js'

const scipyFilters = [
  { type: 'gaussian', label: 'Gaussian', desc: 'Gaussian blur' },
  { type: 'sobel', label: 'Sobel', desc: 'Edge detection' },
  { type: 'median', label: 'Median', desc: 'Noise reduction' },
  { type: 'laplace', label: 'Laplace', desc: 'Edge enhance' },
  { type: 'uniform', label: 'Uniform', desc: 'Box blur' }
]

export default function scipy($selection, _params, onUpdate) {
  const params = _params.scipy

  let selected = reactive(false)
  let processing = reactive(false)
  let pyodideStatus = reactive('not-loaded')

  // Check PyOdide availability on component mount
  reactive(async () => {
    if (typeof loadPyodide !== 'undefined') {
      pyodideStatus.value = 'available'
    } else {
      pyodideStatus.value = 'unavailable'
    }
  }, { effect: true })

  reactive(async () => {
    if ($selection.value === null) {
      // Load from recipe
      if (_params.scipy?.filterType) {
        const idx = scipyFilters.findIndex(e => e.type === _params.scipy.filterType)
        if (idx >= 0) selectFilter(idx)
      }
    }
  }, { effect: true })

  async function selectFilter(idx) {
    if (processing.value) return // Prevent multiple clicks during processing

    if (selected.value !== idx) {
      // Select and apply filter
      selected.value = idx
      processing.value = true
      btn_reset_scipy?.removeAttribute('disabled')

      const filter = scipyFilters[parseInt(idx)]
      params.filterType = filter.type
      params.filterLabel = filter.label

      // Trigger processing
      params.needsProcessing = true

      processing.value = false
      onUpdate()
    } else {
      // Deselect
      resetFilters()
    }
  }

  function resetFilters() {
    btn_reset_scipy?.setAttribute('disabled', true)
    selected.value = false
    params.filterType = null
    params.filterLabel = null
    params.needsProcessing = false
    onUpdate()
  }

  return html`
    <style>
      .btn_scipy {
        width: 70px;
        color: light-dark(white, white);
        font-size: 12px;
        height: 35px;
      }
      .scipy-status {
        font-size: 10px;
        color: gray;
        margin-bottom: 10px;
        text-align: center;
      }
      .scipy-warning {
        font-size: 11px;
        color: orange;
        margin: 10px;
        text-align: center;
      }
    </style>

    ${section(
      'scipy',      // section name
      280,          // section height
      $selection,
      _params,
      onUpdate,
      resetFilters,
      () => html`
        ${() => pyodideStatus.value === 'unavailable' && html`
          <div class="scipy-warning">
            ⚠️ PyOdide not loaded.<br>
            SciPy filters require PyOdide CDN.
          </div>
        `}

        ${() => pyodideStatus.value === 'available' && html`
          <div class="scipy-status">
            🐍 SciPy Image Processing
            ${() => processing.value ? html`<br><i>Processing...</i>` : ''}
          </div>
        `}

        <div style="display: flex; flex-wrap: wrap; gap: 5px; justify-content: center;">
          ${scipyFilters.map((f, idx) => html`
            <button
              class="btn_scipy"
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
            <i>Filter applied: ${scipyFilters[selected.value].label}</i><br>
            <i style="font-size: 10px;">First use: ~10s load time</i>
          </div>
        `}
      `
    )}
  `
}
