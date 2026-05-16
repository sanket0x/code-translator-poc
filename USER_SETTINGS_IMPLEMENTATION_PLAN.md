# User Settings Implementation Plan

## 📋 Overview
Add a comprehensive User Settings page as a third tab in the navigation, allowing users to configure their AI provider, API key, role, and custom prompts for code analysis.

---

## 🎯 Requirements Summary

### What's Being Added:
1. **User Settings Tab** - Third tab in top navigation (alongside Jira and Code Editor)
2. **API Provider Selection** - Choose between Gemini or OpenAI (store only one key at a time)
3. **Role Selection** - Dropdown with: Software Engineer, Product Manager, Business Analyst
4. **Custom Prompt** - Optional text area that completely overrides default prompts
5. **Clear API Key Button** - Ability to remove stored API key

### What's Being Removed:
- API key input from header (moving to User Settings tab)

---

## 🎨 UI Design

### Current Header Layout:
```
┌────────────────────────────────────────────────────────────┐
│  🔄 Code Translator POC    [API Key Input] [Save] [Status] │
└────────────────────────────────────────────────────────────┘
```

### New Header Layout:
```
┌────────────────────────────────────────────────────────────┐
│  🔄 Code Translator POC                                     │
└────────────────────────────────────────────────────────────┘
```

### Current Tab Navigation:
```
┌─────────────────┬─────────────────┐
│ 📋 Jira/Tasks   │ 💻 Code Editor  │
└─────────────────┴─────────────────┘
```

### New Tab Navigation:
```
┌─────────────────┬─────────────────┬─────────────────┐
│ 📋 Jira/Tasks   │ 💻 Code Editor  │ ⚙️ User Settings│
└─────────────────┴─────────────────┴─────────────────┘
```

### User Settings Page Layout:
```
┌─────────────────────────────────────────────────────────────┐
│                      ⚙️ User Settings                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  🔑 API Provider Configuration                              │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  ○ Google Gemini 1.5 Flash (Free)                     │ │
│  │  ○ OpenAI GPT-3.5 Turbo                               │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  API Key:                                                   │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ [Enter your API key here...]                          │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  [💾 Save API Key]  [🗑️ Clear API Key]                     │
│  Status: ✓ API Key Saved                                   │
│                                                             │
│  ℹ️ Get your FREE Gemini key: https://aistudio.google.com │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  👤 Role Selection                                          │
│  I'm a:  ┌──────────────────────────────┐                  │
│          │ Software Engineer         ▼  │                  │
│          └──────────────────────────────┘                  │
│                                                             │
│  Options: Software Engineer, Product Manager,              │
│           Business Analyst                                 │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ✏️ Custom Prompt (Optional)                                │
│  ⚠️ Warning: This will completely override default prompts │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │                                                        │ │
│  │  Enter your custom prompt here...                     │ │
│  │                                                        │ │
│  │                                                        │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  [💾 Save Settings]                                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Data Structure Changes

### Current AppState:
```javascript
AppState = {
    currentTab: 'jira',
    apiKey: localStorage.getItem('openai_api_key') || '',
    tasks: [],
    nextTaskId: 1,
    currentEditingTask: null,
    codeEditorState: { language: 'go', code: '', prTitle: '' }
}
```

### New AppState:
```javascript
AppState = {
    currentTab: 'jira',
    userSettings: {
        provider: 'gemini',              // 'gemini' or 'openai'
        apiKey: '',                      // Single key for selected provider
        role: 'software-engineer',       // Default role
        customPrompt: ''                 // Optional override
    },
    tasks: [],
    nextTaskId: 1,
    currentEditingTask: null,
    codeEditorState: { language: 'go', code: '', prTitle: '' }
}
```

### LocalStorage Structure:
```javascript
// Key: 'user_settings'
{
    provider: 'gemini',
    apiKey: 'AIza...',
    role: 'software-engineer',
    customPrompt: ''
}

