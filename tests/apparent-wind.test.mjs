import test from 'node:test';
import assert from 'node:assert/strict';
import { INITIAL_DATA, SIGNALK_PATHS } from '../services/signalk/paths.js';
import { deriveNavigationData } from '../features/console/model/navigationData.js';
import { polarToCartesian } from '../utils/Utils.js';

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

test('viento real y aparente conservan el mismo costado entre números y compás', () => {
    for (const [apparent, real] of [[90, 90], [-90, -90], [30, 50], [-30, -50]]) {
        const navigation = deriveNavigationData({
            ...INITIAL_DATA,
            [SIGNALK_PATHS.apparentWindAngle]: apparent * Math.PI / 180,
            [SIGNALK_PATHS.trueWindAngle]: real * Math.PI / 180,
            // Relative wind angles must not change with heading or ground track.
            [SIGNALK_PATHS.heading]: 225 * Math.PI / 180,
            [SIGNALK_PATHS.courseOverGround]: 245 * Math.PI / 180,
        });
        const blue = polarToCartesian(100, 100, 80, navigation.awa);
        const orange = polarToCartesian(100, 100, 80, navigation.twaCog);
        assert.equal(Math.sign(blue.x - 100), Math.sign(apparent));
        assert.equal(Math.sign(orange.x - 100), Math.sign(real));
        assert.ok(Math.abs(navigation.twaCog - navigation.twa) < 0.001);
        if (Math.abs(apparent) === 90) {
            assert.ok(Math.hypot(blue.x - orange.x, blue.y - orange.y) < 0.001,
                'Dos vientos de 90° al mismo costado deben coincidir, no quedar opuestos');
        }
    }
});

test('TWA derivado de dirección y rumbo cruza el norte por el costado correcto', () => {
    for (const [heading, direction, expected] of [[359, 1, 2], [1, 359, -2], [350, 80, 90], [10, 280, -90]]) {
        const navigation = deriveNavigationData({
            ...INITIAL_DATA,
            [SIGNALK_PATHS.heading]: heading * Math.PI / 180,
            [SIGNALK_PATHS.windDirection]: direction * Math.PI / 180,
        });
        assert.ok(Math.abs(navigation.twaCog - expected) < 0.001);
        assert.ok(Math.abs(navigation.twa - expected) < 0.001);
    }
});

test('direcciones de viento al norte suman el rumbo y respetan ambos costados y el cruce de 360°', () => {
    for (const [heading, awa, twa, apparentDirection, trueDirection] of [
        [350, 30, 50, 20, 40], [15, -45, -80, 330, 295], [270, 90, -90, 0, 180], [0, 0, 0, 0, 0],
    ]) {
        const navigation = deriveNavigationData({
            ...INITIAL_DATA,
            [SIGNALK_PATHS.heading]: heading * Math.PI / 180,
            [SIGNALK_PATHS.courseOverGround]: 110 * Math.PI / 180,
            [SIGNALK_PATHS.apparentWindAngle]: awa * Math.PI / 180,
            [SIGNALK_PATHS.trueWindAngle]: twa * Math.PI / 180,
            // The direction under TWA must describe its angle even if another source disagrees.
            [SIGNALK_PATHS.windDirection]: Math.PI,
        });
        const error = (actual, expected) => Math.abs(((actual - expected + 540) % 360) - 180);
        assert.ok(error(navigation.apparentWindDirectionDeg, apparentDirection) < 0.001);
        assert.ok(error(navigation.trueWindDirectionDeg, trueDirection) < 0.001);
        assert.ok(Math.abs(navigation.awa - awa) < 0.001);
        assert.ok(Math.abs(navigation.twa - twa) < 0.001);
    }
});

test('dirección norte exige rumbo verdadero y no lo sustituye por COG o magnético sin variación', () => {
    const base = { ...INITIAL_DATA,
        [SIGNALK_PATHS.courseOverGround]: Math.PI,
        [SIGNALK_PATHS.apparentWindAngle]: Math.PI / 6,
        [SIGNALK_PATHS.trueWindAngle]: Math.PI / 4,
    };
    for (const data of [base, { ...base, [SIGNALK_PATHS.headingMagnetic]: Math.PI / 2 }]) {
        const navigation = deriveNavigationData(data);
        assert.equal(navigation.apparentWindDirectionDeg, null);
        assert.equal(navigation.trueWindDirectionDeg, null);
    }
    const converted = deriveNavigationData({ ...base,
        [SIGNALK_PATHS.headingMagnetic]: 80 * Math.PI / 180,
        [SIGNALK_PATHS.magneticVariation]: 10 * Math.PI / 180,
    });
    assert.ok(Math.abs(converted.apparentWindDirectionDeg - 120) < 0.001);
    assert.ok(Math.abs(converted.trueWindDirectionDeg - 135) < 0.001);
});

test('dirección real puede usar TWD sin rumbo; aparente sin ángulo permanece ausente', () => {
    const received = deriveNavigationData({ ...INITIAL_DATA, [SIGNALK_PATHS.windDirection]: 0 });
    assert.equal(received.trueWindDirectionDeg, 0);
    assert.equal(received.apparentWindDirectionDeg, null);
    const missing = deriveNavigationData({ ...INITIAL_DATA, [SIGNALK_PATHS.heading]: Math.PI });
    assert.equal(missing.trueWindDirectionDeg, null);
    assert.equal(missing.apparentWindDirectionDeg, null);
});
