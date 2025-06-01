const fs = require('fs');
const path = require('path');
const logger = require('./logger');

// Audio level thresholds
const AUDIO_THRESHOLDS = {
    SILENCE: 100,    // Absolute value below this is considered silence
    LOW: 1000,       // Low audio level
    NORMAL: 5000,    // Normal audio level
    HIGH: 20000      // High audio level
};

// Convert raw PCM to WAV format for easier playback and verification
function pcmToWav(pcmBuffer, outputPath, sampleRate = 24000, channels = 1, bitDepth = 16) {
    const byteRate = sampleRate * channels * (bitDepth / 8);
    const blockAlign = channels * (bitDepth / 8);
    const dataSize = pcmBuffer.length;

    // Create WAV header
    const header = Buffer.alloc(44);

    // "RIFF" chunk descriptor
    header.write('RIFF', 0);
    header.writeUInt32LE(dataSize + 36, 4); // File size - 8
    header.write('WAVE', 8);

    // "fmt " sub-chunk
    header.write('fmt ', 12);
    header.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
    header.writeUInt16LE(1, 20); // AudioFormat (1 for PCM)
    header.writeUInt16LE(channels, 22); // NumChannels
    header.writeUInt32LE(sampleRate, 24); // SampleRate
    header.writeUInt32LE(byteRate, 28); // ByteRate
    header.writeUInt16LE(blockAlign, 32); // BlockAlign
    header.writeUInt16LE(bitDepth, 34); // BitsPerSample

    // "data" sub-chunk
    header.write('data', 36);
    header.writeUInt32LE(dataSize, 40); // Subchunk2Size

    // Combine header and PCM data
    const wavBuffer = Buffer.concat([header, pcmBuffer]);

    // Write to file
    fs.writeFileSync(outputPath, wavBuffer);
    logger.debug('WAV file created', { path: outputPath, size: wavBuffer.length });

    return outputPath;
}

// Calculate audio level from buffer
function calculateAudioLevel(buffer) {
    const int16Array = new Int16Array(buffer.buffer, buffer.byteOffset, buffer.length / 2);
    let maxValue = 0;
    
    for (let i = 0; i < int16Array.length; i++) {
        maxValue = Math.max(maxValue, Math.abs(int16Array[i]));
    }

    // Convert to percentage (0-100)
    return Math.min(100, (maxValue / 32768) * 100);
}

// Analyze audio buffer for debugging and metrics
function analyzeAudioBuffer(buffer, label = 'Audio') {
    const int16Array = new Int16Array(buffer.buffer, buffer.byteOffset, buffer.length / 2);

    let minValue = 32767;
    let maxValue = -32768;
    let avgValue = 0;
    let rmsValue = 0;
    let silentSamples = 0;
    let peakCount = 0;

    for (let i = 0; i < int16Array.length; i++) {
        const sample = Math.abs(int16Array[i]);
        minValue = Math.min(minValue, sample);
        maxValue = Math.max(maxValue, sample);
        avgValue += sample;
        rmsValue += sample * sample;

        if (sample < AUDIO_THRESHOLDS.SILENCE) {
            silentSamples++;
        }
        if (sample > AUDIO_THRESHOLDS.HIGH) {
            peakCount++;
        }
    }

    avgValue /= int16Array.length;
    rmsValue = Math.sqrt(rmsValue / int16Array.length);
    const silencePercentage = (silentSamples / int16Array.length) * 100;
    const audioLevel = calculateAudioLevel(buffer);

    const metrics = {
        label,
        samples: int16Array.length,
        minValue,
        maxValue,
        avgValue: avgValue.toFixed(2),
        rmsValue: rmsValue.toFixed(2),
        silencePercentage: silencePercentage.toFixed(1),
        dynamicRange: (20 * Math.log10(maxValue / (rmsValue || 1))).toFixed(2),
        audioLevel: audioLevel.toFixed(1),
        peakCount,
        quality: getAudioQuality(maxValue, silencePercentage)
    };

    logger.logAudioMetrics(metrics);
    return metrics;
}

// Determine audio quality based on metrics
function getAudioQuality(maxValue, silencePercentage) {
    if (maxValue < AUDIO_THRESHOLDS.LOW) {
        return 'very-low';
    } else if (maxValue < AUDIO_THRESHOLDS.NORMAL) {
        return 'low';
    } else if (silencePercentage > 90) {
        return 'mostly-silent';
    } else if (silencePercentage > 50) {
        return 'partially-silent';
    } else if (maxValue > AUDIO_THRESHOLDS.HIGH) {
        return 'high';
    } else {
        return 'good';
    }
}

// Save audio buffer with metadata for debugging
function saveDebugAudio(buffer, type, timestamp = Date.now()) {
    const homeDir = require('os').homedir();
    const debugDir = path.join(homeDir, 'julie', 'debug');

    if (!fs.existsSync(debugDir)) {
        fs.mkdirSync(debugDir, { recursive: true });
    }

    const pcmPath = path.join(debugDir, `${type}_${timestamp}.pcm`);
    const wavPath = path.join(debugDir, `${type}_${timestamp}.wav`);
    const metaPath = path.join(debugDir, `${type}_${timestamp}.json`);

    try {
        // Save raw PCM
        fs.writeFileSync(pcmPath, buffer);

        // Convert to WAV for easy playback
        pcmToWav(buffer, wavPath);

        // Analyze and save metadata
        const analysis = analyzeAudioBuffer(buffer, type);
        fs.writeFileSync(
            metaPath,
            JSON.stringify(
                {
                    timestamp,
                    type,
                    bufferSize: buffer.length,
                    analysis,
                    format: {
                        sampleRate: 24000,
                        channels: 1,
                        bitDepth: 16,
                    },
                },
                null,
                2
            )
        );

        logger.info('Debug audio saved', { type, paths: { pcm: pcmPath, wav: wavPath, meta: metaPath } });
        return { pcmPath, wavPath, metaPath };
    } catch (error) {
        logger.error('Failed to save debug audio', error);
        throw error;
    }
}

module.exports = {
    pcmToWav,
    analyzeAudioBuffer,
    saveDebugAudio,
    calculateAudioLevel,
    AUDIO_THRESHOLDS
};
