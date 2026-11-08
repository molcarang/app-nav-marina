import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { calculateAisCollision, vesselMotion } from '../../features/console/model/aisCollisionRisk.js';
const require = createRequire(import.meta.url);
const { messages } = require('./scenario.cjs');
const now = Date.now();
function evaluate(level, second = false, elapsedSeconds = 0) {
    const packets = messages({ level, second, elapsedSeconds }, now);
    const data = packets.map(packet => ({ ...Object.fromEntries(packet.updates[0].values.map(({ path, value }) => [path, value])),
        collisionPositionReceivedAt: now, speedReceivedAt: now, courseReceivedAt: now }));
    return data.slice(1).map(target => calculateAisCollision(vesselMotion(data[0]), vesselMotion(target), {}, now));
}
assert.equal(evaluate('none')[0].level, 'unknown');
assert.equal(evaluate('warning')[0].level, 'warning');
assert.ok(Math.abs(evaluate('warning')[0].cpaNm - 0.3) < 0.001);
assert.ok(Math.abs(evaluate('warning')[0].tcpaMinutes - 10) < 0.01);
assert.equal(evaluate('danger')[0].level, 'danger');
assert.ok(evaluate('danger')[0].cpaNm < 0.001);
assert.ok(Math.abs(evaluate('danger')[0].tcpaMinutes - 185.2 / 60) < 0.01);
assert.equal(evaluate('danger', true)[1].level, 'warning');
assert.ok(evaluate('danger', false, 20)[0].tcpaMinutes < evaluate('danger')[0].tcpaMinutes);
assert.ok(evaluate('warning', false, 20)[0].tcpaMinutes < evaluate('warning')[0].tcpaMinutes);
console.log('PASS: controlled orange/red/second-vessel scenes and moving trajectories');
