import { html, css, LitElement } from './lit-core-2.7.4.min.js';

class JulieApp extends LitElement {
    static styles = css`
        * {
            box-sizing: border-box;
            font-family:
                'Inter',
                -apple-system,
                BlinkMacSystemFont,
                sans-serif;
            margin: 0px;
            padding: 0px;
            cursor: default;
        }

        :host {
            display: block;
            width: 100%;
            height: 100vh;
            background-color: var(--background-transparent);
            color: var(--text-color);
        }

        .window-container {
            height: 100vh;
            border-radius: 7px;
            overflow: hidden;
        }

        .container {
            display: flex;
            flex-direction: column;
            height: 100%;
        }

        .header {
            -webkit-app-region: drag;
            display: flex;
            align-items: center;
            padding: 10px 20px;
            border: 1px solid var(--border-color);
            background: var(--header-background);
            border-radius: 7px;
        }

        .header-title {
            flex: 1;
            font-size: 16px;
            font-weight: 600;
            -webkit-app-region: drag;
        }

        .header-actions {
            display: flex;
            gap: 12px;
            align-items: center;
            -webkit-app-region: no-drag;
        }

        .header-actions span {
            font-size: 13px;
            color: var(--header-actions-color);
        }

        .main-content {
            flex: 1;
            padding: 20px;
            overflow-y: auto;
            margin-top: 10px;
            border: 1px solid var(--border-color);
            background: var(--main-content-background);
            border-radius: 7px;
        }

        .button {
            background: var(--button-background);
            color: var(--text-color);
            border: 1px solid var(--button-border);
            padding: 8px 16px;
            border-radius: 8px;
            font-size: 13px;
            font-weight: 500;
        }

        .icon-button {
            background: none;
            color: var(--icon-button-color);
            border: none;
            padding: 8px;
            border-radius: 8px;
            font-size: 13px;
            font-weight: 500;
            display: flex;
        }

        .icon-button:hover {
            background: var(--hover-background);
        }

        .button:hover {
            background: var(--hover-background);
        }

        button:disabled {
            opacity: 0.5;
        }

        input,
        textarea,
        select {
            background: var(--input-background);
            color: var(--text-color);
            border: 1px solid var(--button-border);
            padding: 10px 14px;
            width: 100%;
            border-radius: 8px;
            font-size: 14px;
        }

        input:focus,
        textarea:focus,
        select:focus {
            outline: none;
            border-color: var(--focus-border-color);
            box-shadow: 0 0 0 3px var(--focus-box-shadow);
            background: var(--input-focus-background);
        }

        input::placeholder,
        textarea::placeholder {
            color: var(--placeholder-color);
        }

        .input-group {
            position: relative;
            margin: 20px 0;
            width: 100%;
        }

        .input-group input {
            width: 100%;
            padding: 10px;
            border: 1px solid #ccc;
            border-radius: 4px;
            font-size: 16px;
            margin-bottom: 5px;
        }

        .api-key-validation {
            font-size: 12px;
            margin-top: 5px;
            padding: 5px;
            border-radius: 4px;
        }

        .api-key-validation.valid {
            color: #4CAF50;
            background: rgba(76, 175, 80, 0.1);
        }

        .api-key-validation.invalid {
            color: #f44336;
            background: rgba(244, 67, 54, 0.1);
        }

        .api-key-validation ul {
            margin: 5px 0;
            padding-left: 20px;
        }

        .api-key-validation li {
            margin: 2px 0;
        }

        .api-key-validation li.passed::before {
            content: "✓";
            color: #4CAF50;
            margin-right: 5px;
        }

        .api-key-validation li.failed::before {
            content: "✗";
            color: #f44336;
            margin-right: 5px;
        }

        .response-container {
            height: calc(100% - 60px);
            overflow-y: auto;
            white-space: pre-wrap;
            border-radius: 10px;
            font-size: 20px;
            line-height: 1.6;
        }

        .response-container::-webkit-scrollbar {
            width: 8px;
        }

        .response-container::-webkit-scrollbar-track {
            background: var(--scrollbar-track);
            border-radius: 4px;
        }

        .response-container::-webkit-scrollbar-thumb {
            background: var(--scrollbar-thumb);
            border-radius: 4px;
        }

        .response-container::-webkit-scrollbar-thumb:hover {
            background: var(--scrollbar-thumb-hover);
        }

        textarea {
            height: 120px;
            resize: vertical;
            line-height: 1.5;
        }

        .welcome {
            font-size: 24px;
            margin-bottom: 8px;
            font-weight: 600;
            margin-top: auto;
        }

        @keyframes pulse {
            0% {
                opacity: 1;
            }
            50% {
                opacity: 0.8;
            }
            100% {
                opacity: 1;
            }
        }

        .option-group {
            margin-bottom: 24px;
        }

        .option-label {
            display: block;
            margin-bottom: 8px;
            color: var(--option-label-color);
            font-weight: 500;
            font-size: 14px;
        }

        .option-group .description {
            margin-top: 8px;
            margin-bottom: 0;
            font-size: 13px;
            color: var(--description-color);
        }

        .screen-preview {
            display: flex;
            gap: 12px;
            flex-wrap: wrap;
            margin-top: 12px;
        }

        .screen-option {
            border: 2px solid transparent;
            padding: 8px;
            text-align: center;
            border-radius: 12px;
            background: var(--screen-option-background);
        }

        .screen-option:hover {
            background: var(--screen-option-hover-background);
            border-color: var(--button-border);
        }

        .screen-option.selected {
            border-color: var(--focus-border-color);
            background: var(--screen-option-selected-background);
        }

        .screen-option img {
            width: 150px;
            height: 100px;
            object-fit: contain;
            background: var(--screen-option-background);
            border-radius: 8px;
        }

        .screen-option div {
            font-size: 12px;
            margin-top: 6px;
            color: var(--screen-option-text);
        }

        .selected .screen-option div {
            color: var(--focus-border-color);
            font-weight: 500;
        }

        .description {
            color: var(--description-color);
            font-size: 14px;
            margin-bottom: 24px;
            line-height: 1.5;
        }

        .start-button {
            background: var(--start-button-background);
            color: var(--start-button-color);
            border: 1px solid var(--start-button-border);
        }

        .start-button:hover {
            background: var(--start-button-hover-background);
            border-color: var(--start-button-hover-border);
        }

        .text-input-container {
            display: flex;
            gap: 10px;
            margin-top: 10px;
            align-items: center;
        }

        .text-input-container input {
            flex: 1;
        }

        .text-input-container button {
            background: var(--text-input-button-background);
            color: var(--start-button-background);
            border: none;
        }

        .text-input-container button:hover {
            background: var(--text-input-button-hover);
        }

        .nav-button {
            background: var(--button-background);
            color: var(--text-color);
            border: 1px solid var(--button-border);
            padding: 8px;
            border-radius: 8px;
            font-size: 12px;
            display: flex;
            align-items: center;
            min-width: 32px;
            justify-content: center;
        }

        .nav-button:hover {
            background: var(--hover-background);
        }

        .nav-button:disabled {
            opacity: 0.3;
        }

        .response-counter {
            font-size: 12px;
            color: var(--description-color);
            white-space: nowrap;
            min-width: 60px;
            text-align: center;
        }

        .link {
            color: var(--link-color);
            text-decoration: underline;
        }

        .key {
            background: var(--key-background);
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 12px;
            margin: 0px;
        }

        ::-webkit-scrollbar {
            width: 6px;
            height: 6px;
        }

        ::-webkit-scrollbar-track {
            background: var(--scrollbar-background);
            border-radius: 3px;
        }

        ::-webkit-scrollbar-thumb {
            background: var(--scrollbar-thumb);
            border-radius: 3px;
        }

        ::-webkit-scrollbar-thumb:hover {
            background: var(--scrollbar-thumb-hover);
        }

        .audio-feedback {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 8px;
            background: rgba(0, 0, 0, 0.3);
            border-radius: 6px;
            margin-bottom: 12px;
        }

        .audio-level-meter {
            flex: 1;
            height: 4px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 2px;
            overflow: hidden;
            position: relative;
        }

        .audio-level-bar {
            position: absolute;
            left: 0;
            top: 0;
            height: 100%;
            background: #4CAF50;
            transition: width 0.1s ease-out;
        }

        .audio-status {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 12px;
            color: rgba(255, 255, 255, 0.7);
        }

        .audio-status-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #4CAF50;
            animation: pulse 1.5s infinite;
        }

        .transcription-container {
            background: rgba(0, 0, 0, 0.2);
            border-radius: 6px;
            padding: 12px;
            margin-bottom: 12px;
            font-size: 14px;
            color: rgba(255, 255, 255, 0.9);
            max-height: 100px;
            overflow-y: auto;
        }

        @keyframes pulse {
            0% { opacity: 0.4; }
            50% { opacity: 1; }
            100% { opacity: 0.4; }
        }

        .audio-quality {
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 500;
        }

        .audio-quality.good { background: rgba(76, 175, 80, 0.2); color: #4CAF50; }
        .audio-quality.low { background: rgba(255, 152, 0, 0.2); color: #FFA000; }
        .audio-quality.very-low { background: rgba(244, 67, 54, 0.2); color: #F44336; }
        .audio-quality.high { background: rgba(33, 150, 243, 0.2); color: #2196F3; }

        .permission-request {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: var(--header-background);
            border: 1px solid var(--border-color);
            border-radius: 8px;
            padding: 20px;
            max-width: 400px;
            width: 90%;
            text-align: center;
            z-index: 1000;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }

        .permission-request h3 {
            margin: 0 0 12px 0;
            font-size: 18px;
        }

        .permission-request p {
            margin: 0 0 20px 0;
            font-size: 14px;
            color: var(--description-color);
        }

        .permission-request .buttons {
            display: flex;
            gap: 12px;
            justify-content: center;
        }

        .permission-status {
            margin: 20px;
            padding: 20px;
            border-radius: 8px;
            background: var(--header-background);
            border: 1px solid var(--border-color);
        }
        
        .permission-item {
            display: flex;
            flex-direction: column;
            margin: 15px 0;
            padding: 15px;
            background: var(--main-content-background);
            border-radius: 6px;
            border: 1px solid var(--button-border);
        }
        
        .permission-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 10px;
        }
        
        .permission-name {
            font-weight: 600;
            font-size: 14px;
        }
        
        .permission-details {
            font-size: 13px;
            color: var(--description-color);
            margin: 5px 0;
        }
        
        .status-indicator {
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 500;
        }
        
        .status-granted {
            background: rgba(76, 175, 80, 0.1);
            color: #4CAF50;
        }
        
        .status-denied {
            background: rgba(244, 67, 54, 0.1);
            color: #F44336;
        }
        
        .status-pending {
            background: rgba(255, 152, 0, 0.1);
            color: #FFA000;
        }
        
        .permission-actions {
            display: flex;
            gap: 10px;
            margin-top: 10px;
        }
        
        .permission-button {
            padding: 6px 12px;
            border-radius: 4px;
            font-size: 12px;
            cursor: pointer;
            border: none;
            background: var(--button-background);
            color: var(--text-color);
        }
        
        .permission-button:hover {
            background: var(--hover-background);
        }
        
        .permission-error {
            margin-top: 8px;
            padding: 8px;
            border-radius: 4px;
            background: rgba(244, 67, 54, 0.1);
            color: #F44336;
            font-size: 12px;
        }

        .audio-status-container {
            background: rgba(0, 0, 0, 0.2);
            padding: 12px;
            border-radius: 8px;
            margin-bottom: 12px;
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .status-indicator {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: #666;
            animation: pulse 2s infinite;
        }
        
        .status-text {
            flex: 1;
        }

        .audio-level {
            width: 100px;
            height: 4px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 2px;
            overflow: hidden;
        }

        .audio-level-bar {
            width: 0%;
            height: 100%;
            background: #666;
            transition: width 0.1s ease-out;
        }
    `;

