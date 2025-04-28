import { alert } from 'mini/components'

// Load API key from localStorage
export function getApiKey() {
  return localStorage.getItem('openai_api_key') || '';
}

// Save API key to localStorage
export function saveApiKey(key) {
  localStorage.setItem('openai_api_key', key);
}

// Generate image using OpenAI API
export async function generateImage(prompt, options = {}) {
  const apiKey = getApiKey();
  if (!apiKey) {
    await alert('Please set your OpenAI API key first');
    return null;
  }

  try {
    const defaults = {
      model: "gpt-image-1",
      background: "auto",
      output_format: "png",
      quality: "auto",
      size: "1024x1024",
      n: 1
    };

    const params = { ...defaults, ...options, prompt };

    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(params)
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('API error:', data);
      throw new Error(data.error?.message || 'Failed to generate image');
    }

    // The gpt-image-1 model always returns base64 images in b64_json field
    if (params.model === 'gpt-image-1' && data.data && data.data.length > 0) {
      // Make sure we have the b64_json field
      if (!data.data[0].b64_json) {
        throw new Error('Unexpected API response format');
      }
    }

    return data;
  } catch (error) {
    console.error('Error generating image:', error);
    await alert(`Error: ${error.message}`);
    return null;
  }
}

// Convert base64 image to a Blob
export function base64ToBlob(base64, mimeType = 'image/png') {
  const byteString = atob(base64);
  const arrayBuffer = new ArrayBuffer(byteString.length);
  const uint8Array = new Uint8Array(arrayBuffer);
  
  for (let i = 0; i < byteString.length; i++) {
    uint8Array[i] = byteString.charCodeAt(i);
  }
  
  return new Blob([arrayBuffer], { type: mimeType });
}

// Convert base64 image to Image object
export async function base64ToImage(base64) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = `data:image/png;base64,${base64}`;
  });
} 