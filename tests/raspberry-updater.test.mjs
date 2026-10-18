import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

test('actualizador Raspberry: integridad, instalacion y autorizacion local HTTP', () => {
    const command = process.platform === 'win32' ? 'python' : 'python3';
    const result = spawnSync(command, [fileURLToPath(new URL('./raspberry_updater_test.py', import.meta.url))], { encoding: 'utf8' });
    assert.equal(result.status, 0, result.stdout + result.stderr);
});
