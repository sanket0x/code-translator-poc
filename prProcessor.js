// ===== PR Processor Module =====
// Handles PR creation, AI integration, and task matching

// Role-based prompt templates
const ROLE_PROMPTS = {
    'software-engineer': `You are analyzing code changes from a software engineering perspective.
Explain the technical implementation, architecture decisions, and code quality.
Focus on: functionality, performance, maintainability, and best practices.
Keep it concise (2-3 sentences) but technical.`,
    
    'product-manager': `You are analyzing code changes from a product management perspective.
Explain the business value, user impact, and feature functionality.
Focus on: what the feature does, user benefits, and business outcomes.
Keep it concise (2-3 sentences) in business terms.`,
    
    'business-analyst': `You are analyzing code changes from a business analysis perspective.
Explain the requirements being implemented and business logic.
Focus on: business rules, data flow, and requirement fulfillment.
Keep it concise (2-3 sentences) focusing on requirements.`
};

// AI Provider Configuration
const AI_PROVIDERS = {
    openai: {
        name: 'OpenAI',
        endpoint: 'https://api.openai.com/v1/chat/completions',
        model: 'gpt-3.5-turbo',
        authHeader: 'Authorization',
        authPrefix: 'Bearer '
    },
    gemini: {
        name: 'Google Gemini 1.5 Flash',
        endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
        model: 'gemini-1.5-flash',
        authHeader: 'x-goog-api-key',
        authPrefix: ''
    }
};

