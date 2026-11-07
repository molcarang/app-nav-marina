import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import * as alertState from '../features/console/model/aisAlertState.js';

const require = createRequire(import.meta.url);
const babel = require('@babel/core');
const source = readFileSync(new URL('../features/console/hooks/useAisCollisionAlarm.js', import.meta.url), 'utf8');
const { code } = babel.transformSync(source, { configFile: false, babelrc: false, plugins: ['@babel/plugin-transform-modules-commonjs'] });
const target = level => ({ collision: { level } });

function harness() {
    const state = [], effects = [];
    let stateIndex, effectIndex, pendingEffects, dirty, voices, value, frames;
    const react = {
        useState(initial) {
            const index = stateIndex++;
            if (!(index in state)) state[index] = initial;
            return [state[index], next => {
                const result = typeof next === 'function' ? next(state[index]) : next;
                if (!Object.is(result, state[index])) { state[index] = result; dirty = true; }
            }];
        },
        useEffect(callback, deps) {
            const index = effectIndex++;
            if (!effects[index] || deps.some((dep, i) => !Object.is(dep, effects[index][i]))) {
                pendingEffects.push(callback);
                effects[index] = deps;
            }
        },
        useCallback(callback) { return callback; },
    };
    const exports = {};
    vm.runInNewContext(code, { exports, require(name) {
        if (name === 'react') return react;
        if (name === '../model/aisAlertState.js') return alertState;
        if (name === './useAlarmSound') return { useAlarmSound: (active, sound) => voices.push({ active, sound }) };
        if (name.endsWith('.wav')) return name;
        throw Error(name);
    } });
    return {
        render(targets) {
            frames = [];
            do {
                stateIndex = effectIndex = 0; pendingEffects = []; voices = []; dirty = false;
                value = exports.useAisCollisionAlarm(targets);
                frames.push(voices.map(voice => voice.active));
                for (const callback of pendingEffects) callback();
            } while (dirty);
            return value;
        },
        get voices() { return voices.map(voice => voice.active); },
        get frames() { return frames; },
    };
}

test('sonido AIS: naranja corto, rojo prioritario y sin dos voces simultaneas', () => {
    const app = harness();
    assert.equal(app.render({}).level, null);
    assert.deepEqual(app.voices, [false, false]);
    assert.equal(app.render({ a: target('warning') }).level, 'warning');
    assert.deepEqual(app.voices, [true, false]);
    assert.equal(app.render({ a: target('warning'), b: target('danger') }).level, 'danger');
    assert.deepEqual(app.voices, [false, true]);
    assert.equal(app.render({ a: target('unknown'), b: target('disabled'), c: target('clear') }).level, null);
    assert.deepEqual(app.voices, [false, false]);
});

test('el silencio se conserva con los mismos barcos y niveles y se puede quitar manualmente', () => {
    const app = harness();
    let alarm = app.render({ a: target('warning') });
    alarm.toggleMute();
    alarm = app.render({ a: target('warning') });
    assert.equal(alarm.muted, true);
    assert.deepEqual(app.voices, [false, false]);
    alarm = app.render({ a: { collision: { level: 'warning', cpaNm: 0.25, tcpaMinutes: 7 }, name: 'NEW NAME' } });
    assert.equal(alarm.level, 'warning');
    assert.equal(alarm.muted, true);
    assert.deepEqual(app.voices, [false, false]);
    alarm.toggleMute();
    alarm = app.render({ a: target('warning') });
    assert.equal(alarm.muted, false);
    assert.deepEqual(app.voices, [true, false]);
});

test('entra otro barco en alarma y rearma aunque el nivel maximo siga siendo rojo', () => {
    const app = harness();
    app.render({ a: target('danger') }).toggleMute();
    assert.equal(app.render({ a: target('danger') }).muted, true);
    let alarm = app.render({ a: target('danger'), b: target('warning') });
    assert.equal(alarm.level, 'danger');
    assert.equal(alarm.muted, false);
    assert.deepEqual(app.voices, [false, true]);
    // The new alarm leaving must not silently acknowledge the original one again.
    alarm = app.render({ a: target('danger') });
    assert.equal(alarm.muted, false);
    alarm.toggleMute();
    assert.equal(app.render({ a: target('danger') }).muted, true);
    assert.equal(app.render({ replacement: target('danger') }).muted, false);
});

