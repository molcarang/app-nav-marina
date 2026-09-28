import test from 'node:test';
import assert from 'node:assert/strict';
import { createPendingUpdates } from '../services/signalk/pendingUpdates.js';

test('Una ráfaga de deltas produce una actualización con el último valor de cada path', t => {
    t.mock.timers.enable({ apis: ['setTimeout'] });
    const batches = [];
    const pending = createPendingUpdates(batch => batches.push(batch));
    for (let i = 0; i < 100; i++) pending.add({ wind: i });
    pending.add({ heading: 42 });
    assert.equal(batches.length, 0);
    t.mock.timers.tick(100);
    assert.deepEqual(batches, [{ wind: 99, heading: 42 }]);
    pending.add({ wind: 101 });
    t.mock.timers.tick(100);
    assert.deepEqual(batches[1], { wind: 101 });
    pending.dispose();
});

test('Al desconectar se descartan deltas pendientes y no se publica después', t => {
    t.mock.timers.enable({ apis: ['setTimeout'] });
    const batches = [];
    const pending = createPendingUpdates(batch => batches.push(batch));
    pending.add({ wind: 8 });
    pending.dispose();
    pending.add({ wind: 9 });
    t.mock.timers.tick(1000);
    assert.deepEqual(batches, []);
});
