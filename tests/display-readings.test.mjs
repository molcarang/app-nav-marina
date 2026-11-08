import test from 'node:test';
import assert from 'node:assert/strict';
import { createDisplayReadings, normalizeDisplayRefreshSeconds } from '../features/console/model/displayReadings.js';
import { DEFAULT_SETTINGS } from '../features/console/model/settings.js';

const reading = (speed, overrides = {}) => ({ twsKnots: String(speed), sogKnots: '4.0',
    twa: 30, awa: 20, cogDeg: 270, depthMeters: 12,
    trueWindDirectionDeg: 300, apparentWindDirectionDeg: 290, ...overrides });

test('intervalo visual: ajustes antiguos o inválidos usan 2 s y se admite tiempo real', () => {
    assert.equal(DEFAULT_SETTINGS.displayRefreshSeconds, 2);
    for (const value of [undefined, null, '3', NaN, Infinity, -1, 6]) {
        assert.equal(normalizeDisplayRefreshSeconds(value), 2);
    }
    for (const value of [0, 1, 2, 3, 4, 5]) assert.equal(normalizeDisplayRefreshSeconds(value), value);
});

test('flujo continuo: primera lectura inmediata, luego la última cada 2 s sin esperar a que paren los datos', t => {
    t.mock.timers.enable({ apis: ['setInterval'] });
    const shown = [];
    const sampler = createDisplayReadings(value => shown.push(value), 2);
    t.after(() => sampler.dispose());
    sampler.push(reading(1));
    for (let i = 2; i <= 20; i++) { t.mock.timers.tick(100); sampler.push(reading(i)); }
    assert.deepEqual(shown.map(value => value.twsKnots), ['1']);
    t.mock.timers.tick(100);
    assert.deepEqual(shown.map(value => value.twsKnots), ['1', '20']);
    sampler.push(reading(25));
    t.mock.timers.tick(1999);
    assert.equal(shown.length, 2);
    t.mock.timers.tick(1);
    assert.deepEqual(shown.map(value => value.twsKnots), ['1', '20', '25']);
});

test('dato ausente y recuperado se muestran inmediatamente, sin conservar una lectura antigua', t => {
    t.mock.timers.enable({ apis: ['setInterval'] });
    const shown = [];
    const sampler = createDisplayReadings(value => shown.push(value), 5);
    t.after(() => sampler.dispose());
    sampler.push(reading(10));
    sampler.push(reading('—', { awa: null, apparentWindDirectionDeg: null }));
    assert.equal(shown.at(-1).twsKnots, '—');
    assert.equal(shown.at(-1).awa, null);
    sampler.push(reading(0, { awa: 0, apparentWindDirectionDeg: 0 }));
    assert.equal(shown.at(-1).twsKnots, '0');
    assert.equal(shown.at(-1).awa, 0);
});

test('ángulo, costado y dirección norte se publican juntos sin modificar los datos originales', t => {
    t.mock.timers.enable({ apis: ['setInterval'] });
    const shown = [];
    const sampler = createDisplayReadings(value => shown.push(value), 2);
    t.after(() => sampler.dispose());
    const first = Object.freeze(reading(12, { awa: 25, awaDigital: 'AWA (S)', apparentWindDirectionDeg: 115 }));
    const next = Object.freeze(reading(15, { awa: -40, awaDigital: 'AWA (P)', apparentWindDirectionDeg: 50 }));
    sampler.push(first);
    sampler.push(next);
    assert.equal(shown.at(-1), first);
    assert.equal(next.awa, -40);
    t.mock.timers.tick(2000);
    assert.equal(shown.at(-1), next);
});

test('tiempo real publica cada lectura y desmontar cancela todas las publicaciones pendientes', t => {
    t.mock.timers.enable({ apis: ['setInterval'] });
    const shown = [];
    const sampler = createDisplayReadings(value => shown.push(value), 0);
    sampler.push(reading(1));
    sampler.push(reading(2));
    assert.equal(shown.length, 2);
    sampler.dispose();
    sampler.push(reading(3));
    const delayed = createDisplayReadings(value => shown.push(value), 2);
    delayed.push(reading(4));
    delayed.push(reading(5));
    delayed.dispose();
    t.mock.timers.tick(10000);
    assert.deepEqual(shown.map(value => value.twsKnots), ['1', '2', '4']);
});
