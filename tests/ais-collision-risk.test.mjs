import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateAisCollision, normalizeAisCollisionSettings, stabilizeAisCollision, AIS_COLLISION_DEFAULTS } from '../features/console/model/aisCollisionRisk.js';
import { dataTimestamp } from '../services/signalk/dataTimestamp.js';
import { readInstrumentDelta } from '../services/signalk/instrumentDeltas.js';

const now = 1800000000000;
const metresToDegrees = 180 / Math.PI / 6371000;
const vessel = (east, north, speed, course, extra = {}) => ({
    position: { latitude: north * metresToDegrees, longitude: east * metresToDegrees },
    positionAt: now, speed, speedAt: now, course, courseAt: now, ...extra,
});
const own = vessel(0, 0, 5, 0);
const risk = (target, settings) => calculateAisCollision(own, target, settings, now);

test('CPA/TCPA: encuentro frontal, dos barcos a 5 m/s y 1 NM, encuentro en 185.2 s', () => {
    const result = risk(vessel(0, 1852, 5, Math.PI));
    assert.equal(result.level, 'danger');
    assert.ok(result.cpaNm < 0.000001);
    assert.ok(Math.abs(result.tcpaMinutes * 60 - 185.2) < 0.001);
});

test('CPA/TCPA: cruce perpendicular en cinco minutos', () => {
    const result = risk(vessel(1500, 1500, 5, -Math.PI / 2));
    assert.equal(result.level, 'danger');
    assert.ok(result.cpaNm < 0.00001);
    assert.ok(Math.abs(result.tcpaMinutes - 5) < 0.001);
});

test('naranja exige ambos limites y cambiar el CPA cambia el aviso', () => {
    const target = vessel(0.3 * 1852, 3000, 0, null);
    assert.equal(risk(target).level, 'warning');
    assert.equal(risk(target, { aisWarningCpaNm: 0.25 }).level, 'clear');
    assert.equal(risk(target, { aisWarningTcpaMinutes: 5 }).level, 'clear');
    const distant = risk(vessel(0, 10000, 0, null));
    assert.equal(distant.level, 'clear');
});

test('contacto que ya se aleja no genera un aviso predictivo', () => {
    const result = risk(vessel(0, 300, 10, 0));
    assert.equal(result.level, 'clear');
    assert.equal(result.reason, 'receding');
    assert.ok(result.tcpaMinutes < 0);
});

test('alcance a un barco mas lento: CPA y TCPA relativos', () => {
    const result = risk(vessel(100, 1200, 3, 0));
    assert.equal(result.level, 'warning');
    assert.ok(Math.abs(result.cpaNm - 100 / 1852) < 0.000001);
    assert.ok(Math.abs(result.tcpaMinutes - 10) < 0.001);
});

test('barcos parados: proximidad actual, sin dividir por cero ni exigir COG', () => {
    for (const [distance, expected] of [[100, 'danger'], [600, 'warning'], [1500, 'clear']]) {
        const result = calculateAisCollision(vessel(0, 0, 0, null), vessel(distance, 0, 0, null), {}, now);
        assert.equal(result.level, expected);
        assert.equal(result.tcpaMinutes, null);
        assert.equal(result.reason, 'proximity');
    }
});

test('rumbo de proa no sustituye el COG y ausencia de velocidad no significa barco parado', () => {
    assert.equal(risk(vessel(0, 1500, 5, null)).level, 'unknown');
    assert.equal(risk(vessel(0, 1500, null, 0)).level, 'unknown');
    assert.equal(risk(vessel(0, 1500, -1, 0)).level, 'unknown');
    assert.equal(risk(vessel(0, 1500, 100, 0)).level, 'unknown');
});

test('cada dato tiene caducidad propia; una posicion nueva no refresca COG ni SOG', () => {
    for (const key of ['positionAt', 'speedAt', 'courseAt']) {
        assert.equal(risk(vessel(0, 1500, 5, Math.PI, { [key]: now - 90000 })).level, 'unknown');
        assert.equal(risk(vessel(0, 1500, 5, Math.PI, { [key]: null })).level, 'unknown');
        assert.equal(risk(vessel(0, 1500, 5, Math.PI, { [key]: now + 6000 })).level, 'unknown');
        const staleOwn = { ...own, [key]: now - 30000 };
        assert.equal(calculateAisCollision(staleOwn, vessel(0, 1500, 5, Math.PI), {}, now).level, 'unknown');
    }
});

