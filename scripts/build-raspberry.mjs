import { spawnSync } from 'node:child_process';
import { cpSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const output = 'artifacts/navmarina-raspberry';
const result = spawnSync(process.execPath, ['node_modules/expo/bin/cli', 'export', '--platform', 'web', '--output-dir', `${output}/web`], {
    cwd: root, stdio: 'inherit', env: { ...process.env, NAVMARINA_RASPBERRY: '1', EXPO_PUBLIC_SIGNALK_ADDRESS: 'http://localhost:3000' },
});
if (result.status !== 0) process.exit(result.status || 1);
mkdirSync(new URL(`../${output}`, import.meta.url), { recursive: true });
for (const file of ['install.sh', 'server.py', 'README.md']) {
    cpSync(new URL(`../raspberry/${file}`, import.meta.url), new URL(`../${output}/${file}`, import.meta.url));
}
console.log(`Raspberry Pi package: ${output}`);
