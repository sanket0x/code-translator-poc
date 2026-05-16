// ===== Configuration File =====
// Provider details for the application

const CONFIG = {
    // Provider Details
    providers: {
        openai: {
            name: 'OpenAI GPT-3.5-Turbo',
            apiKeyLabel: 'OpenAI API Key',
            keyPlaceholder: 'sk-...',
            instructions: 'Get your API key from https://platform.openai.com/api-keys'
        },
        gemini: {
            name: 'Google Gemini 1.5 Flash',
            apiKeyLabel: 'Google AI API Key',
            keyPlaceholder: 'AIza...',
            instructions: 'Get your FREE API key from https://aistudio.google.com/app/apikey'
        }
    }
};

// Make config available globally
window.APP_CONFIG = CONFIG;

console.log('🔧 Configuration loaded');

// Made with Bob
