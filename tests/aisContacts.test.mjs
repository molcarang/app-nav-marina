import test from 'node:test';
import assert from 'node:assert/strict';
import { visibleAisContacts } from '../features/console/model/aisContacts.js';

const position = { latitude: 0, longitude: 0 };
const now = 1000000;
const target = (longitude, extra = {}) => ({
    'navigation.position': { latitude: 0, longitude }, positionReceivedAt: now, ...extra,
});

test('ordena contactos por distancia real sin modificar los targets', () => {
    const targets = { far: target(0.05), near: target(0.01), middle: target(0.03) };
    const contacts = visibleAisContacts(targets, position, now, true, 6, now);
    assert.deepEqual(contacts.map(item => item.id), ['near', 'middle', 'far']);
    assert.ok(contacts[0].distanceNm < contacts[1].distanceNm);
    assert.equal(targets.near.distanceNm, undefined);
});

test('solo incluye posiciones validas, recientes y dentro del alcance', () => {
    const targets = {
        valid: target(0.01), far: target(1),
        stale: target(0.02, { positionReceivedAt: now - 300000 }),
        missingTime: target(0.02, { positionReceivedAt: null }),
        invalid: target(200),
    };
    assert.deepEqual(visibleAisContacts(targets, position, now, true, 1, now).map(item => item.id), ['valid']);
    assert.deepEqual(visibleAisContacts(targets, position, now, false, 6, now), []);
    assert.deepEqual(visibleAisContacts(targets, position, now - 30000, true, 6, now), []);
    assert.deepEqual(visibleAisContacts(targets, null, now, true, 6, now), []);
    assert.deepEqual(visibleAisContacts(undefined, position, now, true, 6, now), []);
});

test('mantiene un orden estable cuando dos barcos estan a la misma distancia', () => {
    const contacts = visibleAisContacts({ b: target(0.01), a: target(0.01) }, position, now, true, 6, now);
    assert.deepEqual(contacts.map(item => item.id), ['a', 'b']);
});
