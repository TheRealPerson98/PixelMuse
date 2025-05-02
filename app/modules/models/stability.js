/**
 * Stability AI Models Implementation
 * 
 * Implementation for Stability AI image generation models.
 */

// Import fetch for making API requests
const fetch = (...args) => 
  import('node-fetch').then(({default: fetch}) => fetch(...args));

// Stability models
const stabilityDiffusionXL = {
  name: 'Stable Diffusion XL',
  provider: 'Stability AI',
  description: 'Stability AI\'s SDXL 1.0 model for high-quality image generation',
  apiKeyName: 'stability-api-key',
  requiresApiKey: true,
  defaultSize: '1024x1024',
  supportedSizes: [
    { value: '512x512', label: '512×512' },
    { value: '768x768', label: '768×768' },
    { value: '1024x1024', label: '1024×1024' },
    { value: '1152x896', label: '1152×896' }
  ],
  async generate({ apiKey, prompt, size = '1024x1024', n = 1, cfgScale = 7, steps = 30 }) {
    try {
      // Implementation uses the Stability API
      const engineId = 'stable-diffusion-xl-1024-v1-0';
      
      // Use global fetch in browser or node-fetch in Node.js
      const fetchImpl = typeof window !== 'undefined' && window.fetch ? window.fetch : fetch;
      
      const response = await fetchImpl(
        `https://api.stability.ai/v1/generation/${engineId}/text-to-image`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            text_prompts: [{ text: prompt }],
            cfg_scale: cfgScale,
            height: parseInt(size.split('x')[1]),
            width: parseInt(size.split('x')[0]),
            samples: n,
            steps: steps
          }),
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Stability API error: ${response.statusText} - ${JSON.stringify(errorData)}`);
      }
      
      const responseJSON = await response.json();
      
      // Format the response in a standard way
      return {
        images: responseJSON.artifacts.map(img => ({
          url: `data:image/png;base64,${img.base64}`,
          width: img.width,
          height: img.height,
          seed: img.seed
        })),
        model: 'stable-diffusion-xl',
        provider: 'Stability AI'
      };
    } catch (error) {
      console.error('Stability AI generation error:', error);
      throw error;
    }
  }
};

// Stability Diffusion 3 model
const stabilityDiffusion3 = {
  name: 'Stable Diffusion 3',
  provider: 'Stability AI',
  description: 'Stability AI\'s latest SD3 model for state-of-the-art image generation',
  apiKeyName: 'stability-api-key',
  requiresApiKey: true,
  defaultSize: '1024x1024',
  supportedSizes: [
    { value: '1024x1024', label: '1024×1024' },
    { value: '1536x1024', label: '1536×1024 (Wide)' },
    { value: '1024x1536', label: '1024×1536 (Tall)' },
    { value: '1344x768', label: '1344×768' }
  ],
  async generate({ apiKey, prompt, size = '1024x1024', n = 1, cfgScale = 7, steps = 40 }) {
    try {
      // Using the newer Stability API for SD3
      const engineId = 'stable-diffusion-3';
      
      // Use global fetch in browser or node-fetch in Node.js
      const fetchImpl = typeof window !== 'undefined' && window.fetch ? window.fetch : fetch;
      
      const response = await fetchImpl(
        `https://api.stability.ai/v1/generation/${engineId}/text-to-image`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            text_prompts: [{ text: prompt }],
            cfg_scale: cfgScale,
            height: parseInt(size.split('x')[1]),
            width: parseInt(size.split('x')[0]),
            samples: n,
            steps: steps,
            style_preset: 'photographic'  // SD3 specific option
          }),
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Stability API error: ${response.statusText} - ${JSON.stringify(errorData)}`);
      }
      
      const responseJSON = await response.json();
      
      // Format the response in a standard way
      return {
        images: responseJSON.artifacts.map(img => ({
          url: `data:image/png;base64,${img.base64}`,
          width: img.width,
          height: img.height,
          seed: img.seed
        })),
        model: 'stable-diffusion-3',
        provider: 'Stability AI'
      };
    } catch (error) {
      console.error('Stability AI SD3 generation error:', error);
      throw error;
    }
  }
};

module.exports = {
  'stable-diffusion-xl': stabilityDiffusionXL,
  'stable-diffusion-3': stabilityDiffusion3
}; 