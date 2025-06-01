require('@electron/remote/main').initialize();

if (require('electron-squirrel-startup')) {
    process.exit(0);
}

const { app, BrowserWindow, desktopCapturer, globalShortcut, session, ipcMain, shell, screen, dialog, systemPreferences } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const os = require('os');
const { spawn } = require('child_process');
const { pcmToWav, analyzeAudioBuffer, saveDebugAudio } = require('./audioUtils');
const { getSystemPrompt } = require('./prompts');
const logger = require('./logger');
const { calculateAudioLevel, AUDIO_THRESHOLDS } = require('./audioUtils');
const sessionManager = require('./sessionManager');

let loopbackProc = null;
let systemAudioProc = null;
let audioIntervalTimer = null;
let mouseEventsIgnored = false;
let messageBuffer = '';
let audioContext = null;
let audioProcessor = null;

async function checkPermissionStatus() {
    if (process.platform !== 'darwin') {
        return { 
            screen: { status: 'not_required', authorized: true },
            microphone: { status: 'not_required', authorized: true }
        };
    }

    try {
        // Get current permission status
        const screenStatus = systemPreferences.getMediaAccessStatus('screen');
        const micStatus = systemPreferences.getMediaAccessStatus('microphone');
        
        // Get app name
        const appName = app.getName();
        
        // Check if permissions are actually granted
        const isScreenAuthorized = screenStatus === 'granted';
        const isMicAuthorized = micStatus === 'granted';

        // If not authorized, try requesting microphone permission
        if (!isMicAuthorized) {
            try {
                const micGranted = await systemPreferences.askForMediaAccess('microphone');
                if (micGranted) {
                    return await checkPermissionStatus(); // Recursive call to get updated status
                }
            } catch (error) {
                console.error('Error requesting microphone permission:', error);
            }
        }

        return {
            screen: {
                status: screenStatus,
                authorized: isScreenAuthorized,
                appName: appName
            },
            microphone: {
                status: micStatus,
                authorized: isMicAuthorized,
                appName: appName
            }
        };
    } catch (error) {
        console.error('Error checking permissions:', error);
        return {
            screen: {
                status: 'error',
                authorized: false,
                appName: app.getName(),
                error: error.message
            },
            microphone: {
                status: 'error',
                authorized: false,
                appName: app.getName(),
                error: error.message
            }
        };
    }
}

async function requestMacOSPermissions() {
    if (process.platform !== 'darwin') return true;

    const permissions = await checkPermissionStatus();
    
    // Check screen recording permission
    if (!permissions.screen.authorized) {
        const response = await dialog.showMessageBox({
            type: 'info',
            title: 'Screen Recording Permission Required',
            message: 'Julie needs screen recording permission.',
            detail: `Current Status: ${permissions.screen.status}\n\n` +
                   'Please follow these steps:\n\n' +
                   '1. Keep Julie running\n' +
                   '2. Open System Settings > Privacy & Security > Screen Recording\n' +
                   '3. Find and enable "Julie"\n' +
                   '4. Return here and click "Check Again"',
            buttons: ['Open Settings', 'Check Again', 'Cancel'],
            defaultId: 0
        });

        if (response.response === 0) {
            shell.openExternal('x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture');
            return false;
        } else if (response.response === 1) {
            // Recursive call to check again
            return await requestMacOSPermissions();
        }
        return false;
    }

    // Check microphone permission
    if (!permissions.microphone.authorized) {
        try {
            const micAccess = await systemPreferences.askForMediaAccess('microphone');
            if (!micAccess) {
                const response = await dialog.showMessageBox({
                    type: 'info',
                    title: 'Microphone Permission Required',
                    message: 'Julie needs microphone access.',
                    detail: `Current Status: ${permissions.microphone.status}\n\n` +
                           'Please follow these steps:\n\n' +
                           '1. Keep Julie running\n' +
                           '2. Open System Settings > Privacy & Security > Microphone\n' +
                           '3. Find and enable "Julie"\n' +
                           '4. Return here and click "Check Again"',
                    buttons: ['Open Settings', 'Check Again', 'Cancel'],
                    defaultId: 0
                });

                if (response.response === 0) {
                    shell.openExternal('x-apple.systempreferences:com.apple.preference.security?Privacy_Microphone');
                    return false;
                } else if (response.response === 1) {
                    // Recursive call to check again
                    return await requestMacOSPermissions();
                }
                return false;
            }
        } catch (error) {
            console.error('Microphone permission error:', error);
            dialog.showErrorBox(
                'Permission Error',
                `Failed to request microphone permission.\n\nError: ${error.message}\n\nPlease check System Settings > Privacy & Security > Microphone and ensure Julie is enabled.`
            );
            return false;
        }
    }

    return true;
}