// Key: 'code_translator_data' (existing)
{
    tasks: [...],
    nextTaskId: 1,
    codeEditorState: {...}
}
```

---

## 🤖 AI Prompt System

### Role-Based Default Prompts:

#### Software Engineer Prompt:
```
You are analyzing code changes from a software engineering perspective.
Explain the technical implementation, architecture decisions, and code quality.
Focus on: functionality, performance, maintainability, and best practices.
Keep it concise (2-3 sentences) but technical.
```

#### Product Manager Prompt:
```
You are analyzing code changes from a product management perspective.
Explain the business value, user impact, and feature functionality.
Focus on: what the feature does, user benefits, and business outcomes.
Keep it concise (2-3 sentences) in business terms.
```

#### Business Analyst Prompt:
```
You are analyzing code changes from a business analysis perspective.
Explain the requirements being implemented and business logic.
Focus on: business rules, data flow, and requirement fulfillment.
Keep it concise (2-3 sentences) focusing on requirements.
```

### Prompt Construction Logic:
```javascript
function constructPrompt(code, language, userSettings) {
    // Step 1: Check for custom prompt (complete override)
    if (userSettings.customPrompt && userSettings.customPrompt.trim()) {
        return `${userSettings.customPrompt}

Code:
\`\`\`${language}
${code}
\`\`\``;
    }
    
    // Step 2: Use role-based prompt
    const rolePrompts = {
        'software-engineer': ROLE_PROMPTS.softwareEngineer,
        'product-manager': ROLE_PROMPTS.productManager,
        'business-analyst': ROLE_PROMPTS.businessAnalyst
    };
    
    const rolePrompt = rolePrompts[userSettings.role];
    
    return `${rolePrompt}

Analyze this ${language} code:

\`\`\`${language}
${code}
\`\`\``;
}
```

---

## 🔧 Implementation Details

### Files to Modify:

#### 1. **index.html**
**Changes:**
- Remove API key input section from header (lines 16-27)
- Add User Settings tab button to navigation (after Code Editor tab)
- Add User Settings tab content section (new section after editorTab)

**New HTML Structure:**
```html
<!-- Header - Simplified -->
<header class="header">
    <div class="header-content">
        <h1 class="header-title">🔄 Code Translator POC</h1>
    </div>
</header>

<!-- Tab Navigation - Three Tabs -->
<nav class="tab-navigation">
    <button class="tab-btn active" data-tab="jira">
        <span class="tab-icon">📋</span>
        <span class="tab-label">Jira/Tasks</span>
    </button>
    <button class="tab-btn" data-tab="editor">
        <span class="tab-icon">💻</span>
        <span class="tab-label">Code Editor</span>
    </button>
    <button class="tab-btn" data-tab="settings">
        <span class="tab-icon">⚙️</span>
        <span class="tab-label">User Settings</span>
    </button>
</nav>

<!-- User Settings Tab Content -->
<div id="settingsTab" class="tab-content">
    <div class="settings-container">
        <h2 class="settings-title">⚙️ User Settings</h2>
        
        <!-- API Provider Section -->
        <section class="settings-section">
            <h3>🔑 API Provider Configuration</h3>
            <div class="provider-selection">
                <label class="radio-label">
                    <input type="radio" name="provider" value="gemini" checked>
                    <span>Google Gemini 1.5 Flash (Free)</span>
                </label>
                <label class="radio-label">
                    <input type="radio" name="provider" value="openai">
                    <span>OpenAI GPT-3.5 Turbo</span>
                </label>
            </div>
            
            <div class="api-key-section">
                <label for="settingsApiKey">API Key:</label>
                <input type="password" id="settingsApiKey" placeholder="Enter your API key...">
                <div class="button-group">
                    <button id="saveApiKeyBtn" class="btn-primary">💾 Save API Key</button>
                    <button id="clearApiKeyBtn" class="btn-secondary">🗑️ Clear API Key</button>
                </div>
                <span id="apiKeyStatus" class="status-message"></span>
                <p class="help-text" id="providerInstructions"></p>
            </div>
        </section>
        
        <!-- Role Selection Section -->
        <section class="settings-section">
            <h3>👤 Role Selection</h3>
            <div class="role-selection">
                <label for="roleSelect">I'm a:</label>
                <select id="roleSelect">
                    <option value="software-engineer">Software Engineer</option>
                    <option value="product-manager">Product Manager</option>
                    <option value="business-analyst">Business Analyst</option>
                </select>
            </div>
        </section>
        
        <!-- Custom Prompt Section -->
        <section class="settings-section">
            <h3>✏️ Custom Prompt (Optional)</h3>
            <p class="warning-text">⚠️ This will completely override default role-based prompts</p>
            <textarea id="customPrompt" rows="6" placeholder="Enter your custom prompt here..."></textarea>
            <button id="saveSettingsBtn" class="btn-primary btn-large">💾 Save Settings</button>
        </section>
    </div>
</div>
```

#### 2. **styles.css**
**Changes:**
- Update header styles (remove API key section styles)
- Add User Settings page styles
- Update tab navigation for three tabs

**New CSS Classes:**
```css
/* Settings Container */
.settings-container {
    max-width: 800px;
    margin: 0 auto;
    background: var(--card-white);
    border-radius: var(--radius-lg);
    padding: var(--spacing-xl);
    box-shadow: var(--shadow-sm);
}

.settings-title {
    font-size: 28px;
    margin-bottom: var(--spacing-xl);
    color: var(--text-dark);
}

/* Settings Sections */
.settings-section {
    margin-bottom: var(--spacing-xl);
    padding-bottom: var(--spacing-xl);
    border-bottom: 1px solid var(--border-gray);
}

