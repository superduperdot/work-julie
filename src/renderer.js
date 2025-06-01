// renderer.js
const { ipcRenderer } = require('electron');
const { dialog } = require('electron');

// Constants
const AUDIO_CONFIG = {
    sampleRate: 24000,
    bufferSize: 4096,
    captureInterval: 1000, // Screenshot capture interval in ms
    constraints: {
        audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: 24000
        }
    },
    screenCapture: {
        video: {
            frameRate: 1,
            width: { ideal: 1920 },
            height: { ideal: 1080 }
        },
        audio: false
    }
};

// State management
const state = {
    mediaStream: null,
    screenshotInterval: null,
    audioContext: null,
    audioProcessor: null,
    microphoneStream: null,
    hiddenVideo: null,
    offscreenCanvas: null,
    offscreenContext: null,
    isCapturing: false
};

// Platform detection
const platform = {
    isLinux: process.platform === 'linux',
    isMacOS: process.platform === 'darwin'
};

// UI Elements
class JulieUI {
    static element() {
        return document.getElementById('julie');
    }

    static updateStatus(status) {
        const el = this.element();
        if (el) {
            el.setStatus(status);
            console.log('Status update:', status);
        }
    }

    static updateAudioStatus(status) {
        const el = this.element();
        if (el) {
            el.updateAudioStatus(status);
            console.log('Audio status update:', status);
        }
    }

    static updatePermissionStatus(type, status) {
        const el = this.element();
        if (el) {
            el.updatePermissionStatus(type, status);
            console.log('Permission status update:', type, status);
        }
    }
}

// Audio Processing
class AudioProcessor {
    static async startMicrophoneCapture() {
        try {
            console.log('Requesting microphone access...');
            state.microphoneStream = await navigator.mediaDevices.getUserMedia(AUDIO_CONFIG.constraints);
            
            console.log('Creating audio context...');
            state.audioContext = new AudioContext({
                sampleRate: AUDIO_CONFIG.sampleRate
            });
            
            const source = state.audioContext.createMediaStreamSource(state.microphoneStream);
            state.audioProcessor = state.audioContext.createScriptProcessor(AUDIO_CONFIG.bufferSize, 1, 1);

            console.log('Setting up audio processing...');
            state.audioProcessor.onaudioprocess = this.handleAudioProcess;

            source.connect(state.audioProcessor);
            state.audioProcessor.connect(state.audioContext.destination);

            console.log('Microphone capture started');
            JulieUI.updateStatus('Microphone active');
            JulieUI.updateAudioStatus({ 
                active: true,
                source: 'microphone'
            });

            return true;
        } catch (error) {
            console.error('Error starting microphone capture:', error);
            JulieUI.updateStatus(`Microphone error: ${error.message}`);
            return false;
        }
    }

    static async handleAudioProcess(e) {
        try {
            const inputData = e.inputBuffer.getChannelData(0);
            const pcmData = AudioProcessor.convertFloat32ToInt16(inputData);
            const base64Data = btoa(String.fromCharCode(...new Uint8Array(pcmData.buffer)));
            
            const result = await ipcRenderer.invoke('send-audio-content', {
                data: base64Data,
                mimeType: 'audio/pcm;rate=24000'
            });

            if (!result.success) {
                console.error('Failed to send audio:', result.error);
            }
        } catch (error) {
            console.error('Audio processing error:', error);
        }
    }

    static convertFloat32ToInt16(float32Array) {
        const int16Array = new Int16Array(float32Array.length);
        for (let i = 0; i < float32Array.length; i++) {
            const s = Math.max(-1, Math.min(1, float32Array[i]));
            int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }
        return int16Array;
    }

    static stop() {
        console.log('Stopping audio capture...');
        
        if (state.audioProcessor) {
            state.audioProcessor.disconnect();
            state.audioProcessor = null;
        }

        if (state.audioContext) {
            state.audioContext.close();
            state.audioContext = null;
        }

        if (state.microphoneStream) {
            state.microphoneStream.getTracks().forEach(track => track.stop());
            state.microphoneStream = null;
        }

        JulieUI.updateStatus('Audio capture stopped');
        JulieUI.updateAudioStatus({ active: false });
    }
}

// Screen Capture
class ScreenCapture {
    static async start() {
        try {
            console.log('Starting screen capture...');
            state.mediaStream = await navigator.mediaDevices.getDisplayMedia(AUDIO_CONFIG.screenCapture);
            
            // Start capturing screenshots
            state.screenshotInterval = setInterval(this.captureScreenshot, AUDIO_CONFIG.captureInterval);
            setTimeout(this.captureScreenshot, 100); // Immediate first capture
            
            return true;
        } catch (error) {
            console.error('Screen capture error:', error);
            return false;
        }
    }

