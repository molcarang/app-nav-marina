const test = require('node:test');
const assert = require('node:assert/strict');
const createPlugin = require('../simulation/signalk-ais-demo');

test('publica cuatro barcos independientes con posiciones y metadatos válidos', () => {
    const messages = [];
    const plugin = createPlugin({ handleMessage: (source, delta) => messages.push(delta) });
    try {
        plugin.start();
        assert.equal(messages.length, 4);
        assert.equal(new Set(messages.map(message => message.context)).size, 4);
        for (const message of messages) {
            assert.match(message.context, /^vessels\.urn:mrn:imo:mmsi:\d{9}$/);
            const values = Object.fromEntries(message.updates[0].values.map(item => [item.path, item.value]));
            assert.equal(typeof values[''].name, 'string');
            assert.ok(!values[''].name.includes('NaN'));
            assert.equal(values[''].mmsi, message.context.split(':').at(-1));
            assert.ok(Number.isFinite(values['navigation.position'].latitude));
            assert.ok(Number.isFinite(values['navigation.position'].longitude));
            assert.ok(Number.isFinite(values['navigation.speedOverGround']));
            assert.ok(Number.isFinite(values['navigation.courseOverGroundTrue']));
        }
    } finally { plugin.stop(); }
});
