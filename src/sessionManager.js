const { GoogleGenAI } = require('@google/genai');
const logger = require('./logger');

class SessionManager {
    constructor() {
        this.currentSession = null;
        this.sessionHandle = null;
        this.isReconnecting = false;
        this.maxSessionDuration = 14 * 60 * 1000; // 14 minutes (safe margin before 15-min limit)
        this.sessionStartTime = null;
        this.inactivityTimeout = 60 * 1000; // 1 minute
        this.lastActivityTime = null;
        this.client = null;
        this.apiKey = null;
        this.systemPrompt = null;
        this.language = 'en-US';
        this.callbacks = {};
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.baseReconnectDelay = 1000; // 1 second
    }

    initialize(apiKey, systemPrompt = '', language = 'en-US', callbacks = {}) {
        this.apiKey = apiKey;
        this.systemPrompt = systemPrompt;
        this.language = language;
        this.callbacks = callbacks;
        this.client = new GoogleGenAI({ apiKey });
        logger.info('SessionManager initialized');
    }

    async startNewSession() {
        try {
            // Close existing session if any
            await this.closeCurrentSession();
            
            if (!this.client) {
                throw new Error('SessionManager not initialized');
            }

            logger.info('Starting new Gemini session...');
            
            // Start new session with compression and resumption enabled
            this.currentSession = await this.client.live.connect({
                model: 'gemini-2.0-flash-live-001',
                config: {
                    responseModalities: ['TEXT'],
                    contextWindowCompression: { slidingWindow: {} },
                    sessionResumption: { handle: this.sessionHandle },
                    speechConfig: { languageCode: this.language },
                    systemInstruction: {
                        parts: [{ text: this.systemPrompt }],
                    }
                },
                callbacks: {
                    onopen: () => {
                        logger.info('Gemini connection opened successfully');
                        this.callbacks.onopen?.();
                    },
                    onmessage: (message) => {
                        // Handle session resumption updates
                        if (message.sessionResumptionUpdate?.newHandle) {
                            this.sessionHandle = message.sessionResumptionUpdate.newHandle;
                            logger.info('Received new session handle');
                        }
                        
                        // Handle session expiry warning
                        if (message.goAway) {
                            logger.info('Received session expiry warning');
                            this.handleSessionExpiry();
                        }

                        this.callbacks.onmessage?.(message);
                    },
                    onerror: (error) => {
                        logger.error('Gemini connection error:', error);
                        this.callbacks.onerror?.(error);
                        this.handleError(error);
                    },
                    onclose: (event) => {
                        logger.info('Session closed:', event.reason);
                        this.callbacks.onclose?.(event);
                        
                        if (!this.isReconnecting) {
                            this.handleUnexpectedClose(event);
                        }
                    }
                }
            });
            
            this.sessionStartTime = Date.now();
            this.lastActivityTime = Date.now();
            this.reconnectAttempts = 0;
            this.scheduleSessionRefresh();
            
            logger.info('New session started successfully');
            return true;
        } catch (error) {
            logger.error('Failed to start new session:', error);
            throw error;
        }
    }

    async closeCurrentSession() {
        if (this.currentSession) {
            try {
                await this.currentSession.close();
                logger.info('Session closed successfully');
            } catch (error) {
                logger.error('Error closing session:', error);
            }
            this.currentSession = null;
        }
    }

    scheduleSessionRefresh() {
        setTimeout(async () => {
            if (!this.isReconnecting && this.currentSession) {
                logger.info('Scheduled session refresh triggered');
                this.isReconnecting = true;
                try {
                    await this.startNewSession();
                } catch (error) {
                    logger.error('Failed to refresh session:', error);
                } finally {
                    this.isReconnecting = false;
                }
            }
        }, this.maxSessionDuration);
    }

    async handleSessionExpiry() {
        logger.info('Handling session expiry');
        if (!this.isReconnecting) {
            this.isReconnecting = true;
            try {
                await this.startNewSession();
            } catch (error) {
                logger.error('Failed to handle session expiry:', error);
            } finally {
                this.isReconnecting = false;
            }
        }
    }

    async handleUnexpectedClose(event) {
        logger.warn('Handling unexpected session close:', event.reason);
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            const delay = this.baseReconnectDelay * Math.pow(2, this.reconnectAttempts);
            this.reconnectAttempts++;
            
            setTimeout(async () => {
                try {
                    await this.startNewSession();
                } catch (error) {
                    logger.error('Failed to reconnect after unexpected close:', error);
                }
            }, delay);
        } else {
            logger.error('Max reconnection attempts reached');
            this.callbacks.onMaxReconnectAttemptsReached?.();
        }
    }

    async handleError(error) {
        logger.error('Handling session error:', error);
        if (error.message.includes('API key') || error.message.includes('unauthorized')) {
            this.callbacks.onAuthError?.(error);
        } else {
            await this.handleUnexpectedClose({ reason: error.message });
        }
    }

    isSessionHealthy() {
        return this.currentSession && 
               Date.now() - this.sessionStartTime < this.maxSessionDuration &&
               Date.now() - this.lastActivityTime < this.inactivityTimeout;
    }

    async ensureHealthySession() {
        if (!this.isSessionHealthy()) {
            logger.info('Session needs refresh');
            await this.startNewSession();
        }
    }

    updateActivityTimestamp() {
        this.lastActivityTime = Date.now();
    }

    async sendMessage(message) {
        try {
            await this.ensureHealthySession();
            this.updateActivityTimestamp();
            
            await this.currentSession.sendRealtimeInput({ text: message });
            logger.info('Message sent successfully');
            return true;
        } catch (error) {
            logger.error('Error sending message:', error);
            throw error;
        }
    }

    async sendAudio(audioData, mimeType) {
        try {
            await this.ensureHealthySession();
            this.updateActivityTimestamp();
            
            await this.currentSession.sendRealtimeInput({
                audio: {
                    data: audioData,
                    mimeType: mimeType
                }
            });
            logger.info('Audio sent successfully');
            return true;
        } catch (error) {
            logger.error('Error sending audio:', error);
            throw error;
        }
    }

    async sendMedia(data, mimeType) {
        try {
            await this.ensureHealthySession();
            this.updateActivityTimestamp();
            
            await this.currentSession.sendRealtimeInput({
                media: { data: data, mimeType: mimeType }
            });
            logger.info('Media sent successfully');
            return true;
        } catch (error) {
            logger.error('Error sending media:', error);
            throw error;
        }
    }
}

module.exports = new SessionManager(); 