// ===== Configuration File =====
// Edit this file to configure the AI provider

const CONFIG = {
    // AI Provider: 'openai' or 'gemini'
    // Change this to switch between providers
    aiProvider: 'gemini',  // Using Google Gemini by default (FREE!)
    
    // Provider Details
    providers: {
        openai: {
            name: 'OpenAI GPT-3.5-Turbo',
            apiKeyLabel: 'OpenAI API Key',
            instructions: 'Get your API key from https://platform.openai.com/api-keys'
        },
        gemini: {
            name: 'Google Gemini 1.5 Flash',
            apiKeyLabel: 'Google AI API Key',
            instructions: 'Get your FREE API key from https://aistudio.google.com/app/apikey'
        }
    }
};

// Make config available globally
window.APP_CONFIG = CONFIG;

console.log(`🔧 Configuration loaded: Using ${CONFIG.providers[CONFIG.aiProvider].name}`);

// Made with Bob
