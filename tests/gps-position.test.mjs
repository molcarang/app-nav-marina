import test from 'node:test';
import assert from 'node:assert/strict';
import { formatCoordinate, isValidPosition } from '../features/console/model/gpsPosition.js';
import { deriveNavigationData } from '../features/console/model/navigationData.js';
import { INITIAL_DATA, SIGNALK_PATHS } from '../services/signalk/paths.js';

test('la posición se recibe como objeto sin inventar coordenadas iniciales', () => {
    assert.equal(deriveNavigationData(INITIAL_DATA).position, null);
    const position = { latitude: 39.5, longitude: -0.25 };
    assert.deepEqual(deriveNavigationData({ [SIGNALK_PATHS.position]: position }).position, position);
    assert.equal(isValidPosition(position), true);
    assert.equal(isValidPosition({ latitude: 0, longitude: 0 }), true);
    for (const p of [null, {}, { latitude: 91, longitude: 0 }, { latitude: 0, longitude: 181 }, { latitude: '39', longitude: 2 }]) assert.equal(isValidPosition(p), false);
});
test('formato náutico con hemisferios y redondeo de minutos', () => {
    assert.equal(formatCoordinate(39.5, true), '39° 30′ 00.0″ N');
    assert.equal(formatCoordinate(-0.25, false), '0° 15′ 00.0″ W');
    assert.equal(formatCoordinate(-39.5, true), '39° 30′ 00.0″ S');
    assert.equal(formatCoordinate(2.25, false), '2° 15′ 00.0″ E');
    assert.equal(formatCoordinate(39.99999999, true), '40° 00′ 00.0″ N');
    assert.equal(formatCoordinate(39.4699, true), '39° 28′ 11.6″ N');
    assert.equal(formatCoordinate(0, false), '0° 00′ 00.0″ E');
    assert.equal(formatCoordinate(null, true), '—');
});

test('los paths privados del simulador no sustituyen una posición estándar ausente', () => {
    assert.equal(deriveNavigationData({
        'simulation.gps.latitude': 39, 'simulation.gps.longitude': -1,
    }).position, null);
});
