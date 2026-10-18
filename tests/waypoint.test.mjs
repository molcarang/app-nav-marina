import test from 'node:test';
import assert from 'node:assert/strict';
import { mergeWaypointDelta, mergeWaypointSnapshot, deriveWaypoint, WAYPOINT_BRANCHES } from '../services/signalk/waypointData.js';
const [rhumb, great] = WAYPOINT_BRANCHES;
const position = { latitude: 28.85, longitude: -13.8 };
function message(branch, fields, time = 100000) {
    return { context: 'vessels.self', updates: [{ timestamp: new Date(time).toISOString(),
        values: Object.entries(fields).map(([path, value]) => ({ path: `${branch}.${path}`, value })) }] };
}
const merge = (state, branch, fields, time = 100000) => mergeWaypointDelta(state, message(branch, fields, time), undefined, time);

test('reconexión recupera destino retenido con métricas recientes sin refrescar datos caducados', () => {
    const snapshot = { nextPoint: {
        position: { value: position, timestamp: new Date(1000).toISOString() },
        distance: { value: 1852, timestamp: new Date(100000).toISOString() },
    } };
    const state = mergeWaypointSnapshot({}, rhumb, snapshot);
    assert.equal(deriveWaypoint(state, true, null, 100000).distanceNm, 1);
    const retained = deriveWaypoint(state, true, null, 140000);
    assert.deepEqual(retained.position, position);
    assert.equal(retained.distanceNm, null);
    const cancelled = merge({}, rhumb, { 'nextPoint.position': null }, 100000);
    assert.equal(mergeWaypointSnapshot(cancelled, rhumb, snapshot), cancelled);
});

test('normaliza ambas familias y convierte metros a millas y VMG a tiempo', () => {
    for (const branch of WAYPOINT_BRANCHES) {
        const state = merge({}, branch, { 'nextPoint.position': position, 'nextPoint.ID': '002',
            'nextPoint.distance': 1852, 'nextPoint.velocityMadeGood': 1852 / 600,
            'nextPoint.bearingTrue': Math.PI / 2, crossTrackError: -185.2 });
        const wp = deriveWaypoint(state, true, null, 100000);
        assert.equal(wp.name, '002');
        assert.equal(wp.distanceNm, 1);
        assert.equal(wp.timeMinutes, 10);
        assert.equal(wp.bearingDeg, 90);
        assert.ok(Math.abs(wp.crossTrackNm + 0.1) < 1e-10);
    }
});

test('cancelar o desconectar oculta el destino sin resucitar otra familia', () => {
    let state = merge({}, great, { 'nextPoint.position': position }, 99000);
    state = merge(state, rhumb, { 'nextPoint.position': position });
    assert.equal(deriveWaypoint(state, false, null, 100000), null);
    assert.deepEqual(deriveWaypoint(state, true, null, 130001).position, position);
    state = merge(state, rhumb, { nextPoint: null }, 101000);
    assert.equal(deriveWaypoint(state, true, null, 101000), null);
    state = merge(state, rhumb, { 'nextPoint.distance': 5 }, 102000);
    assert.equal(deriveWaypoint(state, true, null, 102000), null);
});

test('nuevo destino descarta métricas del anterior y espera los nuevos datos', () => {
    let state = merge({}, rhumb, { 'nextPoint.position': position, 'nextPoint.ID': 'old',
        'nextPoint.distance': 1852, crossTrackError: 80 });
    state = merge(state, rhumb, { 'nextPoint.position': { latitude: 29, longitude: -14 } }, 101000);
    const wp = deriveWaypoint(state, true, null, 101000);
    assert.equal(wp.name, null);
    assert.equal(wp.distanceNm, null);
    assert.equal(wp.crossTrackNm, null);
});

test('sin VMG positiva no inventa tiempo; cálculo geográfico de respaldo', () => {
    const state = merge({}, great, { 'nextPoint.position': { latitude: 0, longitude: 1 },
        'nextPoint.velocityMadeGood': -2 });
    const wp = deriveWaypoint(state, true, { latitude: 0, longitude: 0 }, 100000);
    assert.ok(wp.distanceNm > 60 && wp.distanceNm < 61);
    assert.equal(wp.bearingDeg, 90);
    assert.equal(wp.timeMinutes, null);
    assert.equal(wp.crossTrackNm, null);
});

test('ignora otros barcos, mensajes atrasados y posiciones inválidas', () => {
    const data = message(rhumb, { 'nextPoint.position': position });
    assert.deepEqual(mergeWaypointDelta({}, { ...data, context: 'vessels.other' }, 'vessels.own', 100000), {});
    assert.deepEqual(mergeWaypointDelta({}, data, undefined, 140000), {});
    const state = merge({}, rhumb, { 'nextPoint.position': { latitude: 91, longitude: 0 } });
    assert.equal(deriveWaypoint(state, true, null, 100000), null);
});

test('no mezcla métricas entre familias y acepta destino directo sin ruta', () => {
    let state = merge({}, great, { 'nextPoint.position': position, 'nextPoint.distance': 100 }, 99000);
    state = merge(state, rhumb, { nextPoint: { position, name: 'Port' }, 'activeRoute.href': null });
    const wp = deriveWaypoint(state, true, null, 100000);
    assert.equal(wp.name, 'Port');
    assert.equal(wp.distanceNm, null);
});

test('conserva el destino y el nombre sin nuevas publicaciones y caduca solo las metricas', () => {
    const state = merge({}, rhumb, { 'nextPoint.position': position, 'nextPoint.name': 'Puerto',
        'nextPoint.distance': 1852, 'nextPoint.velocityMadeGood': 3, crossTrackError: 20 });
    const wp = deriveWaypoint(state, true, { latitude: 28, longitude: -13 }, 700000);
    assert.deepEqual(wp.position, position);
    assert.equal(wp.name, 'Puerto');
    assert.ok(wp.distanceNm > 0);
    assert.ok(Number.isFinite(wp.bearingDeg));
    assert.equal(wp.timeMinutes, null);
    assert.equal(wp.crossTrackNm, null);
});

test('una rama que solo publica metricas no oculta el destino activo', () => {
    let state = merge({}, rhumb, { 'nextPoint.position': position, 'nextPoint.name': 'Puerto' });
    state = merge(state, great, { 'nextPoint.distance': 100, crossTrackError: 20 }, 105000);
    const wp = deriveWaypoint(state, true, null, 105000);
    assert.equal(wp.branch, rhumb);
    assert.equal(wp.name, 'Puerto');
    assert.equal(wp.distanceNm, null);
    assert.equal(wp.crossTrackNm, null);
});

test('metricas posteriores de otra rama no resucitan un destino cancelado', () => {
    let state = merge({}, great, { 'nextPoint.position': position }, 99000);
    state = merge(state, rhumb, { 'nextPoint.position': position });
    state = merge(state, rhumb, { 'nextPoint.position': null }, 101000);
    state = merge(state, great, { 'nextPoint.distance': 100 }, 102000);
    assert.equal(deriveWaypoint(state, true, null, 102000), null);
    assert.equal(deriveWaypoint(state, true, null, 700000), null);
    state = merge(state, great, { 'nextPoint.position': position }, 103000);
    assert.deepEqual(deriveWaypoint(state, true, null, 103000).position, position);
});