    static async captureScreenshot() {
        if (!state.mediaStream) return;

        try {
            // Lazy initialization of video element
            if (!state.hiddenVideo) {
                await ScreenCapture.initializeVideoElement();
            }

            // Ensure video is ready
            if (state.hiddenVideo.readyState < 2) {
                console.warn('Video not ready yet, skipping screenshot');
                return;
            }

            state.offscreenContext.drawImage(
                state.hiddenVideo, 
                0, 
                0, 
                state.offscreenCanvas.width, 
                state.offscreenCanvas.height
            );

            // Quality check
            if (ScreenCapture.isBlankImage()) {
                console.warn('Screenshot appears to be blank/black');
                return;
            }

            await ScreenCapture.sendScreenshot();
        } catch (error) {
            console.error('Screenshot capture error:', error);
        }
    }

    static async initializeVideoElement() {
        state.hiddenVideo = document.createElement('video');
        state.hiddenVideo.srcObject = state.mediaStream;
        state.hiddenVideo.muted = true;
        state.hiddenVideo.playsInline = true;
        await state.hiddenVideo.play();

        await new Promise(resolve => {
            if (state.hiddenVideo.readyState >= 2) return resolve();
            state.hiddenVideo.onloadedmetadata = () => resolve();
        });

        state.offscreenCanvas = document.createElement('canvas');
        state.offscreenCanvas.width = state.hiddenVideo.videoWidth;
        state.offscreenCanvas.height = state.hiddenVideo.videoHeight;
        state.offscreenContext = state.offscreenCanvas.getContext('2d');
    }

    static isBlankImage() {
        const imageData = state.offscreenContext.getImageData(0, 0, 1, 1);
        return imageData.data.every((value, index) => index === 3 || value === 0);
    }

    static async sendScreenshot() {
        return new Promise((resolve, reject) => {
            state.offscreenCanvas.toBlob(
                async blob => {
                    if (!blob) {
                        reject(new Error('Failed to create blob from canvas'));
                        return;
                    }

                    const reader = new FileReader();
                    reader.onloadend = async () => {
                        try {
                            const base64data = reader.result.split(',')[1];
                            if (!base64data || base64data.length < 100) {
                                throw new Error('Invalid base64 data generated');
                            }

                            const result = await ipcRenderer.invoke('send-image-content', {
                                data: base64data
                            });

                            if (!result.success) {
                                throw new Error(result.error);
                            }

                            resolve();
                        } catch (error) {
                            reject(error);
                        }
                    };
                    reader.readAsDataURL(blob);
                },
                'image/jpeg',
                0.8
            );
        });
    }

    static stop() {
        if (state.screenshotInterval) {
            clearInterval(state.screenshotInterval);
            state.screenshotInterval = null;
        }

        if (state.mediaStream) {
            state.mediaStream.getTracks().forEach(track => track.stop());
            state.mediaStream = null;
        }

        if (state.hiddenVideo) {
            state.hiddenVideo.pause();
            state.hiddenVideo.srcObject = null;
            state.hiddenVideo = null;
        }

        state.offscreenCanvas = null;
        state.offscreenContext = null;
    }
}

// Permission handling
class PermissionManager {
    static async checkAndRequestPermissions() {
        if (!platform.isMacOS) {
            return this.handleNonMacOSPermissions();
        }

        try {
            console.log('Checking macOS permissions...');
            const permissions = await ipcRenderer.invoke('check-permissions');
            
            // Update UI with current status
            Object.entries(permissions).forEach(([type, status]) => {
                JulieUI.updatePermissionStatus(type, status);
            });

            // If either permission is not authorized, show the permission request dialog
            if (!permissions.screen.authorized || !permissions.microphone.authorized) {
                const { dialog, shell } = require('@electron/remote');
                
                const result = await dialog.showMessageBox({
                    type: 'info',
                    title: 'Permissions Required',
                    message: 'Julie needs the following permissions to work:',
                    detail: 'Current Status:\n' +
                           `Screen Recording: ${permissions.screen.status}\n` +
                           `Microphone: ${permissions.microphone.status}\n\n` +
                           'Please follow these steps:\n\n' +
                           '1. Click "Open Settings" below\n' +
                           '2. Find "Julie" in the list\n' +
                           '3. Enable the permission\n' +
                           '4. Return to Julie and click "Check Again"\n\n' +
                           'Important: Keep Julie running while granting permissions!',
                    buttons: ['Open Screen Recording Settings', 'Open Microphone Settings', 'Check Again', 'Cancel'],
                    defaultId: 0
                });

                switch (result.response) {
                    case 0: // Screen Recording
                        shell.openExternal('x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture');
                        return false;
                    case 1: // Microphone
                        shell.openExternal('x-apple.systempreferences:com.apple.preference.security?Privacy_Microphone');
                        return false;
                    case 2: // Check Again
                        return await this.checkAndRequestPermissions();
                    default: // Cancel
                        return false;
                }
            }

            console.log('All permissions granted');
            return true;

        } catch (error) {
            console.error('Permission check failed:', error);
            const { dialog } = require('@electron/remote');
            dialog.showErrorBox(
                'Permission Error',
                `Failed to check permissions: ${error.message}\n\n` +
                'Please ensure Julie has both Screen Recording and Microphone permissions in System Settings.'
            );
            return false;
        }
    }