test('naranja a rojo reactiva el sonido; al bajar sigue sin silenciarse automaticamente', () => {
    const app = harness();
    app.render({ a: target('warning') }).toggleMute();
    assert.equal(app.render({ a: target('warning') }).muted, true);
    const alarm = app.render({ a: target('danger') });
    assert.equal(alarm.muted, false);
    assert.deepEqual(app.voices, [false, true]);
    assert.equal(app.render({ a: target('warning') }).muted, false);
    assert.deepEqual(app.voices, [true, false]);
});

test('rojo a naranja mantiene el silencio sin un pitido transitorio; volver a rojo si rearma', () => {
    const app = harness();
    app.render({ a: target('danger') }).toggleMute();
    assert.equal(app.render({ a: target('danger') }).muted, true);
    const alarm = app.render({ a: target('warning') });
    assert.equal(alarm.level, 'warning');
    assert.equal(alarm.muted, true);
    assert.ok(app.frames.every(voices => voices.every(active => !active)));
    assert.equal(app.render({ a: target('warning') }).muted, true);
    assert.equal(app.render({ a: target('danger') }).muted, false);
    assert.deepEqual(app.voices, [false, true]);
});

test('rearma por el cambio de un contacto secundario aunque otro siga en rojo', () => {
    const app = harness();
    app.render({ a: target('danger'), b: target('warning') }).toggleMute();
    assert.equal(app.render({ b: target('warning'), a: target('danger') }).muted, true);
    assert.equal(app.render({ a: target('danger'), b: target('danger') }).muted, false);
    assert.deepEqual(app.voices, [false, true]);
});

test('un barco sale sin rearmar a los demas; si vuelve a entrar en la misma zona si rearma', () => {
    const app = harness();
    app.render({ a: target('warning'), b: target('warning') }).toggleMute();
    assert.equal(app.render({ a: target('clear'), b: target('warning') }).muted, true);
    assert.deepEqual(app.voices, [false, false]);
    assert.equal(app.render({ a: target('warning'), b: target('warning') }).muted, false);
    assert.deepEqual(app.voices, [true, false]);
});

test('la salida de avisos conserva el silencio restante y terminar el episodio rearma el siguiente', () => {
    const app = harness();
    let alarm = app.render({ a: target('danger'), b: target('warning') });
    alarm.toggleMute();
    alarm = app.render({ b: target('warning') });
    assert.equal(alarm.muted, true);
    assert.deepEqual(app.voices, [false, false]);
    alarm = app.render({ b: target('clear') });
    assert.equal(alarm.level, null);
    assert.equal(alarm.muted, false);
    alarm = app.render({ c: target('warning') });
    assert.equal(alarm.muted, false);
    assert.deepEqual(app.voices, [true, false]);
});

for (const end of ['unknown', 'disabled']) test(`datos invalidos o avisos desactivados (${end}) apagan y rearman`, () => {
    const app = harness();
    app.render({ a: target('danger') }).toggleMute();
    assert.equal(app.render({ a: target('danger') }).muted, true);
    assert.equal(app.render({ a: target(end) }).level, null);
    assert.equal(app.render({ a: target('danger') }).muted, false);
    assert.deepEqual(app.voices, [false, true]);
});

for (const [name, seconds] of [['ais-warning-alarm', 0.16], ['ais-danger-alarm', 0.65]]) {
    test(`${name}: ciclo de 1 segundo, pitido de ${seconds} s y silencio restante`, () => {
        const wav = readFileSync(new URL(`../assets/sounds/${name}.wav`, import.meta.url));
        assert.equal(wav.toString('ascii', 0, 4), 'RIFF');
        assert.equal(wav.toString('ascii', 8, 12), 'WAVE');
        assert.equal(wav.readUInt16LE(20), 1);
        assert.equal(wav.readUInt16LE(22), 1);
        assert.equal(wav.readUInt16LE(34), 16);
        const sampleRate = wav.readUInt32LE(24);
        const frames = wav.readUInt32LE(40) / 2;
        assert.equal(frames / sampleRate, 1);
        const toneFrames = Math.round(sampleRate * seconds);
        let energy = 0, lastNonZero = 0;
        for (let i = 0; i < frames; i++) {
            const sample = wav.readInt16LE(44 + i * 2);
            if (i >= toneFrames) assert.equal(sample, 0);
            if (sample !== 0) lastNonZero = i;
            energy += sample * sample;
        }
        assert.ok(energy > 0);
        assert.ok(Math.abs(lastNonZero - toneFrames) < 4);
    });
}
