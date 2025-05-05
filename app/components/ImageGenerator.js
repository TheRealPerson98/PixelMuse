import { useState, useRef, useEffect } from 'react';
const models = require('../modules/models');

const ImageGenerator = ({ apiKey, onResetApiKey, onEditApiKeys }) => {
  const [modelId, setModelId] = useState(models.DEFAULT_MODEL);
  const [prompt, setPrompt] = useState('');
  const [batchPrompts, setBatchPrompts] = useState('');
  const [batchMode, setBatchMode] = useState(false);
  const [imageSize, setImageSize] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [generatedImage, setGeneratedImage] = useState(null);
  const [batchImages, setBatchImages] = useState([]);
  const [currentBatchIndex, setCurrentBatchIndex] = useState(0);
  const [totalBatchCount, setTotalBatchCount] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const imageRef = useRef(null);
  const [providers, setProviders] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  
  // New state for gpt-image-1 additional options
  const [background, setBackground] = useState('auto');
  const [moderation, setModeration] = useState('auto');
  const [outputFormat, setOutputFormat] = useState('png');
  const [outputCompression, setOutputCompression] = useState(100);
  const [quality, setQuality] = useState('auto');
  
  const [batchProgress, setBatchProgress] = useState(0);
  
  // Load models when component mounts
  useEffect(() => {
    const allProviders = models.getProviders();
    setProviders(Object.entries(allProviders).map(([name, modelsList]) => ({
      name,
      models: modelsList
    })));
    
    // Set default image size based on selected model
    const defaultModel = models.getDefaultModel();
    if (defaultModel && defaultModel.defaultSize) {
      setImageSize(defaultModel.defaultSize);
    }
  }, []);
  
  // Update image size when model changes
  useEffect(() => {
    const selectedModel = models.getModel(modelId);
    if (selectedModel && selectedModel.defaultSize) {
      setImageSize(selectedModel.defaultSize);
    }
  }, [modelId]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    
    if (batchMode) {
      await handleBatchGenerate();
      return;
    }
    
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }
    
    setIsGenerating(true);
    setError('');
    setGeneratedImage(null);
    
    try {
      console.log(`Generating image with model: ${modelId}`);
      const selectedModel = models.getModel(modelId);
      if (!selectedModel) {
        throw new Error(`Model ${modelId} not found`);
      }
      
      console.log(`Model provider: ${selectedModel.provider}`);
      console.log(`Available API keys:`, Object.keys(apiKey));
      
      // Get the appropriate API key for this model
      const providerApiKey = apiKey[selectedModel.provider];
      
      if (!providerApiKey) {
        throw new Error(`Missing API key for ${selectedModel.provider}. Please add a ${selectedModel.provider} API key in Settings.`);
      }
            
      // Create options object with standard parameters
      const options = {
        apiKey: providerApiKey,
        prompt,
        size: imageSize,
        n: 1
      };
      
      // Add specific options if this is a specialized model
      if (modelId === 'gpt-image-1') {
        options.background = background;
        options.moderation = moderation;
        options.outputFormat = outputFormat;
        options.outputCompression = parseInt(outputCompression);
        options.quality = quality;
      }
      
      console.log(`Calling generateImage with model: ${modelId}`);
      const result = await models.generateImage(modelId, options);
      
      if (result.images && result.images.length > 0) {
        const image = result.images[0];
        setGeneratedImage({
          url: image.url,
          prompt: prompt,
          size: imageSize,
          model: result.model,
          provider: result.provider,
          revisedPrompt: image.revisedPrompt,
          timestamp: new Date().toISOString(),
          isBase64: image.isBase64
        });
        console.log(`Image generated successfully`);
      } else {
        setError('No image was generated');
      }
    } catch (error) {
      console.error('Error generating image:', error);
      let errorMessage = 'Failed to generate image';
      
      // Handle specific error types
      if (error.status === 401) {
        errorMessage = 'Invalid API key. Please check your API key.';
      } else if (error.message) {
        // Use the actual error message from the thrown error
        errorMessage = `Error: ${error.message}`;
      }
      
      // Special handling for Gemini model errors
      if (error.message && error.message.includes('Gemini')) {
        errorMessage = 'Gemini currently does not support direct image generation. Please try a different model.';
      }
      
      // Special handling for rate limiting and quotas
      if (error.message && (
        error.message.includes('rate limit') || 
        error.message.includes('quota') ||
        error.message.includes('capacity')
      )) {
        errorMessage = 'Rate limit exceeded or quota reached. Please try again later or upgrade your API plan.';
      }
      
      setError(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleBatchGenerate = async () => {
    if (!batchPrompts.trim()) {
      setError('Please enter at least one prompt');
      return;
    }
    
    const prompts = batchPrompts
      .split('\n')
      .map(p => p.trim())
      .filter(p => p.length > 0);
    
    if (prompts.length === 0) {
      setError('Please enter at least one valid prompt');
      return;
    }
    
    setIsGenerating(true);
    setError('');
    setBatchImages([]);
    setTotalBatchCount(prompts.length);
    setBatchProgress(0);
    
    try {
      // Create an array of promises for all image generation requests
      const generationPromises = prompts.map((currentPrompt, index) => {
        // Return a promise for each prompt
        return new Promise(async (resolve) => {
          try {
            console.log(`Starting batch image generation for prompt ${index + 1}/${prompts.length}`);
            const selectedModel = models.getModel(modelId);
            if (!selectedModel) {
              throw new Error(`Model ${modelId} not found`);
            }
            
            const providerApiKey = apiKey[selectedModel.provider];
            
            if (!providerApiKey) {
              throw new Error(`Missing API key for ${selectedModel.provider}. Please add a ${selectedModel.provider} API key in Settings.`);
            }
                  
            const options = {
              apiKey: providerApiKey,
              prompt: currentPrompt,
              size: imageSize,
              n: 1
            };
            
            if (modelId === 'gpt-image-1') {
              options.background = background;
              options.moderation = moderation;
              options.outputFormat = outputFormat;
              options.outputCompression = parseInt(outputCompression);
              options.quality = quality;
            }
            
            const result = await models.generateImage(modelId, options);
            
            if (result.images && result.images.length > 0) {
              const image = result.images[0];
              // Increment completed count
              setBatchProgress(prev => prev + 1);
              
              // Check if the prompt has a custom filename marker
              const filenameMatch = currentPrompt.match(/#\$([\w\-\.]+)$/);
              const displayPrompt = filenameMatch 
                ? currentPrompt.replace(/#\$[\w\-\.]+$/, '').trim()
                : currentPrompt;
              
              resolve({
                success: true,
                data: {
                  url: image.url,
                  prompt: currentPrompt,
                  displayPrompt: displayPrompt,
                  size: imageSize,
                  model: result.model,
                  provider: result.provider,
                  revisedPrompt: image.revisedPrompt,
                  timestamp: new Date().toISOString(),
                  isBase64: image.isBase64
                }
              });
              console.log(`Batch image ${index + 1} generated successfully`);
            } else {
              // Increment completed count even for failures
              setBatchProgress(prev => prev + 1);
              resolve({
                success: false,
                data: {
                  error: 'Failed to generate image',
                  prompt: currentPrompt
                }
              });
            }
          } catch (error) {
            console.error(`Error generating batch image ${index + 1}:`, error);
            // Increment completed count for errors
            setBatchProgress(prev => prev + 1);
            resolve({
              success: false,
              data: {
                error: error.message || 'Failed to generate image',
                prompt: currentPrompt
              }
            });
          }
        });
      });
      
      // Execute all promises concurrently
      const results = await Promise.all(generationPromises);
      
      // Process results and update state
      const batchResults = results.map(result => result.data);
      setBatchImages(batchResults);
      
      console.log(`All ${prompts.length} batch images processed`);
      
    } catch (error) {
      console.error('Error in batch processing:', error);
      setError(`Batch processing error: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleSaveImage = async () => {
    if (!generatedImage || !window.electron) return;
    
    try {
      setIsSaving(true);
      
      // Generate a file name from the prompt
      const promptWords = generatedImage.prompt
        .split(' ')
        .slice(0, 5)
        .join('-')
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '');
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const defaultName = `${promptWords}-${generatedImage.model}-${timestamp}.png`;
      
      let base64data;
      
      if (generatedImage.isBase64) {
        // The URL is already a data URL containing the base64 data
        base64data = generatedImage.url;
      } else {
        // For URLs (DALL-E models), fetch the image first
        const response = await fetch(generatedImage.url);
        const blob = await response.blob();
        const reader = new FileReader();
        
        // Convert to base64 data URL
        base64data = await new Promise((resolve) => {
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        });
      }
      
      const result = await window.electron.apiKeys.saveImage({
        imageData: base64data,
        defaultName: defaultName
      });
      
      if (!result.success) {
        setError(result.message || 'Failed to save image');
      }
    } catch (error) {
      console.error('Error saving image:', error);
      setError(`Failed to save image: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleSaveBatchImage = async (image, index) => {
    if (!image || !window.electron) return;
    
    try {
      const currentSavingIndex = index;
      setBatchImages(prev => 
        prev.map((img, i) => i === index ? {...img, isSaving: true} : img)
      );
      
      let defaultName;
      
      // Check if the prompt contains the filename indicator #$
      const filenameMatch = image.prompt.match(/#\$([\w\-\.]+)$/);
      
      if (filenameMatch) {
        // Use the custom filename
        defaultName = `${filenameMatch[1]}.png`;
        
        // Clean the prompt for display by removing the #$ part
        const cleanedPrompt = image.prompt.replace(/#\$[\w\-\.]+$/, '').trim();
        
        // Update the prompt in the batch images array
        setBatchImages(prev => 
          prev.map((img, i) => i === index ? {...img, displayPrompt: cleanedPrompt} : img)
        );
      } else {
        // Use the default filename generation
        const promptWords = image.prompt
          .split(' ')
          .slice(0, 5)
          .join('-')
          .toLowerCase()
          .replace(/[^a-z0-9-]/g, '');
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        defaultName = `${promptWords}-${image.model}-${timestamp}.png`;
      }
      
      let base64data;
      
      if (image.isBase64) {
        base64data = image.url;
      } else {
        const response = await fetch(image.url);
        const blob = await response.blob();
        const reader = new FileReader();
        
        base64data = await new Promise((resolve) => {
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        });
      }
      
      const result = await window.electron.apiKeys.saveImage({
        imageData: base64data,
        defaultName: defaultName
      });
      
      if (!result.success) {
        setError(result.message || 'Failed to save image');
      }
    } catch (error) {
      console.error('Error saving batch image:', error);
      setError(`Failed to save image: ${error.message}`);
    } finally {
      setBatchImages(prev => 
        prev.map((img, i) => i === index ? {...img, isSaving: false} : img)
      );
    }
  };
  
  const handleSaveAllBatchImages = async () => {
    for (let i = 0; i < batchImages.length; i++) {
      const image = batchImages[i];
      // Skip images that failed to generate
      if (!image.error) {
        await handleSaveBatchImage(image, i);
      }
    }
  };
  
  const handleOpenSettings = () => {
    setShowSettings(true);
  };
  
  const handleCloseSettings = () => {
    setShowSettings(false);
  };
  
  const handleResetApiKey = () => {
    if (onResetApiKey) {
      if (window.confirm('Are you sure you want to reset your API keys?')) {
        onResetApiKey();
        setShowSettings(false);
      }
    }
  };
  
  // Get sizes for current model
  const getCurrentModelSizes = () => {
    const model = models.getModel(modelId);
    return model?.supportedSizes || [];
  };

  // Add this function to handle adding a new API key
  const handleAddApiKey = () => {
    // Close the settings modal
    setShowSettings(false);
    
    // Instead of clearing all keys, pass the existing keys to the edit mode
    if (onEditApiKeys) {
      onEditApiKeys();
    }
  };

  // Helper to check if current model is PixelMuse
  const isGptImage1Model = () => {
    return modelId === 'gpt-image-1';
  };
  
  // Helper to get additional options for the current model
  const getModelAdditionalOptions = (optionType) => {
    const model = models.getModel(modelId);
    return model?.additionalOptions?.[optionType] || [];
  };

  const handleEditApiKeys = () => {
    setShowSettings(false);
    if (onEditApiKeys) {
      onEditApiKeys();
    }
  };

  return (
    <div className="image-generator">
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2>AI Image Generator</h2>
          <button 
            className="button button-secondary text-sm"
            onClick={handleOpenSettings}
          >
            Settings
          </button>
        </div>
        
        <form onSubmit={handleGenerate}>
          <div className="form-group">
            <label htmlFor="model" className="form-label">Model</label>
            <select
              id="model"
              className="input"
              value={modelId}
              onChange={(e) => setModelId(e.target.value)}
              disabled={isGenerating}
            >
              {providers.map(provider => (
                <optgroup key={provider.name} label={provider.name}>
                  {provider.models.map(model => (
                    <option key={model.id} value={model.id}>
                      {model.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            <div className="text-xs text-secondary mt-1">
              {models.getModel(modelId)?.description || ''}
            </div>
          </div>
          
          <div className="flex items-center mb-4">
            <input
              type="checkbox"
              id="batch-mode"
              className="mr-2"
              checked={batchMode}
              onChange={(e) => setBatchMode(e.target.checked)}
              disabled={isGenerating}
            />
            <label htmlFor="batch-mode" className="text-sm font-medium">
              Batch Mode (Generate multiple images)
            </label>
          </div>
          
          {!batchMode ? (
            <div className="form-group">
              <label htmlFor="prompt" className="form-label">Prompt</label>
              <textarea
                id="prompt"
                className="input textarea"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the image you want to generate..."
                disabled={isGenerating}
              />
            </div>
          ) : (
            <div className="form-group">
              <label htmlFor="batch-prompts" className="form-label">
                Batch Prompts (one per line)
              </label>
              <textarea
                id="batch-prompts"
                className="input textarea"
                value={batchPrompts}
                onChange={(e) => setBatchPrompts(e.target.value)}
                placeholder="Enter multiple prompts, one per line..."
                rows={5}
                disabled={isGenerating}
              />
              <p className="text-xs text-secondary mt-1">
                Each line will generate a separate image
              </p>
            </div>
          )}
          
          <div className="form-group">
            <label htmlFor="image-size" className="form-label">Image Size</label>
            <select
              id="image-size"
              className="input"
              value={imageSize}
              onChange={(e) => setImageSize(e.target.value)}
              disabled={isGenerating}
            >
              {getCurrentModelSizes().map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          {/* Advanced options for PixelMuse */}
          {isGptImage1Model() && (
            <div className="advanced-options">
              <details>
                <summary className="text-sm font-medium mb-2">Advanced Options</summary>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 mb-4">
                  <div className="form-group">
                    <label htmlFor="background" className="form-label">Background</label>
                    <select
                      id="background"
                      className="input"
                      value={background}
                      onChange={(e) => setBackground(e.target.value)}
                      disabled={isGenerating}
                    >
                      {getModelAdditionalOptions('background').map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="moderation" className="form-label">Moderation</label>
                    <select
                      id="moderation"
                      className="input"
                      value={moderation}
                      onChange={(e) => setModeration(e.target.value)}
                      disabled={isGenerating}
                    >
                      {getModelAdditionalOptions('moderation').map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="outputFormat" className="form-label">Output Format</label>
                    <select
                      id="outputFormat"
                      className="input"
                      value={outputFormat}
                      onChange={(e) => setOutputFormat(e.target.value)}
                      disabled={isGenerating}
                    >
                      {getModelAdditionalOptions('outputFormat').map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="quality" className="form-label">Quality</label>
                    <select
                      id="quality"
                      className="input"
                      value={quality}
                      onChange={(e) => setQuality(e.target.value)}
                      disabled={isGenerating}
                    >
                      {getModelAdditionalOptions('quality').map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {(outputFormat === 'webp' || outputFormat === 'jpeg') && (
                    <div className="form-group">
                      <label htmlFor="outputCompression" className="form-label">
                        Compression ({outputCompression}%)
                      </label>
                      <input
                        type="range"
                        id="outputCompression"
                        className="input range-slider"
                        min="1"
                        max="100"
                        value={outputCompression}
                        onChange={(e) => setOutputCompression(e.target.value)}
                        disabled={isGenerating}
                      />
                    </div>
                  )}
                </div>
              </details>
            </div>
          )}
          
          <div className="form-group">
            <button 
              type="submit" 
              className="button button-primary"
              disabled={isGenerating || (batchMode ? !batchPrompts.trim() : !prompt.trim())}
            >
              {isGenerating ? 'Generating...' : batchMode ? 'Generate Images' : 'Generate Image'}
            </button>
            
            {error && (
              <div 
                className="text-sm" 
                style={{ color: 'var(--danger-color)', marginTop: '10px' }}
              >
                {error}
              </div>
            )}
          </div>
        </form>
      </div>
      
      {isGenerating && (
        <div className="card generation-card">
          <div className="generation-container">
            <div className="spinner-container">
              <div className="spinner"></div>
            </div>
            <h3 className="generation-title">
              {batchMode 
                ? `Processing images: ${batchProgress}/${totalBatchCount}` 
                : 'Creating your masterpiece...'}
            </h3>
            {batchMode && (
              <div className="progress-bar-container">
                <div 
                  className="progress-bar" 
                  style={{ width: `${Math.round((batchProgress / totalBatchCount) * 100)}%` }}
                ></div>
              </div>
            )}
            <p className="generation-message">
              {batchMode 
                ? "Images are being generated in parallel. This may take some time depending on the number of prompts."
                : "This may take up to 15-30 seconds depending on the complexity of your prompt."}
            </p>
          </div>
        </div>
      )}
      
      {!batchMode && generatedImage && !isGenerating && (
        <div className="card">
          <h3>Generated Image</h3>
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm text-secondary">
              <strong>Model:</strong> {generatedImage.model} ({generatedImage.provider})
            </p>
            <p className="text-sm text-secondary">
              <strong>Size:</strong> {generatedImage.size}
            </p>
          </div>
          <p className="text-sm text-secondary mb-4">
            <strong>Prompt:</strong> {generatedImage.prompt}
          </p>
          
          {generatedImage.revisedPrompt && (
            <p className="text-sm text-secondary mb-4">
              <strong>Revised Prompt:</strong> {generatedImage.revisedPrompt}
            </p>
          )}
          
          <div className="image-container">
            <img 
              ref={imageRef}
              src={generatedImage.url} 
              alt={generatedImage.prompt}
              className="generated-image"
            />
            <div className="image-controls mt-4">
              <button 
                className="button button-primary"
                onClick={handleSaveImage}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save Image'}
              </button>
              <button 
                className="button button-secondary"
                onClick={() => {
                  navigator.clipboard.writeText(generatedImage.prompt);
                }}
              >
                Copy Prompt
              </button>
            </div>
          </div>
        </div>
      )}
      
      {batchMode && batchImages.length > 0 && !isGenerating && (
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h3>Generated Batch Images</h3>
            <button 
              className="button button-primary"
              onClick={handleSaveAllBatchImages}
            >
              Save All Images
            </button>
          </div>
          
          <div className="batch-images-grid">
            {batchImages.map((image, index) => (
              <div key={index} className="batch-image-card">
                {image.error ? (
                  <div className="batch-image-error">
                    <p className="text-sm" style={{ color: 'var(--danger-color)' }}>
                      Error: {image.error}
                    </p>
                    <p className="text-xs text-secondary">Prompt: {image.prompt}</p>
                  </div>
                ) : (
                  <>
                    <div className="batch-image-container">
                      <img 
                        src={image.url} 
                        alt={image.prompt}
                        className="batch-image"
                      />
                    </div>
                    <div className="batch-image-info">
                      <p className="text-xs text-secondary">
                        <strong>Prompt:</strong> {image.displayPrompt || image.prompt}
                      </p>
                      <p className="text-xs text-secondary">
                        <strong>Model:</strong> {image.model}
                      </p>
                      <div className="batch-image-controls">
                        <button 
                          className="button button-secondary button-small"
                          onClick={() => handleSaveBatchImage(image, index)}
                          disabled={image.isSaving}
                        >
                          {image.isSaving ? 'Saving...' : 'Save'}
                        </button>
                        <button 
                          className="button button-secondary button-small"
                          onClick={() => {
                            navigator.clipboard.writeText(image.displayPrompt || image.prompt);
                          }}
                        >
                          Copy Prompt
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {showSettings && (
        <div className="settings-modal-overlay">
          <div className="settings-modal">
            <div className="settings-modal-header">
              <h3>Settings</h3>
              <button 
                className="settings-close-button"
                onClick={handleCloseSettings}
                aria-label="Close settings"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="settings-modal-body">
              <div className="settings-section">
                <h4>API Keys</h4>
                
                {Object.keys(apiKey).length > 0 ? (
                  <div className="api-keys-list">
                    {Object.entries(apiKey).map(([provider, key]) => (
                      <div key={provider} className="api-key-item">
                        <div>
                          <span className="api-key-provider">{provider}</span>
                          <span className="api-key-value">••••••••{key.slice(-4)}</span>
                        </div>
                        <button 
                          className="button button-secondary button-small"
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to reset the ${provider} API key?`)) {
                              // Reset just this specific API key
                              const newApiKeys = {...apiKey};
                              delete newApiKeys[provider];
                              onResetApiKey(newApiKeys);
                            }
                          }}
                        >
                          Reset
                        </button>
                      </div>
                    ))}
                    
                    <div className="settings-buttons mt-4">
                      <button 
                        className="button button-danger"
                        onClick={handleResetApiKey}
                      >
                        Reset All Keys
                      </button>
                      <button 
                        className="button button-secondary"
                        onClick={handleAddApiKey}
                      >
                        Add New Key
                      </button>
                      <button 
                        className="button button-primary"
                        onClick={handleEditApiKeys}
                      >
                        Edit API Keys
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-secondary mb-4">No API keys configured. You need to add at least one API key to generate images.</p>
                    <button 
                      className="button button-primary"
                      onClick={handleAddApiKey}
                    >
                      Add API Key
                    </button>
                  </div>
                )}
              </div>
              
              <div className="settings-section">
                <h4>About</h4>
                <p className="text-secondary">
                  PixelMuse v1.0.6<br/>
                  Supports multiple image generation models from OpenAI and Stability AI.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <style jsx>{`
        .batch-images-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 20px;
          margin-top: 20px;
        }
        
        .batch-image-card {
          border: 1px solid var(--border-color);
          border-radius: 6px;
          overflow: hidden;
          transition: transform 0.2s;
        }
        
        .batch-image-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        
        .batch-image-container {
          height: 200px;
          overflow: hidden;
          position: relative;
        }
        
        .batch-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .batch-image-info {
          padding: 12px;
        }
        
        .batch-image-error {
          padding: 20px 12px;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
        }
        
        .batch-image-controls {
          display: flex;
          gap: 8px;
          margin-top: 10px;
        }
        
        .button-small {
          padding: 4px 8px;
          font-size: 12px;
        }
        
        .progress-bar-container {
          width: 100%;
          height: 8px;
          background-color: var(--background-light);
          border-radius: 4px;
          margin: 16px 0;
          overflow: hidden;
        }
        
        .progress-bar {
          height: 100%;
          background-color: var(--primary-color);
          transition: width 0.3s ease;
        }
        
        /* New styles for the generation loading state */
        .generation-card {
          padding: 30px;
          text-align: center;
          background: linear-gradient(135deg, var(--background-color) 0%, var(--background-light) 100%);
          border: 1px solid var(--border-color);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
          overflow: hidden;
        }
        
        .generation-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        
        .spinner-container {
          margin-bottom: 20px;
        }
        
        .spinner {
          width: 50px;
          height: 50px;
          border: 3px solid rgba(var(--primary-color-rgb), 0.2);
          border-radius: 50%;
          border-top-color: var(--primary-color);
          animation: spin 1s ease-in-out infinite;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        .generation-title {
          font-size: 1.4rem;
          font-weight: 600;
          margin-bottom: 16px;
          color: var(--text-color);
        }
        
        .generation-message {
          color: var(--text-secondary);
          font-size: 0.9rem;
          max-width: 500px;
          margin: 10px auto 0;
          line-height: 1.5;
        }
        
        .progress-bar-container {
          width: 100%;
          max-width: 400px;
          height: 10px;
          background-color: rgba(var(--primary-color-rgb), 0.1);
          border-radius: 6px;
          overflow: hidden;
          margin: 0 auto 16px;
        }
        
        .progress-bar {
          height: 100%;
          background: linear-gradient(90deg, var(--primary-color) 0%, rgba(var(--primary-color-rgb), 0.8) 100%);
          border-radius: 6px;
          transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 0 8px rgba(var(--primary-color-rgb), 0.5);
        }
      `}</style>
    </div>
  );
};

export default ImageGenerator; 