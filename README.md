# 🔄 Code Translator POC

A web application that translates GitHub PR code changes into business context and automatically adds them as comments to related Jira tasks.

## 🎯 Features

- **Jira-style Task Board**: Kanban board with drag-and-drop functionality (ToDo, In Progress, Done)
- **Code Editor**: Multi-language support (Go, Python, Java) with syntax highlighting
- **AI-Powered Translation**: Uses GPT-4 to convert code changes into plain English explanations
- **Automatic Task Linking**: Matches PR titles to tasks and adds comments automatically
- **No Backend Required**: Fully client-side with localStorage persistence

## 🚀 Quick Start

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, or Edge)
- OpenAI API key (for Phase 4 - GPT integration)

### Running Locally

1. **Clone or download this repository**
   ```bash
   git clone <repository-url>
   cd code-translator-poc
   ```

2. **Open the application**
   
   Simply open `index.html` in your web browser:
   
   **Option A: Double-click**
   - Navigate to the project folder
   - Double-click `index.html`
   
   **Option B: Using a local server (recommended)**
   ```bash
   # Using Python 3
   python3 -m http.server 8000
   
   # Using Python 2
   python -m SimpleHTTPServer 8000
   
   # Using Node.js (if you have http-server installed)
   npx http-server -p 8000
   ```
   
   Then open your browser and navigate to:
   ```
   http://localhost:8000
   ```

3. **Start using the app!**
   - The application will load with default settings
   - All data is stored in your browser's localStorage
   - No installation or build process required

## 📖 Usage Guide

### Tab 1: Jira/Tasks Board

1. **Create a New Task**
   - Click the "➕ New Task" button
   - Enter a title (max 80 characters)
   - Enter a description (max 255 characters)
   - Click "Save Task"

2. **Move Tasks**
   - Drag and drop tasks between columns (ToDo → In Progress → Done)
   - Tasks automatically save their new status

3. **Edit Tasks**
   - Click on any task card to edit its details
   - View comments added by the Code Translator

### Tab 2: Code Editor

1. **Select Language**
   - Choose from Go, Python, or Java
   - Default "Hello World" snippet loads automatically

2. **Write Code**
   - Edit the code in the editor
   - Line numbers update automatically
   - Syntax highlighting updates in real-time

3. **Create a PR**
   - Enter a PR title with task number format: `task-X: Description`
   - Example: `task-1: Add user authentication`
   - Click "Create PR"
   - The system will:
     - Extract the task number from your PR title
     - Validate that the task exists
     - Send your code to GPT-4 for analysis
     - Generate a plain English explanation
     - Automatically add it as a comment to the task
   - View the task to see the AI-generated comment

## 🎯 Complete Example Workflow

Here's a complete example of using the application:

### Step 1: Setup
```
1. Open index.html in your browser
2. Get FREE Google Gemini API key from https://aistudio.google.com/app/apikey
3. Add your API key in the header
4. Click blue "Save" button - you'll see "✓ Saved"
```

### Step 2: Create a Task
```
1. Go to "Jira/Tasks" tab
2. Click "➕ New Task"
3. Title: "Add user authentication"
4. Description: "Implement OAuth2 login with Google"
5. Click "Save Task"
6. Task "task-1" appears in the ToDo column
```

### Step 3: Write Code
```
1. Go to "Code Editor" tab
2. Select "Python" from dropdown
3. Write your code:

def authenticate_user(email, password):
    """Authenticate user with OAuth2"""
    if not email or not password:
        return {"error": "Missing credentials"}
    
    # Validate with OAuth provider
    token = oauth_provider.validate(email, password)
    
    if token:
        return {"success": True, "token": token}
    return {"error": "Invalid credentials"}
```

### Step 4: Create PR
```
1. Enter PR title: "task-1: Add OAuth2 authentication"
2. Click "Create PR"
3. Wait for Google Gemini analysis (a few seconds)
4. See success message: "✅ Success! Comment added to task-1"
```

### Step 5: View Result
```
1. Click "👁️ View Task" button (or switch to Jira tab)
2. Click on task-1
3. See the AI-generated comment:
   "🤖 Code Translator • just now
   Code changes: This function authenticates users using OAuth2.
   It validates email and password credentials with an OAuth provider
   and returns either a success token or an error message for invalid
   or missing credentials."
```

### Step 6: Move Task
```
1. Drag task-1 from "ToDo" to "In Progress"
2. Task moves smoothly with animation
3. Task count updates automatically
```

### API Key Setup (Required for AI Integration)

**Using Google Gemini (FREE - Recommended):**
1. Get your FREE API key from https://aistudio.google.com/app/apikey
2. Click on the API key input in the header
3. Enter your Google AI API key
4. Click the blue "Save" button
5. The key is stored securely in your browser's localStorage
6. You'll see a "✓ Saved" confirmation

**Using OpenAI (Paid):**
1. Get your API key from https://platform.openai.com/api-keys
2. Open `config.js` and change `aiProvider: 'openai'`
3. Enter your OpenAI API key in the header
4. Click "Save"

**Note**: Your API key is stored locally in your browser and never sent anywhere except directly to the AI provider's API.

## 🏗️ Project Structure

