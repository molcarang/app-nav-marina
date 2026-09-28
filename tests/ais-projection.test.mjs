import test from 'node:test';
import assert from 'node:assert/strict';
import { projectAisPosition } from '../components/gauges/shared/aisProjection.js';
import { AIS_RANGES_NM, normalizeAisRange } from '../components/gauges/shared/aisRange.js';

test('el zoom amplía la posición sin cambiar la distancia real y filtra por alcance', () => {
    const own = { latitude: 0, longitude: 0 };
    const target = { latitude: 0.2 * 1852 / 6371000 * 180 / Math.PI, longitude: 0 };
    const wide = projectAisPosition(own, target, 0, 120, 6);
    const port = projectAisPosition(own, target, 0, 120, 0.3);
    assert.ok(Math.abs(port.y + 80) < 1e-8);
    assert.ok(Math.abs(port.y / wide.y - 20) < 1e-8);
    assert.equal(port.distanceNm, wide.distanceNm);
    const farther = { latitude: target.latitude * 2, longitude: 0 };
    assert.equal(projectAisPosition(own, farther, 0, 120, 0.3), null);
    assert.ok(projectAisPosition(own, farther, 0, 120, 0.75));
});

test('restaura los cuatro alcances y rechaza preferencias inválidas', () => {
    for (const range of AIS_RANGES_NM) assert.equal(normalizeAisRange(range), range);
    for (const range of [undefined, null, 0, -1, '0.3', 999]) assert.equal(normalizeAisRange(range), 6);
    assert.equal(projectAisPosition({ latitude: 0, longitude: 0 }, { latitude: 0, longitude: 0 }, 0, 120, 0), null);
});

test('sitúa dos millas al norte en el primer anillo y gira con la proa', () => {
    const own = { latitude: 0, longitude: 0 };
    const target = { latitude: 2 * 1852 / 6371000 * 180 / Math.PI, longitude: 0 };
    const north = projectAisPosition(own, target, 0, 120);
    assert.ok(Math.abs(north.y + 40) < 1e-8);
    assert.ok(Math.abs(north.x) < 1e-8);
    const east = projectAisPosition(own, target, 90, 120);
    assert.ok(Math.abs(east.x + 40) < 1e-8);
    assert.ok(Math.abs(east.y) < 1e-8);
});
test('descarta posiciones inválidas y barcos fuera de seis millas', () => {
    const own = { latitude: 0, longitude: 0 };
    assert.equal(projectAisPosition(own, { latitude: 1, longitude: 0 }, 0, 120), null);
    assert.equal(projectAisPosition(null, own, 0, 120), null);
    assert.equal(projectAisPosition(own, { latitude: '0', longitude: 0 }, 0, 120), null);
    assert.equal(projectAisPosition(own, own, 0, 120).distanceNm, 0);
});
test('calcula la distancia al cruzar el meridiano 180', () => {
    const result = projectAisPosition({ latitude: 0, longitude: 179.99 }, { latitude: 0, longitude: -179.99 }, 0, 120);
    assert.ok(result.x > 0 && result.distanceNm < 2);
});