const PRProcessor = {
    // ===== Available Models Cache =====
    availableModels: null,
    selectedModel: null,
    
    // ===== List Available Models =====
    async listAvailableModels(apiKey) {
        try {
            console.log('📋 Fetching available Gemini models...');
            
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`Failed to list models: ${response.status}`);
            }
            
            const data = await response.json();
            const models = data.models || [];
            
            console.log('📋 Available Gemini Models:');
            console.table(models.map(m => ({
                name: m.name,
                displayName: m.displayName,
                supportedMethods: m.supportedGenerationMethods?.join(', ')
            })));
            
            // Find first model that supports generateContent
            const compatibleModel = models.find(m =>
                m.supportedGenerationMethods?.includes('generateContent')
            );
            
            if (compatibleModel) {
                this.selectedModel = compatibleModel.name;
                console.log(`✅ Selected model: ${compatibleModel.name} (${compatibleModel.displayName})`);
                return compatibleModel.name;
            } else {
                throw new Error('No compatible models found that support generateContent');
            }
            
        } catch (error) {
            console.error('❌ Error listing models:', error);
            throw error;
        }
    },
    
    // ===== Task Number Extraction =====
    
    extractTaskNumber(prTitle) {
        // Match patterns like "task-1", "task-123", "TASK-5", etc.
        const regex = /task-(\d+)/i;
        const match = prTitle.match(regex);
        
        if (match) {
            return `task-${match[1]}`;
        }
        
        return null;
    },
    
    // ===== Prompt Construction =====
    
    constructPrompt(code, language) {
        const settings = AppState.userSettings;
        
        // If custom prompt exists, use it (complete override)
        if (settings.customPrompt && settings.customPrompt.trim()) {
            return `${settings.customPrompt}

Code:
\`\`\`${language}
${code}
\`\`\``;
        }
        
        // Otherwise, use role-based prompt
        const rolePrompt = ROLE_PROMPTS[settings.role] || ROLE_PROMPTS['software-engineer'];
        
        return `${rolePrompt}

Analyze this ${language} code:

\`\`\`${language}
${code}
\`\`\``;
    },
    
    // ===== AI Integration =====
    
    async analyzeCodeWithAI(code, language) {
        // Get API key from user settings
        const apiKey = AppState.userSettings.apiKey;
        
        if (!apiKey || apiKey.trim() === '') {
            throw new Error('API key not found. Please add your API key in User Settings tab.');
        }
        
        const currentProvider = AppState.userSettings.provider;
        const provider = AI_PROVIDERS[currentProvider];
        
        // For Gemini, get available models if not already cached
        if (currentProvider === 'gemini' && !this.selectedModel) {
            await this.listAvailableModels(apiKey);
        }
        
        console.log(`🤖 Calling ${provider.name} to analyze code...`);
        console.log(`👤 Using role: ${AppState.userSettings.role}`);
        console.log(`📝 Custom prompt: ${AppState.userSettings.customPrompt ? 'Yes' : 'No'}`);
        
        const prompt = this.constructPrompt(code, language);
        
        try {
            const currentProvider = AppState.userSettings.provider;
            let requestBody, response;
            
            if (currentProvider === 'openai') {
                // OpenAI format
                requestBody = {
                    model: provider.model,
                    messages: [
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    max_tokens: 300,
                    temperature: 0.7
                };
            } else if (currentProvider === 'gemini') {
                // Google Gemini format
                requestBody = {
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 800
                    }
                };
            }
            
            // Build headers based on provider
            const headers = {
                'Content-Type': 'application/json'
            };
            
            if (currentProvider === 'gemini') {
                // Gemini uses API key in URL parameter and dynamic model
                const modelName = this.selectedModel || 'models/gemini-1.5-flash';
                const endpoint = `https://generativelanguage.googleapis.com/v1beta/${modelName}:generateContent`;
                
                console.log(`📡 Using endpoint: ${endpoint}`);
                
                response = await fetch(`${endpoint}?key=${apiKey}`, {
                    method: 'POST',
                    headers: headers,
                    body: JSON.stringify(requestBody)
                });
            } else {
                // Other providers use Authorization header
                headers[provider.authHeader] = `${provider.authPrefix}${apiKey}`;
                response = await fetch(provider.endpoint, {
                    method: 'POST',
                    headers: headers,
                    body: JSON.stringify(requestBody)
                });
            }
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || errorData.message || `API request failed with status ${response.status}`);
            }
            
            const data = await response.json();
            
            // Log raw response for debugging
            console.log('📦 Raw API Response:', JSON.stringify(data, null, 2));
            
            let explanation;
            
            if (currentProvider === 'openai') {
                explanation = data.choices[0].message.content.trim();
            } else if (currentProvider === 'gemini') {
                // Google Gemini response format
                explanation = data.candidates[0]?.content?.parts[0]?.text?.trim() ||
                             'Code analysis completed';
            }
            
            console.log(`✅ ${provider.name} analysis complete`);
            console.log(`📝 Extracted explanation (${explanation.length} chars):`, explanation);
            return explanation;
            
        } catch (error) {
            console.error(`❌ ${provider.name} API error:`, error);
            throw error;
        }
    },
    
    // ===== PR Creation Workflow =====
    
    async createPR(prTitle, code, language) {
        console.log('🚀 Starting PR creation workflow...');
        
        // Step 1: Validate inputs
        if (!prTitle || !prTitle.trim()) {
            throw new Error('PR title is required');
        }
        
        if (!code || !code.trim()) {
            throw new Error('Code content is required');
        }
        
        // Step 2: Extract task number
        const taskId = this.extractTaskNumber(prTitle);
        
        if (!taskId) {
            throw new Error('No task number found in PR title. Please use format: "task-X: Description"');
        }
        
        console.log(`📋 Found task number: ${taskId}`);
        
        // Step 3: Check if task exists
        const task = TaskManager.getTaskById(taskId);
        
        if (!task) {
            throw new Error(`Task ${taskId} not found. Please create the task first or check the task number.`);
        }
        
        console.log(`✅ Task ${taskId} found: "${task.title}"`);
        
        // Step 4: Analyze code with AI
        let explanation;
        try {
            explanation = await this.analyzeCodeWithAI(code, language);
        } catch (error) {
            throw new Error(`Failed to analyze code: ${error.message}`);
        }
        
        // Step 5: Format comment
        const commentText = `Code changes: ${explanation}`;
        
        // Step 6: Add comment to task
        TaskManager.addComment(taskId, commentText, 'code-translator');
        
        console.log(`✅ Comment added to ${taskId}`);
        
        return {
            taskId,
            taskTitle: task.title,
            explanation,
            commentText
        };
    },
    
    // ===== UI Integration =====
    
    async handleCreatePR() {
        const prTitle = document.getElementById('prTitle').value.trim();
        const code = monacoEditor ? monacoEditor.getValue().trim() : '';
        const language = AppState.codeEditorState.language;
        
        // Validate inputs
        if (!prTitle) {
            this.showStatus('❌ Please enter a PR title', 'error');
            return;
        }
        
        if (!code) {
            this.showStatus('❌ Please enter some code', 'error');
            return;
        }
        
        // Check API key from user settings
        const apiKey = AppState.userSettings.apiKey;
        if (!apiKey || apiKey.trim() === '') {
            this.showStatus('❌ Please add your API key in User Settings tab', 'error');
            return;
        }
        
        // Show loading state
        const currentProvider = AppState.userSettings.provider;
        const provider = AI_PROVIDERS[currentProvider];
        this.showStatus(`🔄 Analyzing code with ${provider.name}...`, 'loading');
        this.disableCreateButton(true);
        
        try {
            // Create PR and add comment
            const result = await this.createPR(prTitle, code, language);
            
            // Show success message
            const successMessage = `✅ Success! Comment added to ${result.taskId}`;
            this.showStatus(successMessage, 'success');
            
            // Show action buttons
            this.showSuccessActions(result.taskId);
            
            console.log('🎉 PR creation complete!');
            
        } catch (error) {
            console.error('❌ PR creation failed:', error);
            
            // Show user-friendly error message
            let errorMessage = error.message;
            
            // Handle specific error types
            if (errorMessage.includes('API key')) {
                errorMessage = '🔑 ' + errorMessage;
            } else if (errorMessage.includes('not found')) {
                errorMessage = '🔍 ' + errorMessage;
            } else if (errorMessage.includes('task number')) {
                errorMessage = '📋 ' + errorMessage;
            } else if (errorMessage.includes('rate limit')) {
                errorMessage = '⏱️ Rate limit exceeded. Please wait a moment and try again.';
            } else if (errorMessage.includes('insufficient_quota')) {
                errorMessage = '💳 OpenAI API quota exceeded. Please check your billing.';
            } else if (errorMessage.includes('invalid_api_key')) {
                errorMessage = '🔑 Invalid API key. Please check your OpenAI API key.';
            } else {
                errorMessage = '❌ ' + errorMessage;
            }
            
            this.showStatus(errorMessage, 'error');
        } finally {
            this.disableCreateButton(false);
        }
    },
    
    // ===== UI Helper Functions =====
    
    showStatus(message, type) {
        const statusDiv = document.getElementById('prStatus');
        statusDiv.textContent = message;
        statusDiv.className = `pr-status show ${type}`;
    },
    
    hideStatus() {
        const statusDiv = document.getElementById('prStatus');
        statusDiv.className = 'pr-status';
    },
    
    disableCreateButton(disabled) {
        const button = document.getElementById('createPrBtn');
        button.disabled = disabled;
        
        if (disabled) {
            button.style.opacity = '0.6';
            button.style.cursor = 'not-allowed';
        } else {
            button.style.opacity = '1';
            button.style.cursor = 'pointer';
        }
    },
    
    showSuccessActions(taskId) {
        const statusDiv = document.getElementById('prStatus');
        
        // Create action buttons
        const actionsHtml = `
            <div class="pr-success-actions">
                <button onclick="PRProcessor.viewTask('${taskId}')" class="btn-secondary btn-small">
                    👁️ View Task
                </button>
                <button onclick="PRProcessor.createAnother()" class="btn-primary btn-small">
                    ➕ Create Another PR
                </button>
            </div>
        `;
        
        statusDiv.innerHTML = `
            <div>✅ Success! Comment added to ${taskId}</div>
            ${actionsHtml}
        `;
    },
    
    viewTask(taskId) {
        // Switch to Jira tab
        switchTab('jira');
        
        // Small delay to ensure tab is switched
        setTimeout(() => {
            // Open task modal
            TaskManager.openEditTaskModal(taskId);
        }, 100);
    },
    
    createAnother() {
        // Clear PR title
        document.getElementById('prTitle').value = '';
        
        // Hide status
        this.hideStatus();
        
        // Focus on PR title
        document.getElementById('prTitle').focus();
    }
};

// ===== Initialize =====
console.log('✅ PR Processor module loaded');

// Made with Bob
