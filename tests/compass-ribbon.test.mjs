import test from 'node:test';
import assert from 'node:assert/strict';
import { cardinalHeading, compassTicks, normalizeHeading } from '../components/gauges/shared/compassRibbon.js';

test('normaliza rumbos y puntos cardinales al cruzar el norte', () => {
    assert.equal(normalizeHeading(-1), 359);
    assert.equal(normalizeHeading(360), 0);
    assert.equal(cardinalHeading(324), 'NW');
    assert.equal(cardinalHeading(359), 'N');
    assert.equal(cardinalHeading(90), 'E');
});
test('la cinta mantiene el norte continuo y el rumbo bajo el centro', () => {
    const before = compassTicks(359).find(tick => tick.angle === 0);
    const after = compassTicks(1).find(tick => tick.angle === 0);
    assert.ok(Math.abs(before.x - after.x) < 5);
    assert.equal(compassTicks(90).find(tick => tick.angle === 90).x, 160);
    assert.equal(new Set(compassTicks(0).map(tick => tick.angle)).size, compassTicks(0).length);
});
