import test from 'node:test';
import assert from 'node:assert/strict';
import { INITIAL_DATA, SUBSCRIPTION_PATHS } from '../services/signalk/paths.js';
import { readInstrumentDelta } from '../services/signalk/instrumentDeltas.js';
import { deriveNavigationData } from '../features/console/model/navigationData.js';

const path = 'notifications.propulsion.main.overTemperature';
const alarm = data => deriveNavigationData(data).waterTemperatureAlarm;

test('temperatura del motor: alarma recibida, normal y ausencia de datos son distintos', () => {
    assert.equal(alarm(INITIAL_DATA), null);
    for (const state of ['alert', 'warn', 'alarm', 'emergency']) assert.equal(alarm({ [path]: { state } }), true);
    for (const state of ['normal', 'nominal']) assert.equal(alarm({ [path]: { state } }), false);
    for (const value of [null, true, 95, 'alarm', { state: 'unknown' }]) assert.equal(alarm({ [path]: value }), null);
    assert.equal(alarm({ 'environment.water.temperature': 400, 'propulsion.main.coolantTemperature': 400 }), null);
});

test('temperatura del motor: basta una alarma activa entre varios motores o fuentes', () => {
    const base = { [path]: { state: 'normal' }, 'notifications.propulsion.port.coolantTemperature': { state: 'alarm' } };
    assert.equal(alarm(base), true);
    assert.equal(alarm({ ...base, 'notifications.propulsion.port.coolantTemperature': null }), null);
    assert.equal(alarm({ ...base, 'notifications.propulsion.port.coolantTemperature': { state: 'normal' } }), false);
    assert.equal(alarm({ 'notifications.propulsion.main.oilTemperature': { state: 'alarm' } }), null);
});

test('temperatura del motor: acepta deltas propios, cambios de estado y cancelación', () => {
    assert.ok(SUBSCRIPTION_PATHS.includes('notifications.propulsion.*.overTemperature'));
    const message = value => ({ context: 'vessels.self', updates: [{ values: [{ path, value }] }] });
    let data = { ...INITIAL_DATA, ...readInstrumentDelta(message({ state: 'alarm', method: ['visual'], message: 'Hot engine' })) };
    assert.equal(alarm(data), true);
    data = { ...data, ...readInstrumentDelta(message({ state: 'normal' })) };
    assert.equal(alarm(data), false);
    data = { ...data, ...readInstrumentDelta(message(null)) };
    assert.equal(alarm(data), null);
    assert.deepEqual(readInstrumentDelta({ ...message({ state: 'alarm' }), context: 'vessels.other' }, 'vessels.own'), {});
    assert.equal(alarm(INITIAL_DATA), null);
});
