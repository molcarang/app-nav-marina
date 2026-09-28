const test = require('node:test');
const assert = require('node:assert/strict');
const createPlugin = require('../simulation/signalk-gps-demo-bridge');

function publish(latitude, longitude, timestamp = new Date().toISOString()) {
    const messages = [];
    const plugin = createPlugin({
        getSelfPath: path => ({ value: path.endsWith('latitude') ? latitude : longitude, timestamp }),
        handleMessage: (source, delta) => messages.push(delta),
    });
    try { plugin.start(); } finally { plugin.stop(); }
    return messages;
}

test('convierte coordenadas separadas en posición estándar del barco propio', () => {
    const [delta] = publish(28.736889, -13.862777);
    assert.equal(delta.context, 'vessels.self');
    assert.deepEqual(delta.updates[0].values, [{
        path: 'navigation.position', value: { latitude: 28.736889, longitude: -13.862777 },
    }]);
    assert.equal(publish(0, 0).length, 1);
});

test('no publica datos inválidos, ausentes o caducados', () => {
    for (const [lat, lon] of [[null, 0], [0, undefined], [91, 0], [0, 181], [NaN, 0]]) {
        assert.equal(publish(lat, lon).length, 0);
    }
    assert.equal(publish(1, 2, new Date(Date.now() - 20000).toISOString()).length, 0);
    assert.equal(publish(1, 2, 'invalid').length, 0);
});
