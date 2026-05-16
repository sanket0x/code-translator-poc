# 🔄 Code Translator POC

A web application that translates GitHub PR code changes into business context and automatically adds them as comments to related Jira tasks.

## 🎯 Features

- **Jira-style Task Board**: Kanban board with drag-and-drop functionality (ToDo, In Progress, Done)
- **Monaco Code Editor**: Professional code editor with syntax highlighting (same as VS Code)
- **AI-Powered Translation**: Uses Google Gemini to convert code changes into plain English explanations
- **Automatic Task Linking**: Matches PR titles to tasks and adds comments automatically
- **No Backend Required**: Fully client-side with localStorage persistence

## 🚀 Quick Start

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, or Edge)
- Google Gemini API key (FREE - for AI integration)

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
   - Edit code in the Monaco editor (same as VS Code)
   - Full syntax highlighting and IntelliSense
   - Line numbers and bracket matching included

3. **Create a PR**
   - Enter a PR title with task number format: `task-X: Description`
   - Example: `task-1: Add user authentication`
   - Click "Create PR"
   - The system will:
     - Extract the task number from your PR title
     - Validate that the task exists
     - Send your code to Google Gemini for analysis
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
3. Write your code in the Monaco editor:

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

## 🔑 API Key Setup (Required for AI Integration)

**Using Google Gemini (FREE - Default):**
1. Get your FREE API key from https://aistudio.google.com/app/apikey
2. Click on the API key input in the header
3. Enter your Google AI API key
4. Click the blue "Save" button
5. The key is stored securely in your browser's localStorage
6. You'll see a "✓ Saved" confirmation

**Note**: Your API key is stored locally in your browser and never sent anywhere except directly to Google's Gemini API.

## 🏗️ Project Structure

```
code-translator-poc/
├── index.html              # Main HTML structure
├── styles.css              # All styling (clean, modern design)
├── config.js               # Configuration (AI provider selection)
├── app.js                  # Main application logic & Monaco Editor
├── taskManager.js          # Task CRUD operations
├── prProcessor.js          # PR processing & AI integration
├── README.md               # This file
├── IMPLEMENTATION_PLAN.md  # Detailed implementation roadmap
└── DESIGN_MOCKUP.md        # Visual design specifications
```

## 🔧 Technology Stack

- **Frontend**: Vanilla JavaScript (no frameworks)
- **Styling**: Custom CSS (no UI libraries)
- **Code Editor**: Monaco Editor (same as VS Code)
- **AI Provider**: Google Gemini 1.5 Flash (FREE)
- **Storage**: Browser localStorage
- **Syntax Highlighting**: Built into Monaco Editor

## 🎨 Design Philosophy

- **Clean & Modern**: Minimalist design focused on functionality
- **Intuitive**: Familiar patterns (Kanban board, professional code editor)
- **Responsive**: Works on desktop, tablet, and mobile
- **Professional**: Suitable for presentations and demos

## 🔒 Data Storage

All data is stored locally in your browser using localStorage:
- Tasks and their status
- Code editor content
- API key (stored in browser)
- User preferences

**Note**: Data persists until you clear your browser cache or use a different browser.

## 📄 License

MIT License - feel free to use this project for learning or as a starting point for your own applications.