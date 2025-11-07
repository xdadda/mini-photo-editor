import { render } from '@xdadda/mini'
import {Editor} from './app.js'
import './main.css'

// Detect if running in Tauri
const isTauri = typeof window !== 'undefined' && window.__TAURI_INTERNALS__ !== undefined

// Check for initial file from Tauri before rendering
let initialFileData = null;

if (isTauri) {
  // Import Tauri APIs
  const { listen } = await import('@tauri-apps/api/event');
  const { readFile } = await import('@tauri-apps/plugin-fs');

  // Listen for initial file event from Tauri
  await listen('initial-file', async (event) => {
    const filePath = event.payload.file_path;

    if (!filePath || initialFileData) {
      return;
    }

    // Read file using Tauri's fs API
    const contents = await readFile(filePath);

    // Get filename from path
    const filename = filePath.split('/').pop().split('\\').pop();

    // Convert to ArrayBuffer
    const arrayBuffer = contents.buffer;

    // Store for passing to Editor (include full path for saving)
    initialFileData = { data: arrayBuffer, name: filename, path: filePath };

    // Re-render with the file data
    await render( document.getElementById('root'), () => Editor(initialFileData), true );
  });

  // Render editor (keep samples available in Tauri mode)
  await render( document.getElementById('root'), () => Editor(), true );
} else {
  console.log('Not in Tauri mode, rendering for web...');
  // Web mode - render normally
  await render( document.getElementById('root'), Editor, true );
}
