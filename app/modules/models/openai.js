/**
 * OpenAI Models Implementation
 * 
 * This module provides interfaces for all OpenAI image generation models.
 */

const OpenAI = require('openai');

// Helper for all OpenAI models
const createOpenAIClient = (apiKey) => {
  return new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true // Needed for client-side usage
  });
};

// GPT-image-1 model
const gptImage1 = {
  name: 'gpt-image-1',
  provider: 'OpenAI',
  description: 'OpenAI\'s GPT-image-1 backend for photorealistic image generation',
  apiKeyName: 'openai-api-key', // Used for storage in settings
  requiresApiKey: true,
  defaultSize: '1024x1024',
  supportedSizes: [
    { value: '1024x1024', label: '1024×1024 (Square)' },
    { value: '1024x1536', label: '1024×1536 (Tall)' },
    { value: '1536x1024', label: '1536×1024 (Wide)' },
    { value: 'auto', label: 'Auto' }
  ],
  // Additional options specific to PixelMuse
  additionalOptions: {
    background: [
      { value: 'auto', label: 'Auto (Default)' },
      { value: 'transparent', label: 'Transparent' },
      { value: 'opaque', label: 'Opaque' }
    ],
    moderation: [
      { value: 'auto', label: 'Auto (Default)' },
      { value: 'low', label: 'Low (Less restrictive)' }
    ],
    outputFormat: [
      { value: 'png', label: 'PNG (Default)' },
      { value: 'jpeg', label: 'JPEG' },
      { value: 'webp', label: 'WebP' }
    ],
    quality: [
      { value: 'auto', label: 'Auto (Default)' },
      { value: 'high', label: 'High' },
      { value: 'medium', label: 'Medium' },
      { value: 'low', label: 'Low' }
    ]
  },
  async generate({ 
    apiKey, 
    prompt, 
    size = '1024x1024', 
    n = 1,
    background = 'auto',
    moderation = 'auto',
    outputFormat = 'png',
    outputCompression = 100,
    quality = 'auto'
  }) {
    const openai = createOpenAIClient(apiKey);
        
    try {
      const response = await openai.images.generate({
        model: 'gpt-image-1',
        prompt,
        n,
        size,
        output_format: outputFormat,
        background,
        moderation,
        output_compression: outputCompression,
        quality
      });
      
      if (!response.data || response.data.length === 0) {
        throw new Error('No image was generated');
      }
      
      // PixelMuse always returns base64 images, not URLs
      return {
        images: response.data.map(img => {
          // Create a data URL from the base64 data
          const dataUrl = `data:image/${outputFormat};base64,${img.b64_json}`;
          
          // Parse dimensions from size parameter
          let width, height;
          if (size === 'auto') {
            // For 'auto', we don't know the exact dimensions until runtime
            // Use a default value or try to extract from the image data
            width = 1024;
            height = 1024;
          } else {
            [width, height] = size.split('x').map(dim => parseInt(dim));
          }
          
          return {
            url: dataUrl,  // Store as a data URL for consistent API
            width,
            height,
            isBase64: true  // Flag to indicate this is a base64 image
          };
        }),
        model: 'gpt-image-1',
        provider: 'OpenAI',
        usage: response.usage  // Include token usage info
      };
    } catch (error) {
      console.error('OpenAI GPT-image-1 generation error:', error);
      throw error;
    }
  }
};

// DALL-E 3 model
const dalle3 = {
  name: 'DALL-E 3',
  provider: 'OpenAI',
  description: 'OpenAI\'s DALL-E 3 model for creative image generation',
  apiKeyName: 'openai-api-key', // Uses same API key as PixelMuse
  requiresApiKey: true,
  defaultSize: '1024x1024',
  supportedSizes: [
    { value: '1024x1024', label: '1024×1024 (Square)' },
    { value: '1024x1536', label: '1024×1536 (Tall)' },
    { value: '1536x1024', label: '1536×1024 (Wide)' },
    { value: 'auto', label: 'Auto' }
  ],
  async generate({ apiKey, prompt, size = '1024x1024', n = 1, quality = 'standard' }) {
    const openai = createOpenAIClient(apiKey);
    
    console.log(`Generating image with DALL-E 3, prompt: ${prompt}, size: ${size}, quality: ${quality}`);
    
    try {
      const response = await openai.images.generate({
        model: 'dall-e-3',
        prompt,
        n,
        size,
        quality
      });
      
      if (!response.data || response.data.length === 0) {
        throw new Error('No image was generated');
      }
      
      // Format the response in a standard way
      return {
        images: response.data.map(img => ({
          url: img.url,
          width: parseInt(size.split('x')[0]),
          height: parseInt(size.split('x')[1]),
          revisedPrompt: img.revised_prompt // DALL-E 3 specific
        })),
        model: 'dall-e-3',
        provider: 'OpenAI'
      };
    } catch (error) {
      console.error('OpenAI DALL-E 3 generation error:', error);
      throw error;
    }
  }
};

// DALL-E 2 model
const dalle2 = {
  name: 'DALL-E 2',
  provider: 'OpenAI',
  description: 'OpenAI\'s DALL-E 2 model for image generation',
  apiKeyName: 'openai-api-key', // Uses same API key as other OpenAI models
  requiresApiKey: true,
  defaultSize: '1024x1024',
  supportedSizes: [
    { value: '1024x1024', label: '1024×1024 (Square)' },
    { value: '1024x1536', label: '1024×1536 (Tall)' },
    { value: '1536x1024', label: '1536×1024 (Wide)' },
    { value: 'auto', label: 'Auto' }
  ],
  async generate({ apiKey, prompt, size = '1024x1024', n = 1 }) {
    const openai = createOpenAIClient(apiKey);
    
    console.log(`Generating image with DALL-E 2, prompt: ${prompt}, size: ${size}`);
    
    try {
      const response = await openai.images.generate({
        model: 'dall-e-2',
        prompt,
        n,
        size,
        response_format: 'url' // DALL-E 2 supports specifying response format
      });
      
      if (!response.data || response.data.length === 0) {
        throw new Error('No image was generated');
      }
      
      // Format the response in a standard way
      return {
        images: response.data.map(img => ({
          url: img.url,
          width: parseInt(size.split('x')[0]),
          height: parseInt(size.split('x')[1])
        })),
        model: 'dall-e-2',
        provider: 'OpenAI'
      };
    } catch (error) {
      console.error('OpenAI DALL-E 2 generation error:', error);
      throw error;
    }
  }
};

// Export all OpenAI models
module.exports = {
  'gpt-image-1': gptImage1,
  'dall-e-3': dalle3,
  'dall-e-2': dalle2
}; 