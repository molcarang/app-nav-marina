import test from 'node:test';
import assert from 'node:assert/strict';
import { isLowFuelAlarmActive, normalizeLowFuelPercent } from '../features/console/model/lowFuelAlarm.js';

test('low fuel uses an inclusive configurable threshold, including an empty tank', () => {
    assert.equal(isLowFuelAlarmActive(true, 20, 20), true);
    assert.equal(isLowFuelAlarmActive(true, 20.1, 20), false);
    assert.equal(isLowFuelAlarmActive(true, 0, 20), true);
    assert.equal(isLowFuelAlarmActive(true, 25, 30), true);
    assert.equal(isLowFuelAlarmActive(true, 100, 100), true);
});

test('missing or invalid fuel and disconnection do not report low fuel', () => {
    for (const fuel of [null, undefined, NaN, Infinity, -1, 101, '10']) {
        assert.equal(isLowFuelAlarmActive(true, fuel, 20), false);
    }
    assert.equal(isLowFuelAlarmActive(false, 10, 20), false);
});

test('invalid saved thresholds fall back to twenty percent', () => {
    for (const value of [undefined, null, NaN, Infinity, 0, 101, '15']) {
        assert.equal(normalizeLowFuelPercent(value), 20);
    }
    assert.equal(normalizeLowFuelPercent(15), 15);
});
