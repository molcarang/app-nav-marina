import assert from 'node:assert/strict';
import test from 'node:test';
import { DEFAULT_SETTINGS } from '../features/console/model/settings.js';
import { isHeelAlarmActive, normalizeHeelAlarmDegrees } from '../features/console/model/heelAlarm.js';
import { deriveNavigationData } from '../features/console/model/navigationData.js';
import { SIGNALK_PATHS } from '../services/signalk/paths.js';

test('escora: ajustes antiguos, vacíos o inválidos recuperan el límite de 30 grados', () => {
    assert.equal(DEFAULT_SETTINGS.heelAlarmDegrees, 30);
    for (const value of [undefined, null, '', '20', NaN, Infinity, 0, -15, 91]) {
        assert.equal(normalizeHeelAlarmDegrees(value), 30);
    }
    assert.equal(normalizeHeelAlarmDegrees(20), 20);
    assert.equal(normalizeHeelAlarmDegrees(1), 1);
    assert.equal(normalizeHeelAlarmDegrees(90), 90);
});

test('escora: activa el aviso al alcanzar el umbral en ambos costados y lo retira al bajar', () => {
    for (const sign of [-1, 1]) {
        assert.equal(isHeelAlarmActive(sign * 29.99), false);
        assert.equal(isHeelAlarmActive(sign * 30), true);
        assert.equal(isHeelAlarmActive(sign * 40), true);
        assert.equal(isHeelAlarmActive(sign * 19.99, 20), false);
        assert.equal(isHeelAlarmActive(sign * 20, 20), true);
    }
});

test('escora: no genera aviso con datos ausentes o inválidos', () => {
    for (const heel of [undefined, null, NaN, Infinity, -Infinity, '35', 0]) {
        assert.equal(isHeelAlarmActive(heel, 20), false);
    }
});

test('escora: 30 grados recibidos en radianes alcanzan el límite sin errores de conversión', () => {
    for (const sign of [-1, 1]) {
        const navigation = deriveNavigationData({ [SIGNALK_PATHS.attitude]: { roll: sign * 30 * Math.PI / 180 } });
        assert.equal(isHeelAlarmActive(navigation.vesselHeelDeg), true);
    }
});
