import test from 'node:test';
import assert from 'node:assert/strict';
import { INITIAL_DATA, SUBSCRIPTION_PATHS } from '../services/signalk/paths.js';
import { readInstrumentDelta } from '../services/signalk/instrumentDeltas.js';
import { deriveNavigationData } from '../features/console/model/navigationData.js';

const pressure = data => deriveNavigationData(data).engineOilPressureBar;

test('presión de aceite: convierte Pa a bar y conserva cero sin inventar lecturas', () => {
    assert.equal(pressure(INITIAL_DATA), null);
    for (const bar of [0, 1.5, 4.2, 10, 12]) assert.equal(pressure({ 'propulsion.main.oilPressure': bar * 100000 }), bar);
    for (const value of [null, undefined, '420000', NaN, Infinity, -1]) {
        assert.equal(pressure({ 'propulsion.main.oilPressure': value }), null);
    }
    assert.equal(pressure({ 'propulsion.main.fuel.pressure': 420000 }), null);
    assert.equal(pressure({ 'notifications.propulsion.main.lowOilPressure': { state: 'alarm' } }), null);
});

test('presión de aceite: agrega la menor lectura válida entre motores', () => {
    const base = { 'propulsion.main.oilPressure': 420000, 'propulsion.port.oilPressure': 150000 };
    assert.equal(pressure(base), 1.5);
    assert.equal(pressure({ ...base, 'propulsion.port.oilPressure': 0 }), 0);
    assert.equal(pressure({ ...base, 'propulsion.port.oilPressure': null }), 4.2);
});

test('presión de aceite: suscribe cualquier motor y admite cancelaciones propias', () => {
    assert.ok(SUBSCRIPTION_PATHS.includes('propulsion.*.oilPressure'));
    const message = value => ({ context: 'vessels.self', updates: [{ values: [{ path: 'propulsion.main.oilPressure', value }] }] });
    let data = { ...INITIAL_DATA, ...readInstrumentDelta(message(420000)) };
    assert.equal(pressure(data), 4.2);
    data = { ...data, ...readInstrumentDelta(message(null)) };
    assert.equal(pressure(data), null);
    assert.deepEqual(readInstrumentDelta({ ...message(420000), context: 'vessels.other' }, 'vessels.own'), {});
});
