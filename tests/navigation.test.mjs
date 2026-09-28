import { SIGNALK_PATHS } from '../services/signalk/paths.js';
import assert from 'node:assert/strict';
import test from 'node:test';
import { deriveNavigationData, derivePerformance } from '../features/console/model/navigationData.js';
import { getAutopilotInfo } from '../features/console/model/autopilot.js';
import { DEFAULT_SETTINGS, SETTINGS_STORAGE_KEY } from '../features/console/model/settings.js';
import { getConsoleTheme } from '../features/console/styles/consoleTheme.js';
import { INITIAL_DATA } from '../services/signalk/config.js';


test('estado inicial: sin lecturas de sensores', () => {
    const navigation = deriveNavigationData(INITIAL_DATA);
    assert.equal(navigation.sogKnots, '—');
    assert.equal(navigation.twsKnots, '—');
    assert.equal(navigation.navigationMode, null);
    assert.equal(getAutopilotInfo(navigation.apState).value, '—');
});

test('convierte unidades y conserva los signos de viento y escora', () => {
    const navigation = deriveNavigationData({
        ...INITIAL_DATA,
        [SIGNALK_PATHS.speedOverGround]: 3.086667,
        [SIGNALK_PATHS.windSpeed]: 7.716667,
        [SIGNALK_PATHS.heading]: Math.PI / 4,
        [SIGNALK_PATHS.courseOverGround]: Math.PI / 4,
        [SIGNALK_PATHS.windDirection]: Math.PI / 2,
        [SIGNALK_PATHS.apparentWindAngle]: -Math.PI / 6,
        [SIGNALK_PATHS.rudderAngle]: Math.PI / 18,
        [SIGNALK_PATHS.engineRevolutions]: 30,
        [SIGNALK_PATHS.attitude]: { roll: -Math.PI / 12 },
    });
    assert.equal(navigation.sogKnots, '6.0');
    assert.equal(navigation.twsKnots, '15.0');
    assert.equal(navigation.cogDigital, '45.0');
    assert.equal(navigation.awaFixed, '30');
    assert.equal(navigation.awaDigital, 'AWA (P)');
    assert.equal(navigation.rudderAngle, 10);
    assert.equal(navigation.engineRpm, 1800);
    assert.ok(Math.abs(navigation.vesselHeelDeg + 15) < 0.001);
    assert.ok(Math.abs(navigation.twaCog + 45) < 0.001);
});

test('normaliza el ángulo relativo al cruzar el norte', () => {
    const navigation = deriveNavigationData({
        ...INITIAL_DATA,
        [SIGNALK_PATHS.heading]: 359 * Math.PI / 180,
        [SIGNALK_PATHS.windDirection]: Math.PI / 180,
    });
    assert.ok(Math.abs(navigation.twaCog + 2) < 0.001);
});

test('VMG conserva magnitud y VMC conserva signo', () => {
    const result = derivePerformance({ sogKnots: '6.0', twaCog: 180 }, 8, 60);
    assert.equal(result.vmc, -6);
    assert.equal(result.vmg, 6);
    assert.ok(Math.abs(result.targetVMG - 4) < 1e-10);
});

test('mantiene compatibilidad de ajustes y estados del piloto', () => {
    assert.equal(SETTINGS_STORAGE_KEY, '@ajustes_consola');
    assert.equal(typeof DEFAULT_SETTINGS.depthAlarmMeters, 'number');
    for (const [state, label] of [['auto', 'AUTO'], ['wind', 'WIND'], ['route', 'TRACK'], ['standby', 'STBY']]) {
        assert.equal(getAutopilotInfo(state).value, label);
    }
    assert.equal(getConsoleTheme(false, -40, DEFAULT_SETTINGS).statusDot, '#00FF00');
    assert.equal(getConsoleTheme(false, 70, DEFAULT_SETTINGS).statusDot, '#FF0000');
});

