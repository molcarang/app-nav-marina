import test from 'node:test';
import assert from 'node:assert/strict';
import { INITIAL_DATA, SUBSCRIPTION_PATHS } from '../services/signalk/paths.js';
import { readInstrumentDelta } from '../services/signalk/instrumentDeltas.js';
import { deriveNavigationData } from '../features/console/model/navigationData.js';

test('motor: solo las RPM válidas positivas confirman marcha; cero y ausencia son distintos', () => {
    assert.equal(deriveNavigationData(INITIAL_DATA).engineRunning, null);
    for (const rpm of [null, undefined, NaN, Infinity, -1, '20']) {
        assert.equal(deriveNavigationData({ 'propulsion.main.revolutions': rpm }).engineRunning, null);
    }
    assert.equal(deriveNavigationData({ 'propulsion.main.revolutions': 0 }).engineRunning, false);
    const running = deriveNavigationData({ 'propulsion.main.revolutions': 20 });
    assert.equal(running.engineRunning, true);
    assert.equal(running.engineRpm, 1200);
});

test('motor: el estado explícito tiene prioridad sobre las RPM de esa unidad', () => {
    const started = deriveNavigationData({ 'propulsion.main.state': 'started', 'propulsion.main.revolutions': 0 });
    assert.equal(started.engineRunning, true);
    assert.equal(started.navigationMode, 'ENGINE');
    assert.equal(deriveNavigationData({ 'propulsion.main.state': 'stopped', 'propulsion.main.revolutions': 20 }).engineRunning, false);
    assert.equal(deriveNavigationData({ 'propulsion.main.state': 'unusable' }).engineRunning, null);
    assert.equal(deriveNavigationData({ 'propulsion.main.state': 'unknown' }).engineRunning, null);
});

test('motor: basta una unidad en marcha y no se mezclan estados entre motores', () => {
    const base = { ...INITIAL_DATA, 'propulsion.port.state': 'stopped', 'propulsion.port.revolutions': 20 };
    assert.equal(deriveNavigationData(base).engineRunning, false);
    assert.equal(deriveNavigationData({ ...base, 'propulsion.starboard.revolutions': 15 }).engineRunning, true);
    assert.equal(deriveNavigationData({ ...base, 'propulsion.starboard.state': 'started' }).engineRunning, true);
    assert.equal(deriveNavigationData({ ...base, 'propulsion.starboard.state': 'unusable' }).engineRunning, null);
});

test('motor: acepta estados de Signal K del barco propio y sus cancelaciones', () => {
    assert.ok(SUBSCRIPTION_PATHS.includes('propulsion.*.state'));
    const message = value => ({ context: 'vessels.self', updates: [{ values: [{ path: 'propulsion.main.state', value }] }] });
    let data = { ...INITIAL_DATA, ...readInstrumentDelta(message('started')) };
    assert.equal(deriveNavigationData(data).engineRunning, true);
    data = { ...data, ...readInstrumentDelta(message('stopped')) };
    assert.equal(deriveNavigationData(data).engineRunning, false);
    data = { ...data, ...readInstrumentDelta(message(null)) };
    assert.equal(deriveNavigationData(data).engineRunning, null);
    assert.deepEqual(readInstrumentDelta({ ...message('started'), context: 'vessels.other' }, 'vessels.own'), {});
});
