import test from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { spawnSync } from 'node:child_process';

test('los paquetes comparten identificador CI y el APK incrementa versionCode', () => {
    const root = mkdtempSync(join(tmpdir(), 'navmarina-build-'));
    try {
        mkdirSync(join(root, 'scripts'));
        mkdirSync(join(root, 'config'));
        cpSync(new URL('../scripts/prepare-build-info.mjs', import.meta.url), join(root, 'scripts/prepare-build-info.mjs'));
        cpSync(new URL('../app.config.js', import.meta.url), join(root, 'app.config.js'));
        writeFileSync(join(root, 'app.json'), JSON.stringify({ expo: { version: '1.0.2' } }));
        const env = { ...process.env, NAVMARINA_BUILD_NUMBER: '27', NAVMARINA_CHANNEL: 'Develop', GITHUB_SHA: 'abc123' };
        for (const target of ['web', 'raspberry', 'android']) {
            const result = spawnSync(process.execPath, [join(root, 'scripts/prepare-build-info.mjs'), target], { env, encoding: 'utf8' });
            assert.equal(result.status, 0, result.stderr);
            const info = JSON.parse(readFileSync(join(root, 'config/buildInfo.json'), 'utf8'));
            assert.equal(info.target, target);
            assert.equal(info.buildNumber, 27);
            assert.equal(info.channel, 'Develop');
            assert.equal(info.commit, 'abc123');
        }
        const android = spawnSync(process.execPath, ['-e', `const configure = require('./app.config.js'); console.log(JSON.stringify(configure({config:{android:{versionCode:3}}})))`], { cwd: root, env, encoding: 'utf8' });
        assert.equal(android.status, 0, android.stderr);
        assert.equal(JSON.parse(android.stdout).android.versionCode, 30);
        const invalid = spawnSync(process.execPath, [join(root, 'scripts/prepare-build-info.mjs'), 'web'], {
            env: { ...env, NAVMARINA_BUILD_NUMBER: '-1' }, encoding: 'utf8',
        });
        assert.notEqual(invalid.status, 0);
    } finally {
        assert.ok(resolve(root).startsWith(resolve(tmpdir()) + sep));
        rmSync(root, { recursive: true, force: true });
    }
});