    static properties = {
        currentView: { type: String },
        statusText: { type: String },
        startTime: { type: Number },
        isRecording: { type: Boolean },
        sessionActive: { type: Boolean },
        selectedProfile: { type: String },
        selectedLanguage: { type: String },
        responses: { type: Array },
        currentResponseIndex: { type: Number },
        audioLevel: { type: Number },
        audioQuality: { type: String },
        isListening: { type: Boolean },
        transcription: { type: String },
        permissionStatus: { type: Object },
        permissionErrors: { type: Object },
        apiKeyValidation: { type: Object },
        audioStatus: { type: Object },
    };

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.currentView = 'main';
        this.statusText = '';
        this.startTime = null;
        this.isRecording = false;
        this.sessionActive = false;
        this.selectedProfile = localStorage.getItem('selectedProfile') || 'interview';
        this.selectedLanguage = localStorage.getItem('selectedLanguage') || 'en-US';
        this.responses = [];
        this.currentResponseIndex = -1;
        this.audioLevel = 0;
        this.audioQuality = 'good';
        this.isListening = false;
        this.transcription = '';
        this.permissionStatus = {
            screen: { status: 'pending', authorized: false, appName: '' },
            microphone: { status: 'pending', authorized: false, appName: '' }
        };
        this.permissionErrors = {
            screen: null,
            microphone: null
        };
        this.apiKeyValidation = {
            length: false,
            format: false,
            spaces: true,
            newlines: true
        };
        this.audioStatus = {
            active: false,
            bytesReceived: 0,
            error: null
        };
    }

    async handleWindowClose() {
        const { ipcRenderer } = window.require('electron');
        await ipcRenderer.invoke('window-close');
    }

    connectedCallback() {
        super.connectedCallback();
    }

    setStatus(t) {
        this.statusText = t;
    }

    setResponse(r) {
        this.responses.push(r);

        // If user is viewing the latest response (or no responses yet), auto-navigate to new response
        if (this.currentResponseIndex === this.responses.length - 2 || this.currentResponseIndex === -1) {
            this.currentResponseIndex = this.responses.length - 1;
        }

        this.requestUpdate();
    }

    disconnectedCallback() {
        super.disconnectedCallback();

        const { ipcRenderer } = window.require('electron');
        ipcRenderer.removeAllListeners('update-response');
        ipcRenderer.removeAllListeners('update-status');
    }

    handleInput(e, property) {
        const value = e.target.value;
        localStorage.setItem(property, value);
        
        if (property === 'apiKey') {
            this.apiKeyValidation = this.validateApiKey(value);
            console.log('API Key Input:', {
                rawLength: value.length,
                trimmedLength: value.trim().length,
                firstChars: value.substring(0, 10) + '...',
                containsSpaces: value.includes(' '),
                containsNewlines: value.includes('\n')
            });
        }
        
        this.requestUpdate();
    }

    handleProfileSelect(e) {
        this.selectedProfile = e.target.value;
        localStorage.setItem('selectedProfile', this.selectedProfile);
    }

    handleLanguageSelect(e) {
        this.selectedLanguage = e.target.value;
        localStorage.setItem('selectedLanguage', this.selectedLanguage);
    }

    async handleStart() {
        // Show permission status before starting
        this.currentView = 'permissions';
        
        // Initialize Gemini first
        const success = await julie.initializeGemini(this.selectedProfile, this.selectedLanguage);
        if (!success) {
            return;
        }

        // Start capture (this will trigger permission requests)
        const captureSuccess = await julie.startCapture();
        if (captureSuccess) {
            this.responses = [];
            this.currentResponseIndex = -1;
            this.currentView = 'assistant';
        }
    }

    async handleClose() {
        if (this.currentView === 'customize' || this.currentView === 'help') {
            this.currentView = 'main';
        } else if (this.currentView === 'assistant') {
            julie.stopCapture();

            // Close the session
            const { ipcRenderer } = window.require('electron');
            await ipcRenderer.invoke('close-session');
            this.sessionActive = false;
            this.currentView = 'main';
            console.log('Session closed');
        } else {
            // Quit the entire application
            const { ipcRenderer } = window.require('electron');
            await ipcRenderer.invoke('quit-application');
        }
    }

    async openHelp() {
        this.currentView = 'help';
    }

    async openAPIKeyHelp() {
        const { ipcRenderer } = window.require('electron');
        await ipcRenderer.invoke('open-external', 'https://julie.app/help/api-key');
    }

    async openExternalLink(url) {
        const { ipcRenderer } = window.require('electron');
        await ipcRenderer.invoke('open-external', url);
    }

    scrollToBottom() {
        setTimeout(() => {
            const container = this.shadowRoot.querySelector('.response-container');
            if (container) {
                container.scrollTop = container.scrollHeight;
            }
        }, 0);
    }

    updated(changedProperties) {
        super.updated(changedProperties);
        if (changedProperties.has('currentView')) {
            this.scrollToBottom();
        }

        // Notify main process of view change
        if (changedProperties.has('currentView')) {
            const { ipcRenderer } = window.require('electron');
            ipcRenderer.send('view-changed', this.currentView);
        }
    }

    async handleSendText() {
        const textInput = this.shadowRoot.querySelector('#textInput');
        if (textInput && textInput.value.trim()) {
            const message = textInput.value.trim();
            textInput.value = ''; // Clear input

            // Send the message
            const result = await julie.sendTextMessage(message);

            if (!result.success) {
                // Show error - could add to response area or status
                console.error('Failed to send message:', result.error);
                this.setStatus('Error sending message: ' + result.error);
            } else {
                this.setStatus('Message sent...');
            }
        }
    }

    handleTextKeydown(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            this.handleSendText();
        }
    }

    renderHeader() {
        const titles = {
            main: 'Julie',
            customize: 'Customize',
            help: 'Help & Shortcuts',
            assistant: 'Julie',
        };

        let elapsedTime = '';
        if (this.currentView === 'assistant' && this.startTime) {
            const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
            elapsedTime = `${elapsed}s`;
        }

        return html`
            <div class="header">
                <div class="header-title">${titles[this.currentView]}</div>
                <div class="header-actions">
                    ${this.currentView === 'assistant'
                        ? html`
                              <span>${elapsedTime}</span>
                              <span>${this.statusText}</span>
                          `
                        : ''}
                    ${this.currentView === 'main'
                        ? html`
                              <button class="icon-button" @click=${() => (this.currentView = 'customize')}>
                                  <?xml version="1.0" encoding="UTF-8"?><svg
                                      width="24px"
                                      height="24px"
                                      stroke-width="1.7"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      xmlns="http://www.w3.org/2000/svg"
                                      color="currentColor"
                                  >
                                      <path
                                          d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z"
                                          stroke="currentColor"
                                          stroke-width="1.7"
                                          stroke-linecap="round"
                                          stroke-linejoin="round"
                                      ></path>
                                      <path
                                          d="M19.6224 10.3954L18.5247 7.7448L20 6L18 4L16.2647 5.48295L13.5578 4.36974L12.9353 2H10.981L10.3491 4.40113L7.70441 5.51596L6 4L4 6L5.45337 7.78885L4.3725 10.4463L2 11V13L4.40111 13.6555L5.51575 16.2997L4 18L6 20L7.79116 18.5403L10.397 19.6123L11 22H13L13.6045 19.6132L16.2551 18.5155C16.6969 18.8313 18 20 18 20L20 18L18.5159 16.2494L19.6139 13.598L21.9999 12.9772L22 11L19.6224 10.3954Z"
                                          stroke="currentColor"
                                          stroke-width="1.7"
                                          stroke-linecap="round"
                                          stroke-linejoin="round"
                                      ></path>
                                  </svg>
                              </button>
                              <button class="icon-button" @click=${this.openHelp}>
                                  <?xml version="1.0" encoding="UTF-8"?><svg
                                      width="24px"
                                      height="24px"
                                      stroke-width="1.7"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      xmlns="http://www.w3.org/2000/svg"
                                      color="currentColor"
                                  >
                                      <path
                                          d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                                          stroke="currentColor"
                                          stroke-width="1.7"
                                          stroke-linecap="round"
                                          stroke-linejoin="round"
                                      ></path>
                                      <path
                                          d="M9 9C9 5.49997 14.5 5.5 14.5 9C14.5 11.5 12 10.9999 12 13.9999"
                                          stroke="currentColor"
                                          stroke-width="1.7"
                                          stroke-linecap="round"
                                          stroke-linejoin="round"
                                      ></path>
                                      <path
                                          d="M12 18.01L12.01 17.9989"
                                          stroke="currentColor"
                                          stroke-width="1.7"
                                          stroke-linecap="round"
                                          stroke-linejoin="round"
                                      ></path>
                                  </svg>
                              </button>
                          `
                        : ''}
                    ${this.currentView === 'assistant'
                        ? html`
                              <button @click=${this.handleClose} class="button window-close">
                                  Back&nbsp;&nbsp;<span class="key" style="pointer-events: none;">${julie.isMacOS ? 'Cmd' : 'Ctrl'}</span>&nbsp;&nbsp;<span class="key"
                                      >&bsol;</span
                                  >
                              </button>
                          `
                        : html`
                              <button @click=${this.handleClose} class="icon-button window-close">
                                  <?xml version="1.0" encoding="UTF-8"?><svg
                                      width="24px"
                                      height="24px"
                                      stroke-width="1.7"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      xmlns="http://www.w3.org/2000/svg"
                                      color="currentColor"
                                  >
                                      <path
                                          d="M6.75827 17.2426L12.0009 12M17.2435 6.75736L12.0009 12M12.0009 12L6.75827 6.75736M12.0009 12L17.2435 17.2426"
                                          stroke="currentColor"
                                          stroke-width="1.7"
                                          stroke-linecap="round"
                                          stroke-linejoin="round"
                                      ></path>
                                  </svg>
                              </button>
                          `}
                </div>
            </div>
        `;
    }

    renderApiKeyValidation() {
        const { length, format, spaces, newlines } = this.apiKeyValidation;
        const isValid = length && format && spaces && newlines;
        
        return html`
            <div class="api-key-validation ${isValid ? 'valid' : 'invalid'}">
                <strong>${isValid ? 'Valid API Key Format' : 'Invalid API Key Format'}</strong>
                <ul>
                    <li class="${format ? 'passed' : 'failed'}">
                        Starts with "AIza"
                    </li>
                    <li class="${length ? 'passed' : 'failed'}">
                        Sufficient length
                    </li>
                    <li class="${spaces ? 'passed' : 'failed'}">
                        No spaces
                    </li>
                    <li class="${newlines ? 'passed' : 'failed'}">
                        No line breaks
                    </li>
                </ul>
                ${!isValid ? html`
                    <small>
                        Please make sure you're copying just the API key from
                        <a href="https://aistudio.google.com/apikey" target="_blank">Google AI Studio</a>.
                        The key should start with "AIza" and not contain any spaces.
                    </small>
                ` : ''}
            </div>
        `;
    }

    renderMainView() {
        return html`
            <div style="height: 100%; display: flex; flex-direction: column; width: 100%; max-width: 500px;">
                <div class="welcome">Welcome</div>

                <div class="input-group">
                    <input
                        type="password"
                        placeholder="Enter your Gemini API Key"
                        .value=${localStorage.getItem('apiKey') || ''}
                        @input=${e => this.handleInput(e, 'apiKey')}
                    />
                    ${this.renderApiKeyValidation()}
                    <button 
                        @click=${this.handleStart} 
                        class="button start-button"
                        ?disabled=${!Object.values(this.apiKeyValidation).every(v => v)}
                    >
                        Start Session
                    </button>
                </div>
                <p class="description">
                    dont have an api key?
                    <span @click=${this.openAPIKeyHelp} class="link">get one here</span>
                </p>
            </div>
        `;
    }

    renderCustomizeView() {
        const profiles = [
            {
                value: 'interview',
                name: 'Job Interview',
                description: 'Get help with answering interview questions',
            },
            {
                value: 'sales',
                name: 'Sales Call',
                description: 'Assist with sales conversations and objection handling',
            },
            {
                value: 'meeting',
                name: 'Business Meeting',
                description: 'Support for professional meetings and discussions',
            },
            {
                value: 'presentation',
                name: 'Presentation',
                description: 'Help with presentations and public speaking',
            },
            {
                value: 'negotiation',
                name: 'Negotiation',
                description: 'Guidance for business negotiations and deals',
            },
        ];

        const languages = [
            { value: 'en-US', name: 'English (US)' },
            { value: 'en-GB', name: 'English (UK)' },
            { value: 'en-AU', name: 'English (Australia)' },
            { value: 'en-IN', name: 'English (India)' },
            { value: 'de-DE', name: 'German (Germany)' },
            { value: 'es-US', name: 'Spanish (United States)' },
            { value: 'es-ES', name: 'Spanish (Spain)' },
            { value: 'fr-FR', name: 'French (France)' },
            { value: 'fr-CA', name: 'French (Canada)' },
            { value: 'hi-IN', name: 'Hindi (India)' },
            { value: 'pt-BR', name: 'Portuguese (Brazil)' },
            { value: 'ar-XA', name: 'Arabic (Generic)' },
            { value: 'id-ID', name: 'Indonesian (Indonesia)' },
            { value: 'it-IT', name: 'Italian (Italy)' },
            { value: 'ja-JP', name: 'Japanese (Japan)' },
            { value: 'tr-TR', name: 'Turkish (Turkey)' },
            { value: 'vi-VN', name: 'Vietnamese (Vietnam)' },
            { value: 'bn-IN', name: 'Bengali (India)' },
            { value: 'gu-IN', name: 'Gujarati (India)' },
            { value: 'kn-IN', name: 'Kannada (India)' },
            { value: 'ml-IN', name: 'Malayalam (India)' },
            { value: 'mr-IN', name: 'Marathi (India)' },
            { value: 'ta-IN', name: 'Tamil (India)' },
            { value: 'te-IN', name: 'Telugu (India)' },
            { value: 'nl-NL', name: 'Dutch (Netherlands)' },
            { value: 'ko-KR', name: 'Korean (South Korea)' },
            { value: 'cmn-CN', name: 'Mandarin Chinese (China)' },
            { value: 'pl-PL', name: 'Polish (Poland)' },
            { value: 'ru-RU', name: 'Russian (Russia)' },
            { value: 'th-TH', name: 'Thai (Thailand)' },
        ];

        const profileNames = {
            interview: 'Job Interview',
            sales: 'Sales Call',
            meeting: 'Business Meeting',
            presentation: 'Presentation',
            negotiation: 'Negotiation',
        };

        return html`
            <div>
                <div class="option-group">
                    <label class="option-label">Select Profile</label>
                    <select .value=${this.selectedProfile} @change=${this.handleProfileSelect}>
                        ${profiles.map(
                            profile => html`
                                <option value=${profile.value} ?selected=${this.selectedProfile === profile.value}>${profile.name}</option>
                            `
                        )}
                    </select>
                    <div class="description">${profiles.find(p => p.value === this.selectedProfile)?.description || ''}</div>
                </div>

                <div class="option-group">
                    <label class="option-label">Select Language</label>
                    <select .value=${this.selectedLanguage} @change=${this.handleLanguageSelect}>
                        ${languages.map(
                            language => html`
                                <option value=${language.value} ?selected=${this.selectedLanguage === language.value}>${language.name}</option>
                            `
                        )}
                    </select>
                    <div class="description">Choose the language for speech recognition and AI responses.</div>
                </div>

                <div class="option-group">
                    <span class="option-label">AI Behavior for ${profileNames[this.selectedProfile] || 'Selected Profile'}</span>
                    <textarea
                        placeholder="Describe how you want the AI to behave..."
                        .value=${localStorage.getItem('customPrompt') || ''}
                        class="custom-prompt-textarea"
                        rows="4"
                        @input=${e => this.handleInput(e, 'customPrompt')}
                    ></textarea>
                    <div class="description">
                        This custom prompt will be added to the ${profileNames[this.selectedProfile] || 'selected profile'} instructions to
                        personalize the AI's behavior.
                    </div>
                </div>
            </div>
        `;
    }

    renderHelpView() {
        return html`
            <div>
                <div class="option-group">
                    <span class="option-label">Community & Support</span>
                    <div class="description">
                        <span @click=${() => this.openExternalLink('https://github.com/sohzm/julie')} class="link">📂 GitHub Repository</span
                        ><br />
                        <span @click=${() => this.openExternalLink('https://discord.gg/GCBdubnXfJ')} class="link">💬 Join Discord Community</span>
                    </div>
                </div>

                <div class="option-group">
                    <span class="option-label">Keyboard Shortcuts</span>
                    <div class="description">
                        <strong>Window Movement:</strong><br />
                        <span class="key">${julie.isMacOS ? 'Option' : 'Ctrl'}</span> + Arrow Keys - Move the window in 45px increments<br /><br />

                        <strong>Window Control:</strong><br />
                        <span class="key">${julie.isMacOS ? 'Cmd' : 'Ctrl'}</span> + <span class="key">M</span> - Toggle mouse events (click-through
                        mode)<br />
                        <span class="key">${julie.isMacOS ? 'Cmd' : 'Ctrl'}</span> + <span class="key">&bsol;</span> - Close window or go back<br /><br />

                        <strong>Text Input:</strong><br />
                        <span class="key">Enter</span> - Send text message to AI<br />
                        <span class="key">Shift</span> + <span class="key">Enter</span> - New line in text input
                    </div>
                </div>

                <div class="option-group">
                    <span class="option-label">How to Use</span>
                    <div class="description">
                        1. <strong>Start a Session:</strong> Enter your Gemini API key and click "Start Session"<br />
                        2. <strong>Customize:</strong> Choose your profile and language in the settings<br />
                        3. <strong>Position Window:</strong> Use keyboard shortcuts to move the window to your desired location<br />
                        4. <strong>Click-through Mode:</strong> Use <span class="key">${julie.isMacOS ? 'Cmd' : 'Ctrl'}</span> +
                        <span class="key">M</span> to make the window click-through<br />
                        5. <strong>Get AI Help:</strong> The AI will analyze your screen and audio to provide assistance<br />
                        6. <strong>Text Messages:</strong> Type questions or requests to the AI using the text input
                    </div>
                </div>

                <div class="option-group">
                    <span class="option-label">Supported Profiles</span>
                    <div class="description">
                        <strong>Job Interview:</strong> Get help with interview questions and responses<br />
                        <strong>Sales Call:</strong> Assistance with sales conversations and objection handling<br />
                        <strong>Business Meeting:</strong> Support for professional meetings and discussions<br />
                        <strong>Presentation:</strong> Help with presentations and public speaking<br />
                        <strong>Negotiation:</strong> Guidance for business negotiations and deals
                    </div>
                </div>

                <div class="option-group">
                    <span class="option-label">Audio Input</span>
                    <div class="description">
                        ${julie.isMacOS 
                            ? html`<strong>macOS:</strong> Uses SystemAudioDump for system audio capture`
                            : julie.isLinux
                              ? html`<strong>Linux:</strong> Uses microphone input`
                              : html`<strong>Windows:</strong> Uses loopback audio capture`}<br />
                        The AI listens to conversations and provides contextual assistance based on what it hears.
                    </div>
                </div>
            </div>
        `;
    }

    renderAudioStatus() {
        const getStatusColor = () => {
            if (!this.audioStatus.active) return '#666';
            if (this.audioStatus.error) return '#f44336';
            if (this.audioLevel > 0) return '#4CAF50';
            return '#FFA000';
        };

        return html`
            <div class="audio-status-container" style="
                background: rgba(0, 0, 0, 0.2);
                padding: 12px;
                border-radius: 8px;
                margin-bottom: 12px;
                display: flex;
                align-items: center;
                gap: 12px;
            ">
                <div class="status-indicator" style="
                    width: 12px;
                    height: 12px;
                    border-radius: 50%;
                    background: ${getStatusColor()};
                    ${this.audioStatus.active ? 'animation: pulse 2s infinite;' : ''}
                "></div>
                
                <div class="status-text" style="flex: 1;">
                    ${this.audioStatus.active 
                        ? html`Recording ${this.audioLevel > 0 ? '(Audio Detected)' : '(Waiting for Audio)'}` 
                        : 'Audio Inactive'}
                    ${this.audioStatus.error ? html`<div style="color: #f44336; font-size: 12px;">${this.audioStatus.error}</div>` : ''}
                </div>

                <div class="audio-level" style="
                    width: 100px;
                    height: 4px;
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 2px;
                    overflow: hidden;
                ">
                    <div style="
                        width: ${this.audioLevel}%;
                        height: 100%;
                        background: ${getStatusColor()};
                        transition: width 0.1s ease-out;
                    "></div>
                </div>
            </div>
        `;
    }

    renderAudioFeedback() {
        return html`
            <div class="audio-feedback">
                <div class="audio-status">
                    ${this.isListening ? html`
                        <div class="audio-status-dot"></div>
                        <span>Listening</span>
                    ` : html`
                        <span>Audio Ready</span>
                    `}
                </div>
                <div class="audio-level-meter">
                    <div class="audio-level-bar" style="width: ${this.audioLevel}%"></div>
                </div>
                <div class="audio-quality ${this.audioQuality}">
                    ${this.audioQuality.replace('-', ' ')}
                </div>
            </div>
            ${this.transcription ? html`
                <div class="transcription-container">
                    ${this.transcription}
                </div>
            ` : ''}
        `;
    }

    renderAssistantView() {
        return html`
            <div class="assistant-view">
                ${this.renderAudioStatus()}
                ${this.renderAudioFeedback()}
                <div class="response-container">
                    ${this.responses.length > 0 && this.currentResponseIndex >= 0
                        ? this.responses[this.currentResponseIndex]
                        : `Hey, I'm listening to your ${this.getProfileName(this.selectedProfile)}!`}
                </div>
                <div class="text-input-container">
                    <button
                        class="nav-button"
                        @click=${this.navigateToPreviousResponse}
                        ?disabled=${this.currentResponseIndex <= 0}
                        title="Previous response"
                    >←</button>

                    ${this.responses.length > 0 ? html`
                        <span class="response-counter">
                            ${this.currentResponseIndex + 1}/${this.responses.length}
                        </span>
                    ` : ''}

                    <input 
                        type="text" 
                        id="textInput" 
                        placeholder="Type a message to the AI..." 
                        @keydown=${this.handleTextKeydown}
                    />

                    <button
                        class="nav-button"
                        @click=${this.navigateToNextResponse}
                        ?disabled=${this.currentResponseIndex >= this.responses.length - 1}
                        title="Next response"
                    >→</button>
                </div>
            </div>
        `;
    }

    navigateToPreviousResponse() {
        if (this.currentResponseIndex > 0) {
            this.currentResponseIndex--;
        }
    }

    navigateToNextResponse() {
        if (this.currentResponseIndex < this.responses.length - 1) {
            this.currentResponseIndex++;
        }
    }

    updateAudioMetrics(metrics) {
        this.audioLevel = parseFloat(metrics.audioLevel);
        this.audioQuality = metrics.quality;
        this.requestUpdate();
    }

    updateTranscription(text) {
        this.transcription = text;
        this.requestUpdate();
    }

    setListeningState(isListening) {
        this.isListening = isListening;
        this.requestUpdate();
    }

    updatePermissionStatus(type, status) {
        this.permissionStatus = {
            ...this.permissionStatus,
            [type]: status
        };
        this.requestUpdate();
    }

    renderPermissionStatus() {
        return html`
            <div class="permission-status">
                <h3>System Permissions</h3>
                
                <div class="permission-item">
                    <div class="permission-header">
                        <span class="permission-name">Screen Recording</span>
                        <span class="status-indicator status-${this.permissionStatus.screen.authorized ? 'granted' : 
                            this.permissionStatus.screen.status === 'denied' ? 'denied' : 'pending'}">
                            ${this.permissionStatus.screen.authorized ? 'Authorized' : 
                              this.permissionStatus.screen.status === 'denied' ? 'Denied' : 
                              this.permissionStatus.screen.status === 'restricted' ? 'Restricted' :
                              'Not Authorized'}
                        </span>
                    </div>
                    <div class="permission-details">
                        Current Status: ${this.permissionStatus.screen.status}<br>
                        ${this.permissionStatus.screen.error ? 
                            html`<div class="permission-error">Error: ${this.permissionStatus.screen.error}</div>` : ''}
                    </div>
                    <div class="permission-actions">
                        <button class="permission-button" @click=${() => this.openPermissionSettings('screen')}>
                            Open Settings
                        </button>
                    </div>
                </div>

                <div class="permission-item">
                    <div class="permission-header">
                        <span class="permission-name">Microphone</span>
                        <span class="status-indicator status-${this.permissionStatus.microphone.authorized ? 'granted' : 
                            this.permissionStatus.microphone.status === 'denied' ? 'denied' : 'pending'}">
                            ${this.permissionStatus.microphone.authorized ? 'Authorized' : 
                              this.permissionStatus.microphone.status === 'denied' ? 'Denied' : 
                              this.permissionStatus.microphone.status === 'restricted' ? 'Restricted' :
                              'Not Authorized'}
                        </span>
                    </div>
                    <div class="permission-details">
                        Current Status: ${this.permissionStatus.microphone.status}<br>
                        ${this.permissionStatus.microphone.error ? 
                            html`<div class="permission-error">Error: ${this.permissionStatus.microphone.error}</div>` : ''}
                    </div>
                    <div class="permission-actions">
                        <button class="permission-button" @click=${() => this.openPermissionSettings('microphone')}>
                            Open Settings
                        </button>
                    </div>
                </div>

                <div style="margin-top: 20px; text-align: center;">
                    <button 
                        class="button start-button" 
                        @click=${this.checkPermissionsStatus}
                    >
                        ${this.permissionStatus.screen.authorized && this.permissionStatus.microphone.authorized
                            ? 'Continue'
                            : 'Check Permissions'}
                    </button>
                    ${(!this.permissionStatus.screen.authorized || !this.permissionStatus.microphone.authorized) ? 
                        html`<p class="permission-details" style="margin-top: 10px;">
                            Keep Julie running while granting permissions, then click "Check Permissions"
                        </p>` : ''}
                </div>
            </div>
        `;
    }

    async openPermissionSettings(type) {
        const { ipcRenderer } = window.require('electron');
        if (type === 'screen') {
            await ipcRenderer.invoke('open-external', 'x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture');
        } else if (type === 'microphone') {
            await ipcRenderer.invoke('open-external', 'x-apple.systempreferences:com.apple.preference.security?Privacy_Microphone');
        }
    }

    async checkPermissionsStatus() {
        try {
            const permissions = await window.checkPermissions();
            this.permissionStatus = permissions;
            this.permissionErrors = { screen: null, microphone: null };

            // If both permissions are granted, proceed to start capture
            if (permissions.screen.authorized && permissions.microphone.authorized) {
                console.log('All permissions granted, starting capture...');
                this.currentView = 'assistant';
                const success = await julie.initializeGemini(this.selectedProfile, this.selectedLanguage);
                if (success) {
                    await julie.startCapture();
                }
            } else {
                console.log('Permissions not fully granted:', permissions);
            }
        } catch (error) {
            console.error('Error checking permissions:', error);
            this.permissionErrors = {
                screen: error.message,
                microphone: error.message
            };
        }
        this.requestUpdate();
    }

    renderPermissionsView() {
        return html`
            <div style="height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                <h3>Requesting Permissions</h3>
                <p>Please grant the following permissions to enable all features:</p>
                ${this.renderPermissionStatus()}
                <button 
                    class="button start-button" 
                    @click=${this.handleStart}
                    ?disabled=${Object.values(this.permissionStatus).some(status => status === 'denied')}
                >
                    Continue
                </button>
            </div>
        `;
    }

    validateApiKey(key) {
        const cleanKey = key?.trim() || '';
        return {
            length: cleanKey.length >= 30,
            format: cleanKey.startsWith('AIza'),
            spaces: !cleanKey.includes(' '),
            newlines: !cleanKey.includes('\n')
        };
    }

    getProfileName(profile) {
        const profiles = {
            interview: 'Job Interview',
            sales: 'Sales Call',
            meeting: 'Business Meeting',
            presentation: 'Presentation',
            negotiation: 'Negotiation'
        };
        return profiles[profile] || profile;
    }

    render() {
        const views = {
            main: this.renderMainView(),
            customize: this.renderCustomizeView(),
            help: this.renderHelpView(),
            assistant: this.renderAssistantView(),
            permissions: this.renderPermissionsView(),
        };

        return html`
            <div class="window-container">
                <div class="container">
                    ${this.renderHeader()}
                    <div class="main-content">${views[this.currentView]}</div>
                </div>
            </div>
        `;
    }

    updateAudioStatus(status) {
        this.audioStatus = status;
        this.requestUpdate();
    }
}

customElements.define('julie-app', JulieApp);
