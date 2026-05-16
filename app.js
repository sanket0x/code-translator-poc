// ===== Application State =====
const AppState = {
    currentTab: 'jira',
    userSettings: {
        provider: 'gemini',
        apiKey: '',
        users: []  // Array of user objects: { id, name, role, prompt }
    },
    tasks: [],
    nextTaskId: 1,
    currentEditingTask: null,
    codeEditorState: {
        language: 'go',
        code: '',
        prTitle: ''
    },
    nextUserId: 1  // Counter for generating unique user IDs
};

// ===== Default Code Snippets =====
const DEFAULT_SNIPPETS = {
    go: `package main

import "fmt"

func main() {
    fmt.Println("Hello, World!")
}`,
    python: `def main():
    print("Hello, World!")

if __name__ == "__main__":
    main()`,
    java: `public class HelloWorld {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}`
};

// ===== Program Templates =====
const PROGRAM_TEMPLATES = {
    custom: {
        go: DEFAULT_SNIPPETS.go,
        python: DEFAULT_SNIPPETS.python,
        java: DEFAULT_SNIPPETS.java
    },
    'api-handler': {
        go: `package main

import (
    "encoding/json"
    "net/http"
)

type User struct {
    ID   int    \`json:"id"\`
    Name string \`json:"name"\`
}

func getUserHandler(w http.ResponseWriter, r *http.Request) {
    user := User{ID: 1, Name: "John Doe"}
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(user)
}`,
        python: `from flask import Flask, jsonify

app = Flask(__name__)

@app.route('/api/user/<int:user_id>')
def get_user(user_id):
    user = {'id': user_id, 'name': 'John Doe'}
    return jsonify(user)`,
        java: `@RestController
@RequestMapping("/api")
public class UserController {
    
    @GetMapping("/user/{id}")
    public User getUser(@PathVariable Long id) {
        return new User(id, "John Doe");
    }
}`
    },
    'data-validation': {
        go: `package main

import (
    "errors"
    "regexp"
)

func validateEmail(email string) error {
    pattern := \`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$\`
    matched, _ := regexp.MatchString(pattern, email)
    if !matched {
        return errors.New("invalid email format")
    }
    return nil
}`,
        python: `import re

def validate_email(email):
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(pattern, email):
        return "Invalid email format"
    return None`,
        java: `public class Validator {
    
    private static final String EMAIL_PATTERN =
        "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$";
    
    public boolean isValidEmail(String email) {
        return email.matches(EMAIL_PATTERN);
    }
}`
    },
    'error-handler': {
        go: `package main

import (
    "fmt"
    "net/http"
)

type AppError struct {
    Code    int
    Message string
}

func handleError(w http.ResponseWriter, err *AppError) {
    w.WriteHeader(err.Code)
    fmt.Fprintf(w, \`{"error": "%s"}\`, err.Message)
}`,
        python: `from flask import jsonify

class AppError(Exception):
    def __init__(self, message, status_code=500):
        self.message = message
        self.status_code = status_code

@app.errorhandler(AppError)
def handle_error(error):
    return jsonify({'error': error.message}), error.status_code`,
        java: `@ControllerAdvice
public class ErrorHandler {
    
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleError(Exception ex) {
        ErrorResponse error = new ErrorResponse(
            500, ex.getMessage()
        );
        return new ResponseEntity<>(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}`
    }
};

// ===== Monaco Editor Instance =====
let monacoEditor = null;

// ===== Initialization =====
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Code Translator POC initialized');
    
    // Load data from localStorage FIRST
    loadFromLocalStorage();
    
    // Initialize tab navigation
    initTabNavigation();
    
    // Initialize User Settings
    initUserSettings();
    
    // Initialize Monaco Editor
    initMonacoEditor();
    
    // Initialize event listeners
    initEventListeners();
    
    // Initialize Task Manager (after localStorage is loaded)
    if (typeof TaskManager !== 'undefined') {
        TaskManager.init();
    }
    
    console.log('✅ All systems ready');
});