async function checkRequirements() {
    const requirements = {
        systemAudio: false,
        screenCapture: false,
        permissions: false
    };

    // Request permissions first
    requirements.permissions = await requestMacOSPermissions();
    if (!requirements.permissions) {
        return false;
    }

    // Check SystemAudioDump on macOS
    if (process.platform === 'darwin') {
        const systemAudioPath = path.join(__dirname, 'SystemAudioDump');
        if (!fs.existsSync(systemAudioPath)) {
            dialog.showErrorBox(
                'Missing SystemAudioDump',
                'SystemAudioDump is required for audio capture on macOS. Please ensure it exists in the src directory.'
            );
            return false;
        }
        
        // Make it executable and verify permissions
        try {
            // Ensure proper permissions
            await fs.promises.chmod(systemAudioPath, '755');
            requirements.systemAudio = true;
        } catch (error) {
            logger.error('Failed to setup SystemAudioDump', error);
            dialog.showErrorBox(
                'Permission Error',
                'Failed to set up audio capture. Please check system permissions and try again.'
            );
            return false;
        }
    } else {
        requirements.systemAudio = true; // Not needed on other platforms
    }

    // Ensure data directories exist
    try {
        ensureDataDirectories();
    } catch (error) {
        logger.error('Failed to create data directories:', error);
        dialog.showErrorBox(
            'Setup Error',
            'Failed to create required directories. Please check permissions.'
        );
        return false;
    }

    return true;
}

