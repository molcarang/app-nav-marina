import test from 'node:test';
import assert from 'node:assert/strict';
import { INITIAL_DATA, SUBSCRIPTION_PATHS, isInstrumentPath } from '../services/signalk/paths.js';
import { readInstrumentDelta } from '../services/signalk/instrumentDeltas.js';
import { deriveNavigationData } from '../features/console/model/navigationData.js';

const path = 'notifications.propulsion.0.lowSystemVoltage';
const alarm = data => deriveNavigationData(data).lowBatteryAlarm;

test('batería baja: distingue alarma recibida, normal y ausencia sin inventar umbrales', () => {
    assert.equal(alarm(INITIAL_DATA), null);
    for (const state of ['alert', 'warn', 'alarm', 'emergency']) assert.equal(alarm({ [path]: { state } }), true);
    for (const state of ['normal', 'nominal']) assert.equal(alarm({ [path]: { state } }), false);
    for (const value of [null, true, 12, 'alarm', { state: 'unknown' }]) assert.equal(alarm({ [path]: value }), null);
    assert.equal(alarm({ 'electrical.batteries.house.voltage': 9, 'electrical.batteries.house.capacity.stateOfCharge': 0.01 }), null);
    assert.equal(alarm({ 'notifications.electrical.batteries.house.voltage': { state: 'alarm' } }), null);
    assert.equal(alarm({ 'notifications.propulsion.main.chargeIndicator': { state: 'alarm' } }), null);
});

test('batería baja: agrega avisos de baja tensión de varios motores', () => {
    const other = 'notifications.propulsion.port.lowSystemVoltage';
    const base = { [path]: { state: 'normal' }, [other]: { state: 'alarm' } };
    assert.equal(alarm(base), true);
    assert.equal(alarm({ ...base, [other]: null }), null);
    assert.equal(alarm({ ...base, [other]: { state: 'normal' } }), false);
});

test('batería baja: descarta las dos rutas retiradas aunque publiquen alarmas', () => {
    for (const suffix of ['lowVoltage', 'lowStateOfCharge']) {
        const retiredPath = `notifications.electrical.batteries.house.${suffix}`;
        assert.equal(isInstrumentPath(retiredPath), false);
        assert.ok(!SUBSCRIPTION_PATHS.includes(`notifications.electrical.batteries.*.${suffix}`));
        const delta = readInstrumentDelta({ context: 'vessels.self', updates: [{ values: [
            { path: retiredPath, value: { state: 'alarm' } },
        ] }] });
        assert.deepEqual(delta, {});
        assert.equal(alarm({ [retiredPath]: { state: 'alarm' } }), null);
        assert.equal(alarm({ [path]: { state: 'normal' }, [retiredPath]: { state: 'alarm' } }), false);
    }
});

test('batería baja: procesa deltas propios, cancelación y restablecimiento sin confundir otros barcos', () => {
    assert.ok(SUBSCRIPTION_PATHS.includes('notifications.propulsion.*.lowSystemVoltage'));
    const message = value => ({ context: 'vessels.self', updates: [{ values: [{ path, value }] }] });
    let data = { ...INITIAL_DATA, ...readInstrumentDelta(message({ state: 'alarm', method: ['visual'], message: 'Low battery' })) };
    assert.equal(alarm(data), true);
    data = { ...data, ...readInstrumentDelta(message({ state: 'normal' })) };
    assert.equal(alarm(data), false);
    data = { ...data, ...readInstrumentDelta(message(null)) };
    assert.equal(alarm(data), null);
    assert.deepEqual(readInstrumentDelta({ ...message({ state: 'alarm' }), context: 'vessels.other' }, 'vessels.own'), {});
    assert.equal(alarm(INITIAL_DATA), null);
});
