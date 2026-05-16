// ===== Application State =====
const AppState = {
    currentTab: 'jira',
    userSettings: {
        provider: 'gemini',
        apiKey: '',
        role: 'software-engineer',
        customPrompt: ''
    },
    tasks: [],
    nextTaskId: 1,
    currentEditingTask: null,
    codeEditorState: {
        language: 'go',
        code: '',
        prTitle: ''
    }
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
    
    // Role selection
    document.getElementById('roleSelect').addEventListener('change', handleRoleChange);
    
    // Custom prompt
    document.getElementById('customPrompt').addEventListener('input', handleCustomPromptChange);
    
    // Save settings button
    document.getElementById('saveSettingsBtn').addEventListener('click', saveAllSettings);
    
    // Update UI with current provider
    updateProviderUI();
    
    console.log('⚙️ User settings initialized');
}

function loadUserSettings() {
    const saved = localStorage.getItem('user_settings');
    if (saved) {
        try {
            AppState.userSettings = JSON.parse(saved);
            console.log('📂 User settings loaded from localStorage');
        } catch (error) {
            console.error('❌ Error loading user settings:', error);
            // Use defaults
            AppState.userSettings = {
                provider: 'gemini',
                apiKey: '',
                role: 'software-engineer',
                customPrompt: ''
            };
        }
    } else {
        console.log('📂 No saved settings found, using defaults');
    }
    
    // Update UI with loaded settings
    const providerRadio = document.querySelector(`input[name="provider"][value="${AppState.userSettings.provider}"]`);
    if (providerRadio) providerRadio.checked = true;
    
    document.getElementById('settingsApiKey').value = AppState.userSettings.apiKey || '';
    document.getElementById('roleSelect').value = AppState.userSettings.role || 'software-engineer';
    
    const customPromptValue = AppState.userSettings.customPrompt || '';
    document.getElementById('customPrompt').value = customPromptValue;
    updateCustomPromptCharCount(customPromptValue.length);
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

function handleRoleChange(e) {
    AppState.userSettings.role = e.target.value;
    saveUserSettings();
    console.log(`👤 Role changed to: ${e.target.value}`);
}

function handleCustomPromptChange(e) {
    AppState.userSettings.customPrompt = e.target.value;
    updateCustomPromptCharCount(e.target.value.length);
    // Don't auto-save on every keystroke, wait for Save button
}

function updateCustomPromptCharCount(count) {
    const counter = document.getElementById('customPromptCharCount');
    if (counter) {
        counter.textContent = `${count}/64`;
        
        // Change color if approaching limit
        if (count > 57) {
            counter.style.color = 'var(--warning-amber)';
        } else {
            counter.style.color = 'var(--text-light)';
        }
    }
}

function saveAllSettings() {
    // Save custom prompt
    AppState.userSettings.customPrompt = document.getElementById('customPrompt').value.trim();
    saveUserSettings();
    
    // Show success message
    alert('✅ All settings saved successfully!');
    console.log('💾 All settings saved');
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
    const saveTaskBtn = document.getElementById('saveTaskBtn');
    
    newTaskBtn.addEventListener('click', openNewTaskModal);
    clearAllBtn.addEventListener('click', clearAllData);
    closeModal.addEventListener('click', closeTaskModal);
    modalOverlay.addEventListener('click', closeTaskModal);
    cancelTaskBtn.addEventListener('click', closeTaskModal);
    saveTaskBtn.addEventListener('click', saveTask);
    
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