function ensureDataDirectories() {
    const homeDir = os.homedir();
    const julieDir = path.join(homeDir, 'julie');
    const dataDir = path.join(julieDir, 'data');
    const imageDir = path.join(dataDir, 'image');
    const audioDir = path.join(dataDir, 'audio');

    [julieDir, dataDir, imageDir, audioDir].forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    });

    return { imageDir, audioDir };
}

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 900,
        height: 400,
        frame: false,
        transparent: true,
        hasShadow: false,
        alwaysOnTop: true,
        skipTaskbar: true,
        hiddenInMissionControl: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            backgroundThrottling: false,
            enableBlinkFeatures: 'GetDisplayMedia',
            webSecurity: true,
            allowRunningInsecureContent: false,
            enableRemoteModule: true
        },
        backgroundColor: '#00000000',
    });

    require('@electron/remote/main').enable(mainWindow.webContents);

    session.defaultSession.setDisplayMediaRequestHandler(
        (request, callback) => {
            desktopCapturer.getSources({ types: ['screen'] }).then(sources => {
                callback({ video: sources[0], audio: 'loopback' });
            });
        },
        { useSystemPicker: true }
    );

    mainWindow.setContentProtection(true);
    mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

    if (process.platform === 'win32') {
        mainWindow.setAlwaysOnTop(true, 'screen-saver', 1);
    }

    mainWindow.loadFile(path.join(__dirname, 'index.html'));

    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.workAreaSize;
    const moveIncrement = Math.floor(Math.min(width, height) * 0.15);

    const isMac = process.platform === 'darwin';
    const modifier = isMac ? 'Alt' : 'Ctrl';
    const shortcuts = [`${modifier}+Up`, `${modifier}+Down`, `${modifier}+Left`, `${modifier}+Right`];

    shortcuts.forEach(accelerator => {
        globalShortcut.register(accelerator, () => {
            const [currentX, currentY] = mainWindow.getPosition();
            let newX = currentX;
            let newY = currentY;

            switch (accelerator) {
                case `${modifier}+Up`:
                    newY -= moveIncrement;
                    break;
                case `${modifier}+Down`:
                    newY += moveIncrement;
                    break;
                case `${modifier}+Left`:
                    newX -= moveIncrement;
                    break;
                case `${modifier}+Right`:
                    newX += moveIncrement;
                    break;
            }

            mainWindow.setPosition(newX, newY);
        });
    });

    const toggleVisibilityShortcut = isMac ? 'Cmd+\\' : 'Ctrl+\\';
    globalShortcut.register(toggleVisibilityShortcut, () => {
        if (mainWindow.isVisible()) {
            mainWindow.hide();
        } else {
            mainWindow.show();
        }
    });

    const toggleShortcut = isMac ? 'Cmd+M' : 'Ctrl+M';
    globalShortcut.register(toggleShortcut, () => {
        mouseEventsIgnored = !mouseEventsIgnored;
        if (mouseEventsIgnored) {
            mainWindow.setIgnoreMouseEvents(true, { forward: true });
            console.log('Mouse events ignored');
        } else {
            mainWindow.setIgnoreMouseEvents(false);
            console.log('Mouse events enabled');
        }
    });

    const nextStepShortcut = isMac ? 'Cmd+Enter' : 'Ctrl+Enter';
    globalShortcut.register(nextStepShortcut, async () => {
        console.log('Next step shortcut triggered');
        try {
            await sessionManager.sendMessage('What should be the next step here');
        } catch (error) {
            console.error('Error sending next step message:', error);
        }
    });

    ipcMain.on('view-changed', (event, view) => {
        if (view !== 'assistant') {
            mainWindow.setIgnoreMouseEvents(false);
        }
    });

    ipcMain.handle('window-minimize', () => {
        mainWindow.minimize();
    });
}

