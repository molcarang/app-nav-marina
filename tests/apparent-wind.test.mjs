import test from 'node:test';
import assert from 'node:assert/strict';
import { INITIAL_DATA, SIGNALK_PATHS } from '../services/signalk/paths.js';
import { deriveNavigationData } from '../features/console/model/navigationData.js';

test('La suscripción admite el path AWA y el modelo convierte ambas bandas', () => {
    const path = 'environment.wind.angleApparent';
    assert.equal(SIGNALK_PATHS.apparentWindAngle, path);
    assert.ok(Object.hasOwn(INITIAL_DATA, path));
    for (const [degrees, side] of [[30, 'S'], [-45, 'P'], [0, 'S']]) {
        const navigation = deriveNavigationData({ ...INITIAL_DATA, [path]: degrees * Math.PI / 180 });
        assert.ok(Math.abs(navigation.awa - degrees) < 0.001);
        assert.equal(navigation.awaFixed, String(Math.abs(degrees)));
        assert.equal(navigation.awaDigital, `AWA (${side})`);
    }
});