// ===== Tab Navigation =====
function initTabNavigation() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.dataset.tab;
            switchTab(tabName);
        });
    });
}

function switchTab(tabName) {
    console.log(`📑 Switching to tab: ${tabName}`);
    
    // Update state
    AppState.currentTab = tabName;
    
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.tab === tabName) {
            btn.classList.add('active');
        }
    });
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    const activeContent = document.getElementById(`${tabName}Tab`);
    if (activeContent) {
        activeContent.classList.add('active');
    }
}

// ===== User Settings Management =====
function initUserSettings() {
    // Load user settings from localStorage
    loadUserSettings();
    
    // Provider selection
    const providerRadios = document.querySelectorAll('input[name="provider"]');
    providerRadios.forEach(radio => {
        radio.addEventListener('change', handleProviderChange);
    });
    
    // API Key buttons
    document.getElementById('saveApiKeyBtn').addEventListener('click', saveApiKey);
    document.getElementById('clearApiKeyBtn').addEventListener('click', clearApiKey);
    
    // Add User button
    document.getElementById('addUserBtn').addEventListener('click', addUser);
    
    // Update UI with current provider
    updateProviderUI();
    
    console.log('⚙️ User settings initialized');
}

function loadUserSettings() {
    const saved = localStorage.getItem('user_settings');
    if (saved) {
        try {
            let loadedSettings = JSON.parse(saved);
            
            // Migration: Convert old single-user format to new multi-user format
            if (loadedSettings.role && !loadedSettings.users) {
                console.log('🔄 Migrating old user settings format...');
                
                // Migrate to new format but start with empty users array
                loadedSettings = {
                    provider: loadedSettings.provider,
                    apiKey: loadedSettings.apiKey,
                    users: []
                };
            }
            
            // Ensure users array exists
            if (!loadedSettings.users) {
                loadedSettings.users = [];
            }
            
            AppState.userSettings = loadedSettings;
            console.log('📂 User settings loaded from localStorage');
        } catch (error) {
            console.error('❌ Error loading user settings:', error);
            // Use defaults
            AppState.userSettings = {
                provider: 'gemini',
                apiKey: '',
                users: []
            };
        }
    } else {
        console.log('📂 No saved settings found, using defaults');
    }
    
    // Ensure users array exists in AppState
    if (!AppState.userSettings.users) {
        AppState.userSettings.users = [];
    }
    
    // Update UI with loaded settings
    const providerRadio = document.querySelector(`input[name="provider"][value="${AppState.userSettings.provider}"]`);
    if (providerRadio) providerRadio.checked = true;
    
    document.getElementById('settingsApiKey').value = AppState.userSettings.apiKey || '';
    
    // Render user cards
    renderUserCards();
}

function saveUserSettings() {
    localStorage.setItem('user_settings', JSON.stringify(AppState.userSettings));
    console.log('💾 User settings saved to localStorage');
}

function handleProviderChange(e) {
    AppState.userSettings.provider = e.target.value;
    updateProviderUI();
    saveUserSettings();
    console.log(`🔄 Provider changed to: ${e.target.value}`);
}

function updateProviderUI() {
    const providers = {
        gemini: {
            instructions: 'Get your FREE API key from https://aistudio.google.com/app/apikey',
            placeholder: 'AIza...'
        },
        openai: {
            instructions: 'Get your API key from https://platform.openai.com/api-keys',
            placeholder: 'sk-...'
        }
    };
    
    const provider = providers[AppState.userSettings.provider];
    const instructions = document.getElementById('providerInstructions');
    const apiKeyInput = document.getElementById('settingsApiKey');
    
    if (instructions && provider) {
        instructions.textContent = `ℹ️ ${provider.instructions}`;
    }
    if (apiKeyInput && provider) {
        apiKeyInput.placeholder = provider.placeholder;
    }
}

function saveApiKey() {
    const apiKey = document.getElementById('settingsApiKey').value.trim();
    
    if (apiKey) {
        AppState.userSettings.apiKey = apiKey;
        saveUserSettings();
        updateApiKeyStatus('✓ API Key Saved', 'success');
        console.log('🔑 API key saved');
    } else {
        updateApiKeyStatus('✗ Please enter an API key', 'error');
    }
}

