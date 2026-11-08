import { writeFileSync } from 'node:fs';
import { Buffer } from 'node:buffer';

// A complete one-second cycle: tone followed by silence, looped by expo-audio.
const sampleRate = 22050;
for (const [name, toneSeconds] of [['ais-warning-alarm', 0.16], ['ais-danger-alarm', 0.65]]) {
    const samples = sampleRate;
    const toneSamples = Math.round(toneSeconds * sampleRate);
    const audio = Buffer.alloc(44 + samples * 2);
    audio.write('RIFF', 0);
    audio.writeUInt32LE(audio.length - 8, 4);
    audio.write('WAVEfmt ', 8);
    audio.writeUInt32LE(16, 16);
    audio.writeUInt16LE(1, 20);
    audio.writeUInt16LE(1, 22);
    audio.writeUInt32LE(sampleRate, 24);
    audio.writeUInt32LE(sampleRate * 2, 28);
    audio.writeUInt16LE(2, 32);
    audio.writeUInt16LE(16, 34);
    audio.write('data', 36);
    audio.writeUInt32LE(samples * 2, 40);
    const fadeSamples = Math.round(sampleRate * 0.008);
    for (let i = 0; i < toneSamples; i++) {
        const envelope = Math.min(1, i / fadeSamples, (toneSamples - 1 - i) / fadeSamples);
        const sample = Math.sin(2 * Math.PI * 880 * i / sampleRate) * envelope * 0.45;
        audio.writeInt16LE(Math.round(sample * 32767), 44 + i * 2);
    }
    writeFileSync(new URL(`../assets/sounds/${name}.wav`, import.meta.url), audio);
}
