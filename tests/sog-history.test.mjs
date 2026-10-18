import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_SETTINGS } from '../features/console/model/settings.js';
import { appendWindReading as appendReading, pruneHistory, getHistoryExtrema } from '../features/console/model/twsHistory.js';

test('SOG tiene dos horas por defecto independientes de TWS', () => {
    assert.equal(DEFAULT_SETTINGS.sogHistoryHours, 2);
    assert.equal(DEFAULT_SETTINGS.historyHours, 2);
    const settings = { ...DEFAULT_SETTINGS, sogHistoryHours: 4 };
    assert.equal(settings.historyHours, 2);
});

test('SOG conserva velocidades cero, media y extremos con hora sin mezclar TWS', () => {
    let sog = [];
    let tws = [];
    for (const [time, speed, wind] of [[1000, 0, 12], [2000, 6, 24], [3000, 3, 18]]) {
        sog = appendReading(sog, speed, time, 2);
        tws = appendReading(tws, wind, time, 4);
    }
    assert.equal(sog[0].value, 3);
    assert.equal(tws[0].value, 18);
    assert.deepEqual(getHistoryExtrema(sog, 4000, 2), { min: { value: 0, time: 1000 }, max: { value: 6, time: 2000 } });
    sog = [];
    assert.equal(tws.length, 1);
    assert.deepEqual(getHistoryExtrema(sog, 4000, 2), { min: null, max: null });
});

test('cada duración elimina únicamente las muestras fuera de su ventana', () => {
    const now = 4 * 3600000;
    const samples = [{ time: 3600000, value: 6 }, { time: now - 1000, value: 8 }];
    assert.equal(pruneHistory(samples, now, 2).length, 1);
    assert.equal(pruneHistory(samples, now, 4).length, 2);
});