```
code-translator-poc/
├── index.html              # Main HTML structure
├── styles.css              # All styling (clean, modern design)
├── config.js               # Configuration (AI provider selection)
├── app.js                  # Main application logic
├── taskManager.js          # Task CRUD operations
├── prProcessor.js          # PR processing & AI integration
├── README.md               # This file
├── IMPLEMENTATION_PLAN.md  # Detailed implementation roadmap
└── DESIGN_MOCKUP.md        # Visual design specifications
```

## 🔧 AI Provider Configuration

The application supports multiple AI providers. **Google Gemini 2.0 Flash is configured by default (FREE!)**.

### Option 1: Google Gemini 1.5 Flash (Default - FREE!)
1. Get FREE API key from https://aistudio.google.com/app/apikey
2. No configuration needed - already set as default
3. Uses Gemini 1.5 Flash model
4. **Completely free to use!**

### Option 2: OpenAI
1. Open `config.js`
2. Set `aiProvider: 'openai'`
3. Get API key from https://platform.openai.com/api-keys
4. Uses GPT-3.5-Turbo model (paid)

**Example config.js:**
```javascript
const CONFIG = {
    aiProvider: 'gemini',  // Change to 'openai' if needed
    // ... rest of config
};
```

**Note**: The application automatically adapts to the selected provider's API format.

## 🔧 Development Phases

### ✅ Phase 1: Foundation & Basic Structure (COMPLETE)
- ✅ Project setup with HTML, CSS, JS
- ✅ Tab navigation system
- ✅ Basic layout and styling
- ✅ API key management
- ✅ LocalStorage integration
- ✅ Syntax highlighting with Prism.js (Go, Python, Java)
- ✅ Line numbers in code editor

### ✅ Phase 2: Jira Board Core Functionality (COMPLETE)
- ✅ Task creation with validation (80/255 char limits)
- ✅ Drag-and-drop between columns (ToDo, In Progress, Done)
- ✅ Task editing with modal
- ✅ Comment system (append-only)
- ✅ Full localStorage persistence
- ✅ Task counts per column
- ✅ Empty state handling

### ✅ Phase 3: Code Editor Implementation (COMPLETE)
- ✅ Language selector (Go, Python, Java)
- ✅ Syntax highlighting with Prism.js
- ✅ Default code snippets
- ✅ PR title input
- ✅ Line numbers
- ✅ Dark theme

### ✅ Phase 4: AI Integration & Task Matching (COMPLETE)
- ✅ Multi-provider AI integration (Google Gemini, OpenAI)
- ✅ Code analysis with Google Gemini 1.5 Flash (FREE!)
- ✅ Task number extraction from PR titles
- ✅ Automatic comment generation
- ✅ Task matching and validation
- ✅ Success/error handling

### ✨ Phase 5: Polish & Testing (PENDING)
- Enhanced animations
- Error handling
- Mobile responsiveness
- Final testing

## 🎨 Design Philosophy

- **Clean & Modern**: Minimalist design focused on functionality
- **Intuitive**: Familiar patterns (Kanban board, code editor)
- **Responsive**: Works on desktop, tablet, and mobile
- **Professional**: Suitable for hackathon presentations

## 🔒 Data Storage

All data is stored locally in your browser using localStorage:
- Tasks and their status
- Code editor content
- API key (encrypted in browser)
- User preferences

**Note**: Data persists until you clear your browser cache or use a different browser.

## 🐛 Troubleshooting

### Application won't load
- Make sure you're opening `index.html` in a modern browser
- Check the browser console (F12) for errors
- Try using a local server instead of opening the file directly

### Tasks not saving
- Check if localStorage is enabled in your browser
- Clear browser cache and reload
- Check browser console for errors

### API key not working
- Verify your OpenAI API key is valid
- Check if you have sufficient API credits
- Look for error messages in the browser console

### Styling looks broken
- Make sure `styles.css` is in the same directory as `index.html`
- Clear browser cache and hard reload (Ctrl+Shift+R or Cmd+Shift+R)

## 📝 Current Status

**Phases 1-4 Complete!** ✅

**Full End-to-End Workflow:**
1. ✅ Create a task (e.g., "task-1: Add login feature")
2. ✅ Write code in the editor
3. ✅ Enter PR title with task number: "task-1: Implement OAuth login"
4. ✅ Click "Create PR"
5. ✅ GPT-4 analyzes your code
6. ✅ Comment automatically added to task-1
7. ✅ View the task to see the AI-generated explanation

**All Features Working:**
- ✅ Full Kanban board with drag-and-drop
- ✅ Task creation and editing
- ✅ Multi-language code editor with syntax highlighting
- ✅ GPT-4 code analysis
- ✅ Automatic task linking and comments
- ✅ Complete localStorage persistence

**Coming in Phase 5:**
- Final polish and testing
- Bug fixes and edge case handling

## 🤝 Contributing

This is a POC (Proof of Concept) project. Feel free to:
- Report bugs
- Suggest features
- Submit pull requests

## 📄 License

MIT License - feel free to use this project for learning or as a starting point for your own applications.

## 🙏 Acknowledgments

- Built with vanilla JavaScript (no frameworks!)
- Styled with custom CSS (no UI libraries!)
- Powered by OpenAI GPT-4

---

**Made with ❤️ for hackathons and learning**