.settings-section:last-child {
    border-bottom: none;
}

.settings-section h3 {
    font-size: 18px;
    margin-bottom: var(--spacing-md);
    color: var(--text-dark);
}

/* Provider Selection */
.provider-selection {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
    margin-bottom: var(--spacing-lg);
}

.radio-label {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-md);
    border: 2px solid var(--border-gray);
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: all var(--transition-fast);
}

.radio-label:hover {
    border-color: var(--primary-blue);
    background-color: var(--bg-light);
}

.radio-label input[type="radio"] {
    width: 20px;
    height: 20px;
    cursor: pointer;
}

/* API Key Section */
.api-key-section {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
}

.api-key-section label {
    font-weight: 600;
    color: var(--text-dark);
}

.api-key-section input {
    padding: var(--spacing-md);
    border: 1px solid var(--border-gray);
    border-radius: var(--radius-md);
    font-size: 14px;
}

.button-group {
    display: flex;
    gap: var(--spacing-sm);
}

.status-message {
    font-size: 14px;
    padding: var(--spacing-sm);
}

.status-message.success {
    color: var(--success-green);
}

.status-message.error {
    color: var(--error-red);
}

.help-text {
    font-size: 13px;
    color: var(--text-light);
    font-style: italic;
}

/* Role Selection */
.role-selection {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
}

.role-selection label {
    font-weight: 600;
    color: var(--text-dark);
}

.role-selection select {
    flex: 1;
    padding: var(--spacing-md);
    border: 1px solid var(--border-gray);
    border-radius: var(--radius-md);
    font-size: 14px;
    cursor: pointer;
}

/* Custom Prompt */
.warning-text {
    color: var(--warning-amber);
    font-size: 14px;
    margin-bottom: var(--spacing-md);
    padding: var(--spacing-sm);
    background-color: #fef3c7;
    border-radius: var(--radius-sm);
}

#customPrompt {
    width: 100%;
    padding: var(--spacing-md);
    border: 1px solid var(--border-gray);
    border-radius: var(--radius-md);
    font-size: 14px;
    font-family: inherit;
    resize: vertical;
    margin-bottom: var(--spacing-md);
}
```

#### 3. **app.js**
**Changes:**
- Remove `initApiKey()` function
- Update AppState structure to include `userSettings`
- Add `initUserSettings()` function
- Add settings save/load functions
- Update localStorage management

**New Functions:**
```javascript
// Initialize User Settings
function initUserSettings() {
    loadUserSettings();
    
    // Provider selection
    const providerRadios = document.querySelectorAll('input[name="provider"]');
    providerRadios.forEach(radio => {
        radio.addEventListener('change', handleProviderChange);
    });
    
    // API Key buttons
    document.getElementById('saveApiKeyBtn').addEventListener('click', saveApiKey);
    document.getElementById('clearApiKeyBtn').addEventListener('click', clearApiKey);
    
    // Role selection
    document.getElementById('roleSelect').addEventListener('change', handleRoleChange);
    
    // Custom prompt
    document.getElementById('customPrompt').addEventListener('input', handleCustomPromptChange);
    
    // Save settings button
    document.getElementById('saveSettingsBtn').addEventListener('click', saveAllSettings);
    
    // Update UI
    updateProviderUI();
}

function loadUserSettings() {
    const saved = localStorage.getItem('user_settings');
    if (saved) {
        AppState.userSettings = JSON.parse(saved);
    } else {
        // Default settings
        AppState.userSettings = {
            provider: 'gemini',
            apiKey: '',
            role: 'software-engineer',
            customPrompt: ''
        };
    }
    
    // Update UI with loaded settings
    document.querySelector(`input[name="provider"][value="${AppState.userSettings.provider}"]`).checked = true;
    document.getElementById('settingsApiKey').value = AppState.userSettings.apiKey;
    document.getElementById('roleSelect').value = AppState.userSettings.role;
    document.getElementById('customPrompt').value = AppState.userSettings.customPrompt;
}

function saveUserSettings() {
    localStorage.setItem('user_settings', JSON.stringify(AppState.userSettings));
    console.log('💾 User settings saved');
}

function handleProviderChange(e) {
    AppState.userSettings.provider = e.target.value;
    updateProviderUI();
    saveUserSettings();
}

function updateProviderUI() {
    const provider = AI_PROVIDERS[AppState.userSettings.provider];
    const instructions = document.getElementById('providerInstructions');
    const apiKeyInput = document.getElementById('settingsApiKey');
    
    instructions.textContent = `ℹ️ ${provider.instructions}`;
    apiKeyInput.placeholder = provider.keyPlaceholder;
}

