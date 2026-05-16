// ===== Application State =====
const AppState = {
    currentTab: 'jira',
    apiKey: localStorage.getItem('openai_api_key') || '',
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

// ===== Monaco Editor Instance =====
let monacoEditor = null;

// ===== Initialization =====
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Code Translator POC initialized');
    
    // Load data from localStorage FIRST
    loadFromLocalStorage();
    
    // Initialize tab navigation
    initTabNavigation();
    
    // Initialize API key
    initApiKey();
    
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

// ===== API Key Management =====
function initApiKey() {
    const apiKeyInput = document.getElementById('apiKeyInput');
    const saveApiKeyBtn = document.getElementById('saveApiKeyBtn');
    const apiKeyStatus = document.getElementById('apiKeyStatus');
    
    // Load saved API key
    if (AppState.apiKey) {
        apiKeyInput.value = AppState.apiKey;
        updateApiKeyStatus('✓ Saved', 'success');
    }
    
    // Save API key
    saveApiKeyBtn.addEventListener('click', () => {
        const apiKey = apiKeyInput.value.trim();
        
        if (apiKey) {
            AppState.apiKey = apiKey;
            localStorage.setItem('openai_api_key', apiKey);
            updateApiKeyStatus('✓ Saved', 'success');
            console.log('🔑 API key saved');
        } else {
            updateApiKeyStatus('✗ Empty', 'error');
        }
    });
}

function updateApiKeyStatus(message, type) {
    const apiKeyStatus = document.getElementById('apiKeyStatus');
    apiKeyStatus.textContent = message;
    apiKeyStatus.className = `api-key-status ${type}`;
}

// ===== Monaco Editor Initialization =====
function initMonacoEditor() {
    require.config({ paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs' } });
    
    require(['vs/editor/editor.main'], function () {
        const container = document.getElementById('monacoEditorContainer');
        
        monacoEditor = monaco.editor.create(container, {
            value: AppState.codeEditorState.code || DEFAULT_SNIPPETS[AppState.codeEditorState.language],
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
    console.log(`🔄 Language changed to: ${language}`);
    
    AppState.codeEditorState.language = language;
    
    if (monacoEditor) {
        // Update Monaco editor language
        const model = monacoEditor.getModel();
        monaco.editor.setModelLanguage(model, language);
        
        // Load default snippet for new language
        monacoEditor.setValue(DEFAULT_SNIPPETS[language]);
        AppState.codeEditorState.code = DEFAULT_SNIPPETS[language];
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

