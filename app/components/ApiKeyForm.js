import { useState, useEffect } from 'react';
const models = require('../modules/models');

const ApiKeyForm = ({ onSave, existingKeys = {}, onCancel }) => {
  const [apiKeys, setApiKeys] = useState({...existingKeys});
  const [currentProvider, setCurrentProvider] = useState('');
  const [currentApiKey, setCurrentApiKey] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [providers, setProviders] = useState([]);
  const [availableProviders, setAvailableProviders] = useState([]);
  
  console.log("ApiKeyForm rendered with existingKeys:", Object.keys(existingKeys));

  // Load providers when component mounts
  useEffect(() => {
    console.log("ApiKeyForm initializing providers");
    const allProviders = models.getProviders();
    const providerNames = Object.keys(allProviders);
    console.log("Available providers:", providerNames);
    setProviders(providerNames);
    
    // Filter out providers that already have keys
    updateAvailableProviders(providerNames, apiKeys);
    
    // Set first available provider as default if available
    if (providerNames.length > 0) {
      // Find the first provider that doesn't have a key yet
      const firstAvailable = providerNames.find(p => !apiKeys[p]);
      console.log("First available provider:", firstAvailable || "All have keys");
      
      if (firstAvailable) {
        setCurrentProvider(firstAvailable);
      } else if (providerNames.length > 0) {
        // If all providers have keys, just select the first one for potential update
        setCurrentProvider(providerNames[0]);
      }
    }
  }, []);

  // Update available providers when apiKeys change
  const updateAvailableProviders = (allProviders, keys) => {
    const available = allProviders.filter(p => !keys[p]);
    console.log("Available providers (no keys yet):", available);
    setAvailableProviders(available);
  };

  const handleAddKey = async (e) => {
    e.preventDefault();
    console.log(`Adding/updating key for ${currentProvider}`);
    
    // If we're updating a key that already exists, allow empty to remove it
    const isUpdatingExisting = apiKeys[currentProvider];
    
    if (!isUpdatingExisting && !currentApiKey.trim()) {
      setError('API key is required');
      return;
    }
    
    // Basic API key validation (only if not removing)
    if (currentApiKey.trim() && currentProvider === 'OpenAI' && !currentApiKey.trim().startsWith('sk-')) {
      setError('OpenAI API key should start with "sk-"');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      // Update the keys
      const updatedKeys = {...apiKeys};
      
      if (!currentApiKey.trim() && isUpdatingExisting) {
        // If the field is empty and we're updating an existing key, remove it
        console.log(`Removing key for ${currentProvider}`);
        delete updatedKeys[currentProvider];
      } else if (currentApiKey.trim()) {
        // Otherwise, add/update the key
        console.log(`Setting key for ${currentProvider}`);
        updatedKeys[currentProvider] = currentApiKey.trim();
      }
      
      console.log("Updated keys:", Object.keys(updatedKeys));
      setApiKeys(updatedKeys);
      setCurrentApiKey('');
      
      // Update available providers
      updateAvailableProviders(providers, updatedKeys);
      
      // Select the next available provider, if any
      const nextProvider = providers.find(p => !updatedKeys[p]);
      if (nextProvider) {
        console.log(`Selecting next available provider: ${nextProvider}`);
        setCurrentProvider(nextProvider);
      } else if (providers.length > 0) {
        // If all providers have keys, just select the first one
        console.log(`All providers have keys, selecting first: ${providers[0]}`);
        setCurrentProvider(providers[0]);
      }
      
      // Immediately save the updated keys, but stay in editing mode
      console.log("Auto-saving updated keys:", Object.keys(updatedKeys));
      await onSave({...updatedKeys}, true); // Pass true to stay in editing mode
      
      setError('');
    } catch (error) {
      console.error('Error adding API key:', error);
      setError('Failed to add API key: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleRemoveKey = (provider) => {
    console.log(`Removing key for ${provider}`);
    const updatedKeys = { ...apiKeys };
    delete updatedKeys[provider];
    
    console.log("Updated keys after removal:", Object.keys(updatedKeys));
    setApiKeys(updatedKeys);
    updateAvailableProviders(providers, updatedKeys);
    
    // If the current provider is the one we just removed, make it available again
    if (currentProvider === provider) {
      setCurrentProvider(provider);
    } else if (!currentProvider || apiKeys[currentProvider]) {
      // If we don't have a current provider selected or it already has a key,
      // choose the removed provider or another available one
      setCurrentProvider(provider || availableProviders[0] || providers[0]);
    }
    
    // Immediately save after removing a key, but stay in editing mode
    console.log("Auto-saving after key removal:", Object.keys(updatedKeys));
    onSave({...updatedKeys}, true); // Pass true to stay in editing mode
  };
  
  const handleContinue = async () => {
    console.log("Continue button clicked, saving keys:", Object.keys(apiKeys));
    setIsLoading(true);
    
    try {
      // Save all API keys and exit editing mode
      const success = await onSave({...apiKeys}, false); // Pass false to exit editing mode
      
      if (!success) {
        setError('Failed to save API keys');
      }
    } catch (error) {
      console.error('Error saving API keys:', error);
      setError('Failed to save API keys: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getProviderApiKeyLink = (provider) => {
    switch (provider) {
      case 'OpenAI':
        return 'https://platform.openai.com/api-keys';
      case 'Stability AI':
        return 'https://platform.stability.ai/account/keys';
      default:
        return '#';
    }
  };

  return (
    <div className="api-key-form">
      <div className="card">
        <h2>{Object.keys(existingKeys).length > 0 ? 'Edit API Keys' : 'Set Up API Keys'}</h2>
        <p className="text-secondary mt-4 mb-4">
          You only need to provide one API key from any provider you wish to use, but you can add multiple.
          Your keys will be stored locally on your device and are never sent to any server 
          except the official API endpoints.
        </p>
        
        {/* Show currently added keys */}
        {Object.keys(apiKeys).length > 0 && (
          <div className="added-keys-section">
            <h3 className="text-sm font-medium mb-2">Added API Keys</h3>
            <div className="api-keys-list mb-4">
              {Object.entries(apiKeys).map(([provider, key]) => (
                <div key={provider} className="api-key-item">
                  <div>
                    <span className="api-key-provider">{provider}</span>
                    <span className="api-key-value">••••••••{key.slice(-4)}</span>
                  </div>
                  <button 
                    className="button button-secondary button-small"
                    onClick={() => handleRemoveKey(provider)}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Form to add a new key */}
        <form onSubmit={handleAddKey}>
          <h3 className="text-sm font-medium mb-2">Add New API Key</h3>
          
          <div className="form-group">
            <label htmlFor="provider" className="form-label">Provider</label>
            <select
              id="provider"
              className="input"
              value={currentProvider}
              onChange={(e) => setCurrentProvider(e.target.value)}
              disabled={isLoading || providers.length === 0}
            >
              {providers.length > 0 ? (
                providers.map(provider => (
                  <option 
                    key={provider} 
                    value={provider}
                  >
                    {provider} {apiKeys[provider] ? '(Added)' : ''}
                  </option>
                ))
              ) : (
                <option value="">Loading providers...</option>
              )}
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="apiKey" className="form-label">{currentProvider} API Key</label>
            <input
              id="apiKey"
              type="password"
              className="input"
              value={currentApiKey}
              onChange={(e) => setCurrentApiKey(e.target.value)}
              placeholder={
                apiKeys[currentProvider] 
                  ? `Current: ••••••••${apiKeys[currentProvider].slice(-4)}`
                  : (currentProvider === 'OpenAI' ? 'sk-...' : 'Enter API key')
              }
              autoComplete="off"
              disabled={isLoading}
            />
            {apiKeys[currentProvider] && (
              <div className="text-xs text-secondary mt-1">
                Enter a new key to update or clear to remove
              </div>
            )}
            {error && <div className="text-sm" style={{ color: 'var(--danger-color)', marginTop: '6px' }}>{error}</div>}
          </div>
          
          <div className="form-group">
            <button 
              type="submit" 
              className="button button-secondary"
              disabled={isLoading || !currentProvider}
            >
              {isLoading ? 'Adding...' : (apiKeys[currentProvider] ? 'Update Key' : 'Add API Key')}
            </button>
          </div>
          
          <div className="text-xs text-secondary">
            <p className="mb-4">
              Don't have an API key? You can get one from the{' '}
              <a 
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  // Open link in default browser if in Electron
                  if (window.electron) {
                    window.open(getProviderApiKeyLink(currentProvider), '_blank');
                  } else {
                    window.open(getProviderApiKeyLink(currentProvider), '_blank');
                  }
                }}
                style={{ color: 'var(--primary-color)' }}
              >
                {currentProvider} dashboard
              </a>.
            </p>
            {currentProvider === 'OpenAI' && (
              <p>
                OpenAI offers multiple image generation models, including GPT-image-1 (PixelMuse), DALL-E 3, and DALL-E 2.
              </p>
            )}
            {currentProvider === 'Stability AI' && (
              <p>
                Stability AI offers Stable Diffusion models for image generation.
              </p>
            )}
          </div>
        </form>
        
        {/* Action buttons */}
        <div className="form-group mt-4">
          <div className="flex gap-4">
            {onCancel && (
              <button 
                className="button button-secondary flex-1"
                onClick={onCancel}
                disabled={isLoading}
              >
                Cancel
              </button>
            )}
            <button 
              className={`button button-primary ${onCancel ? 'flex-1' : 'w-full'}`}
              onClick={handleContinue}
              disabled={isLoading || Object.keys(apiKeys).length === 0}
            >
              {isLoading 
                ? 'Saving...' 
                : (Object.keys(existingKeys).length > 0 
                  ? 'Save Changes' 
                  : 'Continue with Selected Key')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyForm; 