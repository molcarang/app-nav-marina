import test from 'node:test';
import assert from 'node:assert/strict';
import { suggestedAisRange, advanceAisRange } from '../components/gauges/shared/aisAutoRange.js';

const now = 1000000;
const position = { latitude: 0, longitude: 0 };
const target = distance => ({ positionReceivedAt: now, 'navigation.position': {
    latitude: distance * 1852 / 6371000 * 180 / Math.PI, longitude: 0,
} });
const data = { position, positionReceivedAt: now, connected: true, targets: {} };

test('elige el contacto más cercano con margen del 25 por ciento', () => {
    assert.equal(suggestedAisRange({ ...data, targets: { a: target(0.2), b: target(3) } }, now), 0.3);
    assert.equal(suggestedAisRange({ ...data, targets: { a: target(0.28) } }, now), 0.75);
    assert.equal(suggestedAisRange({ ...data, targets: { a: target(1) } }, now), 1.5);
});
test('sin contactos válidos o conexión vuelve a seis millas', () => {
    assert.equal(suggestedAisRange(data, now), 6);
    assert.equal(suggestedAisRange({ ...data, connected: false, targets: { a: target(0.1) } }, now), 6);
    assert.equal(suggestedAisRange({ ...data, targets: { a: { ...target(0.1), positionReceivedAt: now - 300000 } } }, now), 6);
    assert.equal(suggestedAisRange({ ...data, targets: { a: target(0.1) } }, now + 30000), 6);
});
test('acerca tras ocho segundos estables y aleja inmediatamente', () => {
    const start = { range: 6, candidate: null, since: 0 };
    const waiting = advanceAisRange(start, 0.3, now);
    assert.equal(advanceAisRange(waiting, 0.3, now + 7999).range, 6);
    const close = advanceAisRange(waiting, 0.3, now + 8000);
    assert.equal(close.range, 0.3);
    assert.equal(advanceAisRange(close, 0.75, now + 8001).range, 0.75);
    const changed = advanceAisRange(waiting, 0.75, now + 7000);
    assert.equal(advanceAisRange(changed, 0.75, now + 8000).range, 6);
});
