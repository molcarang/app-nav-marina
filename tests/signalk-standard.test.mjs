import test from 'node:test';
import assert from 'node:assert/strict';
import { INITIAL_DATA, SUBSCRIPTION_PATHS } from '../services/signalk/paths.js';
import { readInstrumentDelta } from '../services/signalk/instrumentDeltas.js';
import { deriveNavigationData } from '../features/console/model/navigationData.js';

const delta = values => ({ context: 'vessels.self', updates: [{ values }] });
const read = values => readInstrumentDelta(delta(values), undefined, 1234);

test('delta estándar: GPS, profundidad, objetos de escora y corriente, motor con nombre', () => {
    const data = read([
        { path: 'navigation.position', value: { latitude: 28, longitude: -13 } },
        { path: 'environment.depth.belowTransducer', value: 2.5 },
        { path: 'navigation.attitude', value: { roll: Math.PI / 18, pitch: 0 } },
        { path: 'environment.current', value: { drift: 1, setTrue: Math.PI / 2 } },
        { path: 'propulsion.port.revolutions', value: 15 },
        { path: 'navigation.headingTrue', value: Math.PI / 4 },
        { path: 'navigation.courseOverGroundTrue', value: Math.PI / 2 },
    ]);
    const result = deriveNavigationData({ ...INITIAL_DATA, ...data });
    assert.deepEqual(result.position, { latitude: 28, longitude: -13 });
    assert.equal(result.positionReceivedAt, 1234);
    assert.equal(result.depthMeters, 2.5);
    assert.ok(Math.abs(result.vesselHeelDeg - 10) < 0.001);
    assert.ok(Math.abs(result.setDeg - 90) < 0.001);
    assert.equal(result.driftKnots, 1.94384);
    assert.equal(result.engineRpm, 900);
    assert.equal(result.navigationMode, 'ENGINE');
    assert.equal(result.headingDigital, '45.0');
    assert.equal(result.cogDigital, '90.0');
});

test('actualizaciones parciales y null invalidan los valores anteriores', () => {
    let data = read([{ path: 'navigation.attitude', value: { roll: 0.2 } }]);
    data = { ...data, ...read([{ path: 'navigation.attitude.roll', value: -0.1 }]) };
    assert.ok(deriveNavigationData(data).vesselHeelDeg < 0);
    data = { ...data, ...read([{ path: 'navigation.attitude', value: null }]) };
    assert.equal(deriveNavigationData(data).vesselHeelDeg, null);
});

test('convierte magnético solo con variación y no lo sustituye por COG', () => {
    const base = { 'navigation.headingMagnetic': Math.PI / 2, 'navigation.courseOverGroundTrue': 0 };
    assert.equal(deriveNavigationData(base).headingDeg, null);
    assert.ok(Math.abs(deriveNavigationData({ ...base, 'navigation.magneticVariation': -Math.PI / 18 }).headingDeg - 80) < 0.001);
    assert.equal(deriveNavigationData({ ...base, 'navigation.headingTrue': 0 }).headingDeg, 0);
});

test('cero válido, ausencia e instrumentos inválidos son diferentes', () => {
    const empty = deriveNavigationData(INITIAL_DATA);
    assert.equal(empty.depthMeters, null);
    assert.equal(empty.rudderAngle, null);
    assert.equal(empty.vesselHeelDeg, null);
    assert.equal(empty.navigationMode, null);
    assert.equal(empty.apState, null);
    assert.equal(deriveNavigationData({ 'propulsion.main.revolutions': 0 }).navigationMode, 'SAIL');
    assert.equal(deriveNavigationData({ 'environment.depth.belowTransducer': 0 }).depthMeters, 0);
    assert.equal(deriveNavigationData({ 'environment.depth.belowTransducer': '3' }).depthMeters, null);
});

test('solo admite instrumentos estándar del barco propio', () => {
    assert.ok(SUBSCRIPTION_PATHS.includes('propulsion.*.revolutions'));
    assert.ok(!SUBSCRIPTION_PATHS.some(path => path.startsWith('simulation.')));
    assert.deepEqual(read([{ path: 'navigation.depthBelowTransducer', value: 8 }]), {});
    assert.deepEqual(readInstrumentDelta({ ...delta([{ path: 'navigation.position', value: {} }]), context: 'vessels.other' }, 'vessels.myboat'), {});
});
