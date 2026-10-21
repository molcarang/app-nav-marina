import test from 'node:test';
import assert from 'node:assert/strict';
import { INITIAL_DATA, SUBSCRIPTION_PATHS } from '../services/signalk/paths.js';
import { readInstrumentDelta } from '../services/signalk/instrumentDeltas.js';
import { deriveNavigationData } from '../features/console/model/navigationData.js';

const temperature = data => deriveNavigationData(data).engineTemperatureCelsius;

test('temperatura motor: convierte kelvin y distingue cero Celsius de ausencia', () => {
    assert.equal(temperature(INITIAL_DATA), null);
    for (const celsius of [0, 80, 120, -5]) {
        assert.ok(Math.abs(temperature({ 'propulsion.0.temperature': celsius + 273.15 }) - celsius) < 1e-9);
    }
    for (const value of [null, undefined, '353.15', NaN, Infinity, -1]) {
        assert.equal(temperature({ 'propulsion.0.temperature': value }), null);
    }
    assert.equal(temperature({ 'environment.water.temperature': 353.15 }), null);
});

test('temperatura motor: prioriza PGN 127489 por unidad y agrega la mayor lectura', () => {
    assert.equal(temperature({ 'propulsion.main.temperature': 363.15, 'propulsion.main.coolantTemperature': 353.15 }), 90);
    assert.equal(temperature({ 'propulsion.main.temperature': 363.15, 'propulsion.main.coolantTemperature': null }), 90);
    assert.equal(temperature({ 'propulsion.main.temperature': null, 'propulsion.main.coolantTemperature': 353.15 }), 80);
    assert.equal(temperature({ 'propulsion.main.coolantTemperature': 353.15, 'propulsion.port.temperature': 368.15 }), 95);
});

test('temperatura motor: suscribe rutas dinámicas y procesa cancelaciones propias', () => {
    assert.ok(SUBSCRIPTION_PATHS.includes('propulsion.*.coolantTemperature'));
    assert.ok(SUBSCRIPTION_PATHS.includes('propulsion.*.temperature'));
    const message = value => ({ context: 'vessels.self', updates: [{ values: [{ path: 'propulsion.0.temperature', value }] }] });
    let data = { ...INITIAL_DATA, ...readInstrumentDelta(message(358.15)) };
    assert.equal(temperature(data), 85);
    data = { ...data, ...readInstrumentDelta(message(null)) };
    assert.equal(temperature(data), null);
    assert.deepEqual(readInstrumentDelta({ ...message(358.15), context: 'vessels.other' }, 'vessels.own'), {});
});
