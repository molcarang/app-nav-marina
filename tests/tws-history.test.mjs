import test from 'node:test';
import assert from 'node:assert/strict';
import { appendHistory, appendWindReading, getHistoryExtrema, pruneHistory, HISTORY_WINDOW_MS, normalizeHistoryHours, historyWindowMs } from '../features/console/model/twsHistory.js';
import { getHistoryChart } from '../components/charts/historyPath.js';

test('retiene dos horas y registra valores constantes cada cinco segundos', () => {
    let samples = [];
    for (let time = 0; time <= HISTORY_WINDOW_MS + 10000; time += 5000) samples = appendHistory(samples, 12, time);
    assert.equal(samples.length, 1441);
    assert.equal(samples[0].time, 10000);
    assert.equal(samples.at(-1).time, HISTORY_WINDOW_MS + 10000);
    assert.equal(appendHistory(samples, 15, HISTORY_WINDOW_MS + 11000).length, 1440);
});

test('restaura solo muestras recientes y válidas', () => {
    const now = HISTORY_WINDOW_MS + 100;
    assert.deepEqual(pruneHistory([{ time: 0, value: 1 }, { time: 100, value: 0 }, { time: now, value: 12 },
        { time: now + 1, value: 2 }, null, { time: now, value: -1 }], now), [{ time: 100, value: 0 }, { time: now, value: 12 }]);
    assert.deepEqual(pruneHistory({}, now), []);
});

test('el gráfico respeta el tiempo real y deja huecos en las desconexiones', () => {
    const now = HISTORY_WINDOW_MS;
    const history = [{ time: 0, value: 10 }, { time: 5000, value: 10 },
        { time: now - 5000, value: 20 }, { time: now, value: 20 }];
    const chart = getHistoryChart(history, 720, 100, 20, now);
    assert.equal((chart.line.match(/M /g) || []).length, 2);
    assert.equal((chart.area.match(/ Z/g) || []).length, 2);
    assert.match(chart.line, /^M 0,52.5/);
    assert.match(chart.line, /720,5$/);
});

test('las horas configuradas cambian la retención y el límite de muestras', () => {
    const now = 24 * 3600000;
    const samples = Array.from({ length: 17281 }, (_, index) => ({ time: index * 5000, value: 12 }));
    assert.equal(pruneHistory(samples, now, 24).length, 17281);
    assert.equal(pruneHistory(samples, now, 4).length, 2881);
    const reduced = pruneHistory(samples, now, 1);
    assert.equal(reduced.length, 721);
    assert.equal(reduced[0].time, now - 3600000);
    assert.deepEqual(pruneHistory(reduced, now, 4), reduced);
    assert.equal(appendHistory(pruneHistory(samples, now - 5000, 4), 13, now, 4).length, 2881);
});

test('valores inválidos recuperan las dos horas por defecto', () => {
    for (const value of [undefined, null, '', 0, -1, 25, Infinity, 'abc', 1.5]) assert.equal(normalizeHistoryHours(value), 2);
    assert.equal(normalizeHistoryHours('4'), 4);
    assert.equal(historyWindowMs(4), 14400000);
});

test('el eje temporal usa la misma duración configurada', () => {
    const now = 14400000;
    const samples = [{ time: now - 3600000, value: 10 }, { time: now - 3595000, value: 10 }];
    assert.match(getHistoryChart(samples, 400, 100, 20, now, 4).line, /^M 300,52.5/);
    assert.match(getHistoryChart(samples, 400, 100, 20, now, 1).line, /^M 0,52.5/);
});

test('cada bloque conserva la media y las rachas con su hora exacta', () => {
    let samples = [];
    for (const [time, value] of [[1000, 10], [2000, 30], [2500, 5], [4000, 15], [5000, 12]]) {
        samples = appendWindReading(samples, value, time);
    }
    assert.equal(samples.length, 2);
    assert.equal(samples[0].value, 15);
    assert.equal(samples[0].count, 4);
    assert.equal(samples[0].min, 5);
    assert.equal(samples[0].max, 30);
    assert.equal(samples[0].minTime, 2500);
    assert.equal(samples[0].maxTime, 2000);
    assert.deepEqual(getHistoryExtrema(samples, 5000), { min: { value: 5, time: 2500 }, max: { value: 30, time: 2000 } });
});

test('registra valores constantes y resuelve extremos repetidos por su última hora', () => {
    let samples = [];
    for (const time of [1000, 2000, 5000, 7000]) samples = appendWindReading(samples, 12, time);
    assert.equal(samples.length, 2);
    assert.deepEqual(getHistoryExtrema(samples, 7000), { min: { value: 12, time: 7000 }, max: { value: 12, time: 7000 } });
    assert.equal(samples[0].value, 12);
});

test('no inventa bloques sin lecturas y persiste todos los estadísticos', () => {
    let samples = appendWindReading([], 10, 1000);
    samples = appendWindReading(samples, 20, 30000);
    assert.equal(samples.length, 2);
    assert.deepEqual(JSON.parse(JSON.stringify(samples)), samples);
    assert.equal((getHistoryChart(samples, 400, 100, 20, 35000).line.match(/C /g) || []).length, 0);
    for (const invalid of [NaN, Infinity, null, -1, '20']) assert.equal(appendWindReading(samples, invalid, 31000), samples);
    assert.equal(appendWindReading(samples, 12, 1000), samples);
});

test('retención configurable elimina también los extremos antiguos', () => {
    let samples = appendWindReading([], 40, 1000, 1);
    samples = appendWindReading(samples, 10, 3606000, 1);
    assert.equal(samples.length, 1);
    assert.equal(getHistoryExtrema(samples, 3606000, 1).max.value, 10);
    assert.deepEqual(getHistoryExtrema([], 3606000), { min: null, max: null });
});