test('posiciones de distinta antiguedad se llevan al instante actual', () => {
    const before = risk(vessel(0, 1852, 5, Math.PI, { positionAt: now - 10000 }));
    assert.ok(Math.abs(before.tcpaMinutes * 60 - 180.2) < 0.001);
});

test('no depende del zoom: un contacto mas alla de seis NM puede activar aviso', () => {
    const result = risk(vessel(0, 7 * 1852, 15, Math.PI));
    assert.equal(result.level, 'warning');
    assert.ok(result.distanceNm > 6);
});

test('no se calculan trayectorias polares o fuera del dominio local', () => {
    assert.equal(risk(vessel(0, 25 * 1852, 5, Math.PI)).level, 'unknown');
    assert.equal(calculateAisCollision({ ...own, position: { latitude: 89, longitude: 0 } },
        { ...own, position: { latitude: 89.01, longitude: 0 } }, {}, now).level, 'unknown');
});

test('cruce del meridiano 180 no produce una distancia alrededor del mundo', () => {
    const a = { ...vessel(0, 0, 0, null), position: { latitude: 0, longitude: 179.999 } };
    const b = { ...vessel(0, 0, 0, null), position: { latitude: 0, longitude: -179.999 } };
    const result = calculateAisCollision(a, b, {}, now);
    assert.equal(result.level, 'danger');
    assert.ok(result.distanceNm < 0.13);
});

test('desactivar avisos no presenta una prediccion como valida', () => {
    const result = risk(vessel(0, 1852, 5, Math.PI), { aisCollisionEnabled: false });
    assert.equal(result.level, 'disabled');
    assert.equal(result.cpaNm, null);
});

test('ajustes se restauran y rojo nunca supera los limites naranja', () => {
    assert.deepEqual(normalizeAisCollisionSettings(), AIS_COLLISION_DEFAULTS);
    assert.deepEqual(normalizeAisCollisionSettings({ aisWarningCpaNm: NaN, aisDangerTcpaMinutes: Infinity }), AIS_COLLISION_DEFAULTS);
    const limits = normalizeAisCollisionSettings({ aisWarningCpaNm: 0.1, aisWarningTcpaMinutes: 2, aisDangerCpaNm: 1, aisDangerTcpaMinutes: 15 });
    assert.equal(limits.aisDangerCpaNm, 0.1);
    assert.equal(limits.aisDangerTcpaMinutes, 2);
});

test('histeresis: sube inmediatamente, baja tras ocho segundos, dato caducado pasa a gris inmediatamente', () => {
    const danger = { level: 'danger', cpaNm: 0.1, tcpaMinutes: 2 };
    const clear = { level: 'clear', cpaNm: 1, tcpaMinutes: 20 };
    let state = stabilizeAisCollision(null, danger, now);
    state = stabilizeAisCollision(state, clear, now + 1000);
    assert.equal(state.level, 'danger');
    state = stabilizeAisCollision(state, clear, now + 8999);
    assert.equal(state.level, 'danger');
    state = stabilizeAisCollision(state, clear, now + 9000);
    assert.equal(state.level, 'clear');
    state = stabilizeAisCollision(state, danger, now + 9500);
    assert.equal(state.level, 'danger');
    assert.equal(stabilizeAisCollision(state, { level: 'unknown' }, now + 9600).level, 'unknown');
    assert.equal(stabilizeAisCollision(state, { level: 'disabled' }, now + 9600).level, 'disabled');
});

test('las marcas de tiempo conservan la antiguedad original e invalidan tiempos malformados', () => {
    assert.equal(dataTimestamp({}, now), now);
    assert.equal(dataTimestamp({ timestamp: new Date(now - 120000).toISOString() }, now), now - 120000);
    assert.equal(dataTimestamp({ timestamp: 'bad' }, now), null);
    assert.equal(dataTimestamp({ timestamp: new Date(now + 10000).toISOString() }, now), null);
    const delta = readInstrumentDelta({ context: 'vessels.self', updates: [{ timestamp: new Date(now - 60000).toISOString(), values: [
        { path: 'navigation.position', value: { latitude: 0, longitude: 0 } },
        { path: 'navigation.speedOverGround', value: 3 },
        { path: 'navigation.courseOverGroundTrue', value: 1 },
    ] }] }, undefined, now);
    assert.equal(delta.collisionPositionReceivedAt, now - 60000);
    assert.equal(delta.speedReceivedAt, now - 60000);
    assert.equal(delta.courseReceivedAt, now - 60000);
});
