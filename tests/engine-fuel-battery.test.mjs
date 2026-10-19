import test from 'node:test';
import assert from 'node:assert/strict';
import { INITIAL_DATA, SUBSCRIPTION_PATHS } from '../services/signalk/paths.js';
import { readInstrumentDelta } from '../services/signalk/instrumentDeltas.js';
import { deriveNavigationData } from '../features/console/model/navigationData.js';

const readings = data => {
    const { fuelLevelPercent, batteryVoltage } = deriveNavigationData(data);
    return { fuelLevelPercent, batteryVoltage };
};

test('combustible y batería: unidades Signal K, lleno, vacío y cero son lecturas válidas', () => {
    assert.deepEqual(readings(INITIAL_DATA), { fuelLevelPercent: null, batteryVoltage: null });
    assert.deepEqual(readings({ 'tanks.fuel.main.currentLevel': 0.75, 'electrical.batteries.house.voltage': 13.8 }),
        { fuelLevelPercent: 75, batteryVoltage: 13.8 });
    assert.deepEqual(readings({ 'tanks.fuel.main.currentLevel': 0, 'electrical.batteries.house.voltage': 0 }),
        { fuelLevelPercent: 0, batteryVoltage: 0 });
    assert.equal(readings({ 'tanks.fuel.main.currentLevel': 1 }).fuelLevelPercent, 100);
});

test('combustible y batería: rechaza valores inválidos y no confunde otros sensores', () => {
    for (const value of [null, undefined, NaN, Infinity, -1, '0.75']) {
        assert.deepEqual(readings({ 'tanks.fuel.main.currentLevel': value, 'electrical.batteries.house.voltage': value }),
            { fuelLevelPercent: null, batteryVoltage: null });
    }
    assert.equal(readings({ 'tanks.fuel.main.currentLevel': 75 }).fuelLevelPercent, null);
    assert.deepEqual(readings({ 'tanks.freshWater.main.currentLevel': 0.75, 'propulsion.main.alternatorVoltage': 13.8 }),
        { fuelLevelPercent: null, batteryVoltage: null });
    assert.equal(readings({ 'electrical.batteries.house.voltage': 28.5 }).batteryVoltage, 28.5);
});

test('combustible y batería: muestra el menor dato disponible sin promediar depósitos o bancos', () => {
    assert.deepEqual(readings({ 'tanks.fuel.main.currentLevel': 0.75, 'tanks.fuel.reserve.currentLevel': 0.25,
        'electrical.batteries.house.voltage': 13.8, 'electrical.batteries.starter.voltage': 12.6 }),
    { fuelLevelPercent: 25, batteryVoltage: 12.6 });
});

test('combustible y batería: suscribe rutas dinámicas y procesa deltas propios y cancelaciones', () => {
    assert.ok(SUBSCRIPTION_PATHS.includes('tanks.fuel.*.currentLevel'));
    assert.ok(SUBSCRIPTION_PATHS.includes('electrical.batteries.*.voltage'));
    const message = value => ({ context: 'vessels.self', updates: [{ values: [
        { path: 'tanks.fuel.main.currentLevel', value }, { path: 'electrical.batteries.house.voltage', value },
    ] }] });
    let data = { ...INITIAL_DATA, ...readInstrumentDelta(message(0.75)) };
    assert.deepEqual(readings(data), { fuelLevelPercent: 75, batteryVoltage: 0.75 });
    data = { ...data, ...readInstrumentDelta(message(null)) };
    assert.deepEqual(readings(data), { fuelLevelPercent: null, batteryVoltage: null });
    assert.deepEqual(readInstrumentDelta({ ...message(0.75), context: 'vessels.other' }, 'vessels.own'), {});
});