async function initializeGeminiSession(apiKey, customPrompt = '', profile = 'interview', language = 'en-US') {
    console.log('Initializing Gemini session...');
    
    if (!apiKey || apiKey.trim().length === 0) {
        console.error('API key is empty or undefined');
        dialog.showErrorBox(
            'Invalid API Key',
            'Please enter a valid Gemini API key in the settings.'
        );
        return false;
    }

    // Clean the API key and check format
    const cleanedKey = apiKey.trim();
    console.log('API key format check:');
    console.log('- Length:', cleanedKey.length);
    console.log('- Starts with:', cleanedKey.substring(0, 3) + '...');
    console.log('- Ends with:', '...' + cleanedKey.substring(cleanedKey.length - 3));
    console.log('- Contains spaces:', cleanedKey.includes(' '));
    console.log('- Contains newlines:', cleanedKey.includes('\n'));
    
    // Validate key format (should be AIza...)
    if (!cleanedKey.startsWith('AIza')) {
        dialog.showErrorBox(
            'Invalid API Key Format',
            'The API key should start with "AIza". Please make sure you\'re using a Gemini API key from Google AI Studio (https://aistudio.google.com/apikey).'
        );
        return false;
    }

    const systemPrompt = getSystemPrompt(profile, customPrompt);
    console.log('Using system prompt:', systemPrompt);

    try {
        // Initialize session manager with callbacks
        sessionManager.initialize(cleanedKey, systemPrompt, language, {
            onopen: () => {
                sendToRenderer('update-status', 'Connected to Gemini - Starting recording...');
            },
            onmessage: (message) => {
                console.log('Received message from Gemini:', message);
                
                if (message.serverContent?.modelTurn?.parts) {
                    console.log('Processing model turn parts...');
                    for (const part of message.serverContent.modelTurn.parts) {
                        if (part.text) {
                            console.log('Adding text to buffer:', part.text);
                            messageBuffer += part.text;
                        }
                    }
                }

                if (message.serverContent?.generationComplete) {
                    console.log('Generation complete, sending response:', messageBuffer);
                    sendToRenderer('update-response', messageBuffer);
                    messageBuffer = '';
                }

                if (message.serverContent?.turnComplete) {
                    console.log('Turn complete, updating status');
                    sendToRenderer('update-status', 'Listening...');
                }
            },
            onerror: (error) => {
                console.error('Gemini connection error:', error);
                sendToRenderer('update-status', 'Error: ' + error.message);
                dialog.showErrorBox(
                    'Gemini Error',
                    'Error connecting to Gemini API: ' + error.message
                );
            },
            onclose: (event) => {
                console.error('Session closed with reason:', event.reason);
                sendToRenderer('update-status', 'Session closed');
                
                if (event.reason.includes('API key not valid')) {
                    dialog.showErrorBox(
                        'Invalid API Key',
                        'The API key was rejected by Google. Please make sure:\n\n' +
                        '1. You\'re using a Gemini API key from Google AI Studio\n' +
                        '2. The key is copied correctly without extra spaces\n' +
                        '3. The key starts with "AIza"\n' +
                        '4. You have enabled the Gemini API in your Google Cloud Console\n\n' +
                        'Get a new key at: https://aistudio.google.com/apikey'
                    );
                }
            },
            onMaxReconnectAttemptsReached: () => {
                dialog.showErrorBox(
                    'Connection Error',
                    'Failed to maintain connection with Gemini API after multiple attempts. Please check your internet connection and try again.'
                );
            },
            onAuthError: (error) => {
                dialog.showErrorBox(
                    'Authentication Error',
                    'Failed to authenticate with Gemini API. Please check your API key and try again.'
                );
            }
        });

        // Start the initial session
        await sessionManager.startNewSession();
        return true;
    } catch (error) {
        console.error('Failed to initialize Gemini session:', error);
        console.error('Error details:', {
            name: error.name,
            message: error.message,
            stack: error.stack
        });
        
        let errorMessage = 'Failed to connect to Gemini API. ';
        if (error.message.includes('API key')) {
            errorMessage += 'The API key appears to be invalid. Please make sure you\'ve copied the entire key correctly from Google AI Studio (https://aistudio.google.com/apikey).';
        } else {
            errorMessage += 'Please check your API key and internet connection.';
        }
        
        dialog.showErrorBox(
            'Connection Error',
            errorMessage
        );
        return false;
    }
}

function sendToRenderer(channel, data) {
    const windows = BrowserWindow.getAllWindows();
    if (windows.length > 0) {
        windows[0].webContents.send(channel, data);
    }
}

async function sendAudioToGemini(base64Data) {
    try {
        await sessionManager.sendAudio(base64Data, 'audio/pcm;rate=24000');
        sendToRenderer('update-listening-state', true);
    } catch (error) {
        console.error('Error sending audio to Gemini:', error);
        sendToRenderer('update-listening-state', false);
    }
}

app.setName('Julie');
app.setAppUserModelId('com.julie.app');

