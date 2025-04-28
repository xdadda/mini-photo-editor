import { html, reactive } from 'mini'
import { alert, confirm } from 'mini/components'
import { getApiKey, saveApiKey, generateImage, base64ToImage } from '../js/openai.js'

export default async function openAIGenerate(onImageLoaded) {
  const apiKey = reactive(getApiKey());
  const prompt = reactive('');
  const isGenerating = reactive(false);
  const model = reactive('gpt-image-1');
  const size = reactive('1024x1024');
  const background = reactive('auto');
  const quality = reactive('auto');
  
  async function handleGenerate() {
    if (!prompt.value.trim()) {
      await alert('Please enter a prompt');
      return;
    }
    
    if (!apiKey.value.trim()) {
      await alert('Please enter your OpenAI API key');
      return;
    }
    
    // Save the API key
    saveApiKey(apiKey.value);
    
    isGenerating.value = true;
    
    try {
      const options = {
        model: model.value,
        size: size.value,
        background: background.value,
        quality: quality.value
      };
      
      const result = await generateImage(prompt.value, options);
      
      if (result && result.data && result.data.length > 0) {
        const imgData = result.data[0].b64_json;
        if (!imgData) {
          throw new Error('Image data not found in response');
        }
        
        const img = await base64ToImage(imgData);
        
        // Create a blob from base64
        const byteString = atob(imgData);
        const arrayBuffer = new ArrayBuffer(byteString.length);
        const uint8Array = new Uint8Array(arrayBuffer);
        
        for (let i = 0; i < byteString.length; i++) {
          uint8Array[i] = byteString.charCodeAt(i);
        }
        
        // Construct file metadata
        const fileData = {
          name: `generated-${Date.now()}.png`,
          size: arrayBuffer.byteLength,
          type: 'image/png',
          lastModified: Date.now()
        };
        
        onImageLoaded(arrayBuffer, fileData, img);
        
        // Close dialog by removing from DOM
        root.lastElementChild.remove();
      }
    } catch (error) {
      console.error('Error:', error);
      let errorMsg = error.message || 'Failed to generate image';
      
      // Handle common error cases with more user-friendly messages
      if (errorMsg.includes('rate limit')) {
        errorMsg = 'API rate limit exceeded. Please try again later.';
      } else if (errorMsg.includes('billing') || errorMsg.includes('exceeded your quota')) {
        errorMsg = 'API quota exceeded or billing issue. Please check your OpenAI account.';
      } else if (errorMsg.includes('invalid api key')) {
        errorMsg = 'Invalid API key. Please check your OpenAI API key.';
      } else if (errorMsg.includes('content policy')) {
        errorMsg = 'Your prompt may violate OpenAI content policy. Please modify and try again.';
      }
      
      await alert(`Error: ${errorMsg}`);
    } finally {
      isGenerating.value = false;
    }
  }
  
  const resp = await confirm(()=>html`
    <div style="margin:10px 0; width: 500px; max-width: 95vw;">
      <div style="height:38px; margin-bottom: 16px; font-weight: bold;">Generate Image with AI</div>

      <div style="display:flex;flex-direction:column;font-size:14px; gap: 12px;">
        <div>
          <div style="font-size:12px;color:gray;margin-bottom:4px;">OpenAI API Key</div>
          <input 
            style="width:100%;font-size:14px; padding: 8px;" 
            type="password" 
            placeholder="Enter your OpenAI API key" 
            :value="${()=>apiKey.value}"
            @input="${(e)=>apiKey.value=e.target.value}">
        </div>
        
        <div>
          <div style="font-size:12px;color:gray;margin-bottom:4px;">Prompt</div>
          <textarea 
            style="width:100%;font-size:14px; padding: 8px; min-height: 100px; resize: vertical;" 
            placeholder="Describe the image you want to generate..." 
            :value="${()=>prompt.value}" 
            @input="${(e)=>prompt.value=e.target.value}"></textarea>
        </div>
        
        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
          <div style="flex: 1; min-width: 120px;">
            <div style="font-size:12px;color:gray;margin-bottom:4px;">Size</div>
            <select 
              style="width:100%;height:35px;font-size:14px;" 
              :value="${()=>size.value}" 
              @change="${(e)=>size.value=e.target.value}">
              <option value="1024x1024">1024x1024 (Square)</option>
              <option value="1536x1024">1536x1024 (Landscape)</option>
              <option value="1024x1536">1024x1536 (Portrait)</option>
              <option value="auto">Auto</option>
            </select>
          </div>
          
          <div style="flex: 1; min-width: 120px;">
            <div style="font-size:12px;color:gray;margin-bottom:4px;">Background</div>
            <select 
              style="width:100%;height:35px;font-size:14px;" 
              :value="${()=>background.value}" 
              @change="${(e)=>background.value=e.target.value}">
              <option value="auto">Auto</option>
              <option value="transparent">Transparent</option>
              <option value="opaque">Opaque</option>
            </select>
          </div>
          
          <div style="flex: 1; min-width: 120px;">
            <div style="font-size:12px;color:gray;margin-bottom:4px;">Quality</div>
            <select 
              style="width:100%;height:35px;font-size:14px;" 
              :value="${()=>quality.value}" 
              @change="${(e)=>quality.value=e.target.value}">
              <option value="auto">Auto</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      </div>
      
      <div style="margin-top: 20px; text-align: center;">
        <button 
          style="padding: 10px 20px; font-size: 16px; background-color: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer; ${()=>isGenerating.value ? 'opacity: 0.7;' : ''}" 
          @click="${handleGenerate}" 
          :disabled="${()=>isGenerating.value}">
          ${()=>isGenerating.value ? 'Generating...' : 'Generate Image'}
        </button>
      </div>
      
      <div style="margin-top: 10px; font-size: 12px; color: gray; text-align: center;">
        <i>Your API key is stored locally in your browser and is never sent to our servers.</i>
      </div>
    </div>
  `, 520, false);
  
  // If user cancels, just return
  if (!resp) return;
} 