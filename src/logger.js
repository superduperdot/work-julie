const fs = require('fs');
const path = require('path');
const os = require('os');

class Logger {
    constructor() {
        this.logDir = path.join(os.homedir(), 'julie', 'logs');
        this.logFile = path.join(this.logDir, `app_${new Date().toISOString().split('T')[0]}.log`);
        this.ensureLogDirectory();
    }

    ensureLogDirectory() {
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
    }

    formatMessage(level, message, data = null) {
        const timestamp = new Date().toISOString();
        let logMessage = `[${timestamp}] [${level}] ${message}`;
        if (data) {
            logMessage += `\n${JSON.stringify(data, null, 2)}`;
        }
        return logMessage;
    }

    writeToFile(message) {
        fs.appendFileSync(this.logFile, message + '\n');
    }

    info(message, data = null) {
        const formattedMessage = this.formatMessage('INFO', message, data);
        console.log(formattedMessage);
        this.writeToFile(formattedMessage);
    }

    error(message, error = null) {
        const formattedMessage = this.formatMessage('ERROR', message, {
            error: error?.message || error,
            stack: error?.stack
        });
        console.error(formattedMessage);
        this.writeToFile(formattedMessage);
    }

    debug(message, data = null) {
        const formattedMessage = this.formatMessage('DEBUG', message, data);
        console.debug(formattedMessage);
        this.writeToFile(formattedMessage);
    }

    warn(message, data = null) {
        const formattedMessage = this.formatMessage('WARN', message, data);
        console.warn(formattedMessage);
        this.writeToFile(formattedMessage);
    }

    // Audio specific logging
    logAudioMetrics(metrics) {
        this.debug('Audio Metrics', {
            timestamp: new Date().toISOString(),
            ...metrics
        });
    }

    // System status logging
    logSystemStatus(status) {
        this.info('System Status', status);
    }

    // Gemini API interaction logging
    logGeminiInteraction(type, data) {
        this.debug(`Gemini ${type}`, data);
    }
}

const logger = new Logger();
module.exports = logger; 