function clearApiKey() {
    if (confirm('⚠️ Are you sure you want to clear your API key?')) {
        AppState.userSettings.apiKey = '';
        document.getElementById('settingsApiKey').value = '';
        saveUserSettings();
        updateApiKeyStatus('🗑️ API Key Cleared', 'success');
        console.log('🗑️ API key cleared');
    }
}

function updateApiKeyStatus(message, type) {
    const status = document.getElementById('apiKeyStatus');
    status.textContent = message;
    status.className = `status-message show ${type}`;
    
    // Hide after 3 seconds
    setTimeout(() => {
        status.className = 'status-message';
    }, 3000);
}

// ===== User Management Functions =====

// Role-based default prompts
const ROLE_PROMPTS = {
    'developer': `Review this code change for implementation quality. Flag any potential bugs, performance issues, anti-patterns, or security concerns. Highlight non-obvious logic that future maintainers should understand.`,
    
    'product-manager': `Analyze this code change from a product perspective. Does it fulfill the stated requirements? Are there any scope gaps, missing edge cases from the spec, or unintended behavior changes that could affect users?`,
    
    'designer': `Identify any UI/UX-impacting changes in this diff. Look for hardcoded strings, layout or spacing changes, new user-facing states (loading, error, empty), and flag anything that might break visual consistency.`,
    
    'documentation': `Summarize what changed in plain English for documentation purposes. List any new or modified APIs, parameters, or behaviors that need to be reflected in user-facing or internal docs.`,
    
    'customer-support': `Explain what this change means for end users in simple, non-technical terms. Will users notice anything different? Are there new error messages, changed workflows, or known limitations they might ask about?`,
    
    'engineering-manager': `Give a high-level summary of this change: what problem it solves, its approach, estimated complexity, and any risks around deployment, rollback, or cross-team dependencies.`,
    
    'qa': `Identify scenarios that need testing in this change. List happy paths, edge cases, boundary conditions, and any regression risks. Flag areas where existing tests may be insufficient.`
};

function addUser() {
    // Check max limit
    if (AppState.userSettings.users.length >= 5) {
        alert('⚠️ Maximum 5 users allowed');
        return;
    }
    
    // Create new user
    const newUser = {
        id: `user-${AppState.nextUserId}`,
        name: '',
        role: '',
        prompt: ''
    };
    
    AppState.userSettings.users.push(newUser);
    AppState.nextUserId++;
    
    // Render and save
    renderUserCards();
    saveUserSettings();
    
    console.log(`➕ Added user: ${newUser.id}`);
}

function removeUser(userId) {
    if (!confirm('⚠️ Are you sure you want to remove this user?')) {
        return;
    }
    
    // Remove from array
    AppState.userSettings.users = AppState.userSettings.users.filter(u => u.id !== userId);
    
    // Render and save
    renderUserCards();
    saveUserSettings();
    
    console.log(`🗑️ Removed user: ${userId}`);
}

function handleUserNameChange(userId, name) {
    const user = AppState.userSettings.users.find(u => u.id === userId);
    if (user) {
        user.name = name;
        saveUserSettings();
    }
}

function handleUserRoleChange(userId, role) {
    const user = AppState.userSettings.users.find(u => u.id === userId);
    if (!user) return;
    
    // If user already has a custom prompt, confirm before overwriting
    if (user.prompt && user.prompt !== ROLE_PROMPTS[user.role]) {
        if (!confirm('⚠️ Changing the role will reset the prompt to the default. Continue?')) {
            // Revert the select back to previous role
            const selectElement = document.querySelector(`[data-user-id="${userId}"] .user-role-select`);
            if (selectElement) {
                selectElement.value = user.role;
            }
            return;
        }
    }
    
    user.role = role;
    user.prompt = ROLE_PROMPTS[role] || '';
    
    // Update the prompt textarea
    const promptTextarea = document.querySelector(`[data-user-id="${userId}"] .user-prompt-textarea`);
    if (promptTextarea) {
        promptTextarea.value = user.prompt;
        updatePromptCharCount(userId, user.prompt.length);
    }
    
    saveUserSettings();
}