function saveApiKey() {
    const apiKey = document.getElementById('settingsApiKey').value.trim();
    if (apiKey) {
        AppState.userSettings.apiKey = apiKey;
        saveUserSettings();
        updateApiKeyStatus('✓ API Key Saved', 'success');
    } else {
        updateApiKeyStatus('✗ Please enter an API key', 'error');
    }
}

function clearApiKey() {
    if (confirm('Are you sure you want to clear your API key?')) {
        AppState.userSettings.apiKey = '';
        document.getElementById('settingsApiKey').value = '';
        saveUserSettings();
        updateApiKeyStatus('API Key Cleared', 'success');
    }
}

function updateApiKeyStatus(message, type) {
    const status = document.getElementById('apiKeyStatus');
    status.textContent = message;
    status.className = `status-message ${type}`;
}

function handleRoleChange(e) {
    AppState.userSettings.role = e.target.value;
    saveUserSettings();
}

function handleCustomPromptChange(e) {
    AppState.userSettings.customPrompt = e.target.value;
}

function saveAllSettings() {
    saveUserSettings();
    alert('✅ Settings saved successfully!');
}
```

#### 4. **prProcessor.js**
**Changes:**
- Update `analyzeCodeWithAI()` to use `AppState.userSettings`
- Add role-based prompt templates
- Implement prompt construction logic
- Update provider selection to use `AppState.userSettings.provider`

**New Code:**
```javascript
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

// Construct prompt based on user settings
function constructPrompt(code, language) {
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
}

// Update analyzeCodeWithAI function
async analyzeCodeWithAI(code, language) {
    const apiKey = AppState.userSettings.apiKey;
    
    if (!apiKey || apiKey.trim() === '') {
        throw new Error('API key not found. Please add your API key in User Settings.');
    }
    
    const currentProvider = AppState.userSettings.provider;
    const provider = AI_PROVIDERS[currentProvider];
    
    console.log(`🤖 Calling ${provider.name} to analyze code...`);
    console.log(`👤 Using role: ${AppState.userSettings.role}`);
    
    const prompt = constructPrompt(code, language);
    
    // Rest of the function remains similar but uses currentProvider from settings
    // ... (existing API call logic)
}
```

#### 5. **config.js**
**Changes:**
- Remove hardcoded `aiProvider` setting
- Update to be more flexible for dynamic provider selection

**Updated Code:**
```javascript
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

window.APP_CONFIG = CONFIG;
console.log('🔧 Configuration loaded');
```

---

## ✅ Testing Checklist

### User Settings Tab:
- [ ] User Settings tab appears in navigation
- [ ] Clicking tab switches to settings page
- [ ] All form elements render correctly

### API Provider Selection:
- [ ] Can select Gemini provider
- [ ] Can select OpenAI provider
- [ ] Provider instructions update when switching
- [ ] API key placeholder updates when switching

### API Key Management:
- [ ] Can save API key
- [ ] Status message shows success
- [ ] API key persists after page reload
- [ ] Can clear API key
- [ ] Confirmation dialog appears before clearing

### Role Selection:
- [ ] Can select Software Engineer
- [ ] Can select Product Manager
- [ ] Can select Business Analyst
- [ ] Selection persists after page reload

### Custom Prompt:
- [ ] Can enter custom prompt
- [ ] Warning message displays
- [ ] Custom prompt persists after page reload
- [ ] Save Settings button works

### AI Integration:
- [ ] Gemini API calls work with saved key
- [ ] OpenAI API calls work with saved key
- [ ] Role-based prompts generate correct analysis
- [ ] Custom prompt overrides role-based prompts
- [ ] Error messages show for missing API key

### Data Persistence:
- [ ] Settings persist after page reload
- [ ] Settings persist after browser close
- [ ] Switching providers maintains separate keys
- [ ] All settings save to localStorage correctly

---

## 🚀 Implementation Order

1. **Phase 1: UI Structure** (HTML + CSS)
   - Remove API key from header
   - Add User Settings tab
   - Create settings page layout
   - Style all components

2. **Phase 2: State Management** (app.js)
   - Update AppState structure
   - Add user settings functions
   - Implement save/load logic
   - Add event listeners

3. **Phase 3: AI Integration** (prProcessor.js)
   - Add role-based prompts
   - Implement prompt construction
   - Update API call logic
   - Test with both providers

4. **Phase 4: Testing & Polish**
   - Test all functionality
   - Fix bugs
   - Update error messages
   - Add user feedback

---

## 📝 Notes

- Default role is "Software Engineer"
- Default provider is "Gemini" (free)
- Custom prompt completely overrides role-based prompts
- Only one API key stored at a time (for selected provider)
- All settings persist in localStorage
- Clear API key requires confirmation

---

**Ready for implementation? Please review and approve this plan.**