    static async handleNonMacOSPermissions() {
        try {
            // Request screen capture permission
            const screenPermission = await navigator.permissions.query({ name: 'display-capture' });
            JulieUI.updatePermissionStatus('screen', screenPermission.state);
            
            // Request microphone permission
            const micPermission = await navigator.permissions.query({ name: 'microphone' });
            JulieUI.updatePermissionStatus('microphone', micPermission.state);

            if (screenPermission.state === 'denied' || micPermission.state === 'denied') {
                throw new Error('Required permissions were denied');
            }

            // If permissions are not granted, request them
            if (screenPermission.state === 'prompt' || micPermission.state === 'prompt') {
                const { dialog } = require('@electron/remote');
                const result = await dialog.showMessageBox({
                    type: 'info',
                    title: 'Permissions Required',
                    message: 'Julie needs access to your screen and microphone.',
                    detail: 'Please allow access when prompted by your browser.',
                    buttons: ['Continue', 'Cancel'],
                    defaultId: 0
                });

                if (result.response !== 0) {
                    return false;
                }

                // Try to get microphone permission first
                try {
                    const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    micStream.getTracks().forEach(track => track.stop());
                } catch (error) {
                    console.error('Microphone permission denied:', error);
                    return false;
                }
            }

            return true;
        } catch (error) {
            console.error('Permission check failed:', error);
            return false;
        }
    }
}

// Main capture control
async function startCapture() {
    try {
        if (state.isCapturing) {
            console.warn('Capture already in progress');
            return false;
        }

        // Check permissions first
        console.log('Checking permissions...');
        const permissionsGranted = await PermissionManager.checkAndRequestPermissions();
        if (!permissionsGranted) {
            throw new Error('Required permissions not granted');
        }

        // Start audio capture
        console.log('Starting audio capture...');
        const micSuccess = await AudioProcessor.startMicrophoneCapture();
        if (!micSuccess) {
            throw new Error('Failed to start microphone capture');
        }

        // Start screen capture
        console.log('Starting screen capture...');
        const screenSuccess = await ScreenCapture.start();
        if (!screenSuccess) {
            AudioProcessor.stop();
            throw new Error('Failed to start screen capture');
        }

        state.isCapturing = true;
        JulieUI.updateStatus('Capture started');
        return true;

    } catch (error) {
        console.error('Error starting capture:', error);
        JulieUI.updateStatus('error');
        
        const { dialog } = require('@electron/remote');
        dialog.showErrorBox('Capture Error', error.message);
        return false;
    }
}

function stopCapture() {
    AudioProcessor.stop();
    ScreenCapture.stop();
    state.isCapturing = false;
}

// Initialize Gemini
async function initializeGemini(profile = 'interview', language = 'en-US') {
    const apiKey = localStorage.getItem('apiKey')?.trim();
    console.log('Retrieved API key from localStorage, length:', apiKey?.length);
    
    if (!apiKey) {
        console.error('No API key found in localStorage');
        JulieUI.updateStatus('error');
        return false;
    }

    try {
        console.log('Initializing Gemini with API key...');
        const success = await ipcRenderer.invoke(
            'initialize-gemini', 
            apiKey, 
            localStorage.getItem('customPrompt') || '', 
            profile, 
            language
        );

        if (success) {
            console.log('Gemini initialization successful');
            JulieUI.updateStatus('Live');
        } else {
            console.error('Gemini initialization failed');
            JulieUI.updateStatus('error');
        }
        return success;
    } catch (error) {
        console.error('Gemini initialization error:', error);
        JulieUI.updateStatus('error');
        return false;
    }
}

// Export functions and setup event listeners
window.julie = {
    initializeGemini,
    startCapture,
    stopCapture,
    isLinux: platform.isLinux,
    isMacOS: platform.isMacOS,
    e: JulieUI.element
};

// Event listeners
ipcRenderer.on('update-status', (event, status) => JulieUI.updateStatus(status));
ipcRenderer.on('update-response', (event, response) => JulieUI.element()?.setResponse(response));
ipcRenderer.on('update-permission-status', (event, { type, status }) => JulieUI.updatePermissionStatus(type, status));
ipcRenderer.on('update-audio-status', (event, status) => JulieUI.updateAudioStatus(status));
ipcRenderer.on('update-audio-metrics', (event, metrics) => {
    const el = JulieUI.element();
    if (el) {
        if (metrics.audioLevel !== undefined) {
            el.audioLevel = parseFloat(metrics.audioLevel);
        }
        if (metrics.quality) {
            el.audioQuality = metrics.quality;
        }
        el.requestUpdate();
    }
});