function handleUserPromptChange(userId, prompt) {
    const user = AppState.userSettings.users.find(u => u.id === userId);
    if (user) {
        user.prompt = prompt;
        updatePromptCharCount(userId, prompt.length);
        // Debounced save
        clearTimeout(user.saveTimeout);
        user.saveTimeout = setTimeout(() => {
            saveUserSettings();
        }, 500);
    }
}

function updatePromptCharCount(userId, count) {
    const counter = document.querySelector(`[data-user-id="${userId}"] .prompt-char-count`);
    if (counter) {
        counter.textContent = `${count}/500`;
        
        // Change color if approaching limit
        if (count > 450) {
            counter.style.color = 'var(--warning-amber)';
        } else {
            counter.style.color = 'var(--text-light)';
        }
    }
}

function isUserValid(user) {
    return user.name && user.name.trim() !== '' && user.role && user.role !== '';
}

function updateCardValidation(card, userId) {
    const user = AppState.userSettings.users.find(u => u.id === userId);
    if (!user) return;
    
    const isValid = isUserValid(user);
    const warningDiv = card.querySelector('.user-card-warning');
    
    if (isValid) {
        card.classList.remove('user-card-invalid');
        if (warningDiv) {
            warningDiv.remove();
        }
    } else {
        card.classList.add('user-card-invalid');
        if (!warningDiv) {
            const warning = document.createElement('div');
            warning.className = 'user-card-warning';
            warning.textContent = '⚠️ Required fields not set. This user will not be available for tagging.';
            card.appendChild(warning);
        }
    }
    
    // Update add user button state
    updateAddUserButton();
}

function renderUserCards() {
    const container = document.getElementById('usersContainer');
    if (!container) return;
    
    // Clear existing cards
    container.innerHTML = '';
    
    // Render each user
    AppState.userSettings.users.forEach((user, index) => {
        const userCard = createUserCard(user, index + 1);
        container.appendChild(userCard);
    });
    
    // Update Add User button
    updateAddUserButton();
}

function createUserCard(user, userNumber) {
    const card = document.createElement('div');
    const isValid = isUserValid(user);
    card.className = isValid ? 'user-card' : 'user-card user-card-invalid';
    card.setAttribute('data-user-id', user.id);
    
    const warningHtml = !isValid ? `
        <div class="user-card-warning">
            ⚠️ Required fields not set. This user will not be available for tagging.
        </div>
    ` : '';
    
    card.innerHTML = `
        <div class="user-card-header">
            <span class="user-number">User ${userNumber}</span>
            <button class="remove-user-btn" onclick="removeUser('${user.id}')">
                🗑️ Remove
            </button>
        </div>
        ${warningHtml}
        <div class="user-card-body">
            <div class="form-group">
                <label>Name *</label>
                <input type="text"
                       class="user-name-input"
                       placeholder="Enter user name..."
                       maxlength="50"
                       value="${user.name || ''}"
                       required />
            </div>
            
            <div class="form-group">
                <label>Role *</label>
                <select class="user-role-select" required>
                    <option value="">-- Select Role --</option>
                    <option value="developer" ${user.role === 'developer' ? 'selected' : ''}>Developer</option>
                    <option value="product-manager" ${user.role === 'product-manager' ? 'selected' : ''}>Product Manager</option>
                    <option value="designer" ${user.role === 'designer' ? 'selected' : ''}>Designer</option>
                    <option value="documentation" ${user.role === 'documentation' ? 'selected' : ''}>Documentation</option>
                    <option value="customer-support" ${user.role === 'customer-support' ? 'selected' : ''}>Customer Support</option>
                    <option value="engineering-manager" ${user.role === 'engineering-manager' ? 'selected' : ''}>Engineering Manager</option>
                    <option value="qa" ${user.role === 'qa' ? 'selected' : ''}>QA</option>
                </select>
            </div>
            
            <div class="form-group">
                <label>Prompt (Editable)</label>
                <textarea class="user-prompt-textarea"
                          rows="4"
                          maxlength="500"
                          placeholder="Select a role to load default prompt...">${user.prompt || ''}</textarea>
                <div class="char-counter">
                    <span class="prompt-char-count">${(user.prompt || '').length}/500</span>
                </div>
            </div>
        </div>
    `;
    
    // Attach event listeners
    const nameInput = card.querySelector('.user-name-input');
    nameInput.addEventListener('input', (e) => {
        handleUserNameChange(user.id, e.target.value);
        // Update validation state without full re-render
        updateCardValidation(card, user.id);
    });
    
    const roleSelect = card.querySelector('.user-role-select');
    roleSelect.addEventListener('change', (e) => {
        handleUserRoleChange(user.id, e.target.value);
        // Update validation state without full re-render
        updateCardValidation(card, user.id);
    });
    
    const promptTextarea = card.querySelector('.user-prompt-textarea');
    promptTextarea.addEventListener('input', (e) => handleUserPromptChange(user.id, e.target.value));
    
    return card;
}