app.on('ready', async () => {
    // Set the app's name and info for system dialogs
    app.setName('Julie');
    
    // On macOS, register the app for screen capture
    if (process.platform === 'darwin') {
        // Request screen capture access first
        const screenCaptureAccess = systemPreferences.getMediaAccessStatus('screen');
        if (screenCaptureAccess !== 'granted') {
            dialog.showMessageBox({
                type: 'info',
                title: 'Screen Recording Permission Required',
                message: 'Julie needs screen recording permission.',
                detail: 'Please follow these steps:\n\n' +
                       '1. Keep Julie running\n' +
                       '2. Open System Settings > Privacy & Security > Screen Recording\n' +
                       '3. Find and enable "Julie"\n' +
                       '4. Return to Julie and try again',
                buttons: ['Open Settings', 'Cancel'],
                defaultId: 0
            }).then(result => {
                if (result.response === 0) {
                    shell.openExternal('x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture');
                }
                app.quit();
            });
            return;
        }

        // Then request microphone access
        try {
            const micAccess = await systemPreferences.askForMediaAccess('microphone');
            if (!micAccess) {
                dialog.showMessageBox({
                    type: 'info',
                    title: 'Microphone Permission Required',
                    message: 'Julie needs microphone access.',
                    detail: 'Please follow these steps:\n\n' +
                           '1. Keep Julie running\n' +
                           '2. Open System Settings > Privacy & Security > Microphone\n' +
                           '3. Find and enable "Julie"\n' +
                           '4. Return to Julie and try again',
                    buttons: ['Open Settings', 'Cancel'],
                    defaultId: 0
                }).then(result => {
                    if (result.response === 0) {
                        shell.openExternal('x-apple.systempreferences:com.apple.preference.security?Privacy_Microphone');
                    }
                    app.quit();
                });
                return;
            }
        } catch (error) {
            console.error('Microphone permission error:', error);
            dialog.showErrorBox(
                'Permission Error',
                'Failed to request microphone permission. Please check System Settings > Privacy & Security > Microphone and ensure Julie is enabled.'
            );
            app.quit();
            return;
        }
    }

    if (await checkRequirements()) {
        createWindow();
    } else {
        dialog.showErrorBox(
            'Setup Failed',
            'Failed to meet all requirements. Please check the error messages and try again.'
        );
        app.quit();
    }
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('before-quit', () => {
    // Clean up any resources
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

ipcMain.handle('initialize-gemini', async (event, apiKey, customPrompt, profile = 'interview', language = 'en-US') => {
    return await initializeGeminiSession(apiKey, customPrompt, profile, language);
});

ipcMain.handle('send-audio-content', async (event, { data, mimeType }) => {
    if (!sessionManager) return { success: false, error: 'No active Gemini session' };
    try {
        await sendAudioToGemini(data);
        return { success: true };
    } catch (error) {
        console.error('Error sending audio:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('send-image-content', async (event, { data, debug }) => {
    if (!sessionManager) return { success: false, error: 'No active Gemini session' };

    try {
        if (!data || typeof data !== 'string') {
            console.error('Invalid image data received');
            return { success: false, error: 'Invalid image data' };
        }

        const buffer = Buffer.from(data, 'base64');

        if (buffer.length < 1000) {
            console.error(`Image buffer too small: ${buffer.length} bytes`);
            return { success: false, error: 'Image buffer too small' };
        }

        process.stdout.write('!');
        await sessionManager.sendMedia(data, 'image/jpeg');

        return { success: true };
    } catch (error) {
        console.error('Error sending image:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('send-text-message', async (event, text) => {
    try {
        if (!text || typeof text !== 'string' || text.trim().length === 0) {
            return { success: false, error: 'Invalid text message' };
        }

        console.log('Sending text message:', text);
        await sessionManager.sendMessage(text.trim());
        return { success: true };
    } catch (error) {
        console.error('Error sending text:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('close-session', async event => {
    try {
        await sessionManager.closeCurrentSession();
        return { success: true };
    } catch (error) {
        console.error('Error closing session:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('quit-application', async event => {
    try {
        app.quit();
        return { success: true };
    } catch (error) {
        console.error('Error quitting application:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('open-external', async (event, url) => {
    try {
        await shell.openExternal(url);
        return { success: true };
    } catch (error) {
        console.error('Error opening external URL:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('check-permissions', async () => {
    try {
        return await checkPermissionStatus();
    } catch (error) {
        console.error('Error checking permissions:', error);
        return {
            screen: {
                status: 'unknown',
                authorized: false,
                appName: app.getName(),
                error: error.message
            },
            microphone: {
                status: 'unknown',
                authorized: false,
                appName: app.getName(),
                error: error.message
            }
        };
    }
});
