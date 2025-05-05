/**
 * Models Registry
 * 
 * This file serves as a central registry for all supported AI image generation models.
 * Adding a new model/provider is as simple as importing it and adding to the MODELS object.
 */

const openAIModels = require('./openai');
// Import all providers
const stabilityModels = require('./stability');

// Combine all models from different providers
const MODELS = {
  ...openAIModels,
    ...stabilityModels,
};

// Group models by provider for UI organization
const PROVIDERS = {
  'OpenAI': Object.keys(openAIModels).map(key => ({ id: key, ...openAIModels[key] })),
  'Stability AI': Object.keys(stabilityModels).map(key => ({ id: key, ...stabilityModels[key] })),
};

// Default model to use
const DEFAULT_MODEL = 'gpt-image-1';

/**
 * Get all available models
 * @returns {Object} All models
 */
function getAllModels() {
  return MODELS;
}

/**
 * Get all providers with their models
 * @returns {Object} Providers grouped with their models
 */
function getProviders() {
  return PROVIDERS;
}

/**
 * Get a specific model by ID
 * @param {string} modelId - The model ID
 * @returns {Object|null} The model or null if not found
 */
function getModel(modelId) {
  return MODELS[modelId] || null;
}

/**
 * Get the default model
 * @returns {Object} The default model
 */
function getDefaultModel() {
  return MODELS[DEFAULT_MODEL];
}

/**
 * Generate an image using the specified model
 * @param {string} modelId - The model ID to use
 * @param {Object} params - Parameters for the model
 * @returns {Promise<Object>} The generated image result
 */
async function generateImage(modelId, params) {
  const model = getModel(modelId);
  if (!model) {
    throw new Error(`Model ${modelId} not found`);
  }
  
  return await model.generate(params);
}

module.exports = {
  getAllModels,
  getProviders,
  getModel,
  getDefaultModel,
  generateImage,
  DEFAULT_MODEL
}; 