function updateAddUserButton() {
    const button = document.getElementById('addUserBtn');
    if (!button) return;
    
    const userCount = AppState.userSettings.users.length;
    button.textContent = `➕ Add User (${userCount}/5)`;
    
    if (userCount >= 5) {
        button.disabled = true;
        button.style.opacity = '0.5';
        button.style.cursor = 'not-allowed';
    } else {
        button.disabled = false;
        button.style.opacity = '1';
        button.style.cursor = 'pointer';
    }
}

// ===== Monaco Editor Initialization =====
function initMonacoEditor() {
    require.config({ paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs' } });
    
    require(['vs/editor/editor.main'], function () {
        const container = document.getElementById('monacoEditorContainer');
        
        // Get initial code - use saved code or default template
        const initialCode = AppState.codeEditorState.code ||
                           PROGRAM_TEMPLATES.custom[AppState.codeEditorState.language];
        
        monacoEditor = monaco.editor.create(container, {
            value: initialCode,
            language: AppState.codeEditorState.language,
            theme: 'vs-dark',
            automaticLayout: true,
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            tabSize: 4,
            insertSpaces: true
        });
        
        // Listen for content changes
        monacoEditor.onDidChangeModelContent(() => {
            AppState.codeEditorState.code = monacoEditor.getValue();
            saveToLocalStorage();
        });
        
        console.log('✅ Monaco Editor initialized');
    });
}

// ===== Event Listeners =====
function initEventListeners() {
    // Modal controls
    const newTaskBtn = document.getElementById('newTaskBtn');
    const clearAllBtn = document.getElementById('clearAllBtn');
    const closeModal = document.getElementById('closeModal');
    const modalOverlay = document.getElementById('modalOverlay');
    const cancelTaskBtn = document.getElementById('cancelTaskBtn');
    
    newTaskBtn.addEventListener('click', openNewTaskModal);
    clearAllBtn.addEventListener('click', clearAllData);
    closeModal.addEventListener('click', closeTaskModal);
    modalOverlay.addEventListener('click', closeTaskModal);
    cancelTaskBtn.addEventListener('click', closeTaskModal);
    
    // Character counters
    const taskTitle = document.getElementById('taskTitle');
    const taskDescription = document.getElementById('taskDescription');
    
    taskTitle.addEventListener('input', () => updateCharCount('title', taskTitle.value.length, 80));
    taskDescription.addEventListener('input', () => updateCharCount('desc', taskDescription.value.length, 255));
    
    // Code editor language selector
    const languageSelect = document.getElementById('languageSelect');
    languageSelect.addEventListener('change', handleLanguageChange);
    
    // Program template selector
    const programSelect = document.getElementById('programSelect');
    programSelect.addEventListener('change', handleProgramChange);
    
    // PR controls
    const prTitle = document.getElementById('prTitle');
    const createPrBtn = document.getElementById('createPrBtn');
    prTitle.addEventListener('input', handlePrTitleChange);
    createPrBtn.addEventListener('click', handleCreatePR);
}

// ===== Modal Management =====
function openNewTaskModal() {
    console.log('📝 Opening new task modal');
    
    AppState.currentEditingTask = null;
    
    // Reset form
    document.getElementById('modalTitle').textContent = 'New Task';
    document.getElementById('taskTitle').value = '';
    document.getElementById('taskDescription').value = '';
    document.getElementById('taskComments').innerHTML = '';
    
    updateCharCount('title', 0, 80);
    updateCharCount('desc', 0, 255);
    
    // Clear tagged users
    const taggedContainer = document.getElementById('taggedUsersContainer');
    if (taggedContainer) {
        taggedContainer.innerHTML = '';
    }
    
    // Populate user tag dropdown
    populateUserTagDropdown();
    
    // Show modal
    document.getElementById('taskModal').classList.add('show');
    document.getElementById('modalOverlay').classList.add('show');
    
    // Focus on title input
    document.getElementById('taskTitle').focus();
}

function closeTaskModal() {
    console.log('❌ Closing task modal');
    
    document.getElementById('taskModal').classList.remove('show');
    document.getElementById('modalOverlay').classList.remove('show');
    AppState.currentEditingTask = null;
}

function updateCharCount(type, current, max) {
    const countElement = document.getElementById(`${type}CharCount`);
    countElement.textContent = `${current}/${max}`;
    
    if (current > max * 0.9) {
        countElement.style.color = 'var(--warning-amber)';
    } else {
        countElement.style.color = 'var(--text-light)';
    }
}

// ===== Task Management =====
function saveTask() {
    const success = TaskManager.saveTaskFromModal();
    
    if (success) {
        closeTaskModal();
    }
}

// ===== Code Editor Management =====
function handleLanguageChange(e) {
    const language = e.target.value;
    const program = document.getElementById('programSelect').value;
    console.log(`🔄 Language changed to: ${language}`);
    
    AppState.codeEditorState.language = language;
    
    if (monacoEditor) {
        // Update Monaco editor language
        const model = monacoEditor.getModel();
        monaco.editor.setModelLanguage(model, language);
        
        // Load template for current program and new language
        const template = PROGRAM_TEMPLATES[program][language];
        monacoEditor.setValue(template);
        AppState.codeEditorState.code = template;
    }
    
    saveToLocalStorage();
}

function handleProgramChange(e) {
    const program = e.target.value;
    const language = AppState.codeEditorState.language;
    console.log(`📝 Program template changed to: ${program}`);
    
    if (monacoEditor) {
        // Load template for selected program and current language
        const template = PROGRAM_TEMPLATES[program][language];
        monacoEditor.setValue(template);
        AppState.codeEditorState.code = template;
    }
    
    saveToLocalStorage();
}

function handlePrTitleChange(e) {
    AppState.codeEditorState.prTitle = e.target.value;
    saveToLocalStorage();
}


function handleCreatePR() {
    console.log('🚀 Create PR clicked');
    
    // Delegate to PR Processor
    if (typeof PRProcessor !== 'undefined') {
        PRProcessor.handleCreatePR();
    } else {
        console.error('❌ PR Processor not loaded');
        showPrStatus('Error: PR Processor not loaded', 'error');
    }
}

function showPrStatus(message, type) {
    const prStatus = document.getElementById('prStatus');
    
    if (message) {
        prStatus.textContent = message;
        prStatus.className = `pr-status show ${type}`;
    } else {
        prStatus.className = 'pr-status';
    }
}

// ===== LocalStorage Management =====
function saveToLocalStorage() {
    const data = {
        tasks: AppState.tasks,
        nextTaskId: AppState.nextTaskId,
        codeEditorState: AppState.codeEditorState
    };
    
    localStorage.setItem('code_translator_data', JSON.stringify(data));
    console.log('💾 Data saved to localStorage');
}

function loadFromLocalStorage() {
    const savedData = localStorage.getItem('code_translator_data');
    
    if (savedData) {
        try {
            const data = JSON.parse(savedData);
            
            AppState.tasks = data.tasks || [];
            AppState.nextTaskId = data.nextTaskId || 1;
            AppState.codeEditorState = data.codeEditorState || {
                language: 'go',
                code: '',
                prTitle: ''
            };
            
            console.log('📂 Data loaded from localStorage');
            
            // Update UI
            document.getElementById('prTitle').value = AppState.codeEditorState.prTitle || '';
            
        } catch (error) {
            console.error('❌ Error loading data from localStorage:', error);
        }
    } else {
        console.log('📂 No saved data found, using defaults');
    }
}

// ===== Clear All Data =====
function clearAllData() {
    const confirmed = confirm(
        '⚠️ Are you sure you want to clear all tasks?\n\n' +
        'This will delete:\n' +
        '• All tasks from all columns\n' +
        '• All comments\n\n' +
        'Your API key and code editor content will be preserved.\n\n' +
        'This action cannot be undone!'
    );
    
    if (!confirmed) {
        return;
    }
    
    console.log('🗑️ Clearing all tasks...');
    
    // Reset only tasks
    AppState.tasks = [];
    AppState.nextTaskId = 1;
    
    // Save to localStorage (preserves code editor and API key)
    saveToLocalStorage();
    
    // Re-render task board
    if (typeof TaskManager !== 'undefined') {
        TaskManager.renderAllTasks();
    }
    
    console.log('✅ All tasks cleared');
    alert('✅ All tasks have been cleared successfully!');
}

// ===== User Tagging Functions =====
function getValidUsers() {
    return AppState.userSettings.users.filter(u => isUserValid(u));
}

function populateUserTagDropdown() {
    const select = document.getElementById('userTagSelect');
    if (!select) return;
    
    const validUsers = getValidUsers();
    
    // Clear existing options except first
    select.innerHTML = '<option value="">-- Tag a user --</option>';
    
    // Add valid users
    validUsers.forEach(user => {
        const option = document.createElement('option');
        option.value = user.id;
        option.textContent = `${user.name} (${user.role})`;
        select.appendChild(option);
    });
    
    // Add change event listener
    select.onchange = function() {
        if (this.value) {
            addUserTagToTask(this.value);
            this.value = ''; // Reset dropdown
        }
    };
}

function addUserTagToTask(userId) {
    const taskId = AppState.currentEditingTask;
    if (!taskId) return;
    
    const task = TaskManager.getTaskById(taskId);
    if (!task) return;
    
    // Initialize taggedUsers if not exists
    if (!task.taggedUsers) {
        task.taggedUsers = [];
    }
    
    // Check if already tagged
    if (task.taggedUsers.includes(userId)) {
        return;
    }
    
    // Add user
    task.taggedUsers.push(userId);
    
    // Re-render tags
    renderTaggedUsers(task);
    
    // Save
    saveToLocalStorage();
}

function removeUserTagFromTask(userId) {
    const taskId = AppState.currentEditingTask;
    if (!taskId) return;
    
    const task = TaskManager.getTaskById(taskId);
    if (!task) return;
    
    // Remove user
    task.taggedUsers = task.taggedUsers.filter(id => id !== userId);
    
    // Re-render tags
    renderTaggedUsers(task);
    
    // Save
    saveToLocalStorage();
}

function renderTaggedUsers(task) {
    const container = document.getElementById('taggedUsersContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (!task.taggedUsers || task.taggedUsers.length === 0) {
        return;
    }
    
    task.taggedUsers.forEach(userId => {
        const user = AppState.userSettings.users.find(u => u.id === userId);
        if (!user || !isUserValid(user)) return;
        
        const tag = document.createElement('div');
        tag.className = 'user-tag';
        tag.innerHTML = `
            ${user.name}
            <button class="user-tag-remove" onclick="removeUserTagFromTask('${userId}')" type="button">
                ×
            </button>
        `;
        container.appendChild(tag);
    });
}

// ===== Utility Functions =====
function formatDate(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes} min${minutes > 1 ? 's' : ''} ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return `${days} day${days > 1 ? 's' : ''} ago`;
}

