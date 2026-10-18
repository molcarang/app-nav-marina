import { prepareBuildInfo } from './prepare-build-info.mjs';
import { spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
prepareBuildInfo('raspberry');
const root = fileURLToPath(new URL('../', import.meta.url));
const output = 'artifacts/navmarina-raspberry';
const result = spawnSync(process.execPath, ['node_modules/expo/bin/cli', 'export', '--platform', 'web', '--output-dir', `${output}/web`], {
    cwd: root, stdio: 'inherit', env: { ...process.env, NAVMARINA_RASPBERRY: '1', EXPO_PUBLIC_SIGNALK_ADDRESS: 'http://localhost:3000' },
});
if (result.status !== 0) process.exit(result.status || 1);
mkdirSync(new URL(`../${output}`, import.meta.url), { recursive: true });
cpSync(new URL('../assets/images/icon.png', import.meta.url), new URL(`../${output}/icon.png`, import.meta.url));
for (const file of ['install.sh', 'server.py', 'updater.py', 'README.md']) {
    cpSync(new URL(`../raspberry/${file}`, import.meta.url), new URL(`../${output}/${file}`, import.meta.url));
}
// Windows checkouts must still produce executable Linux shell scripts.
writeFileSync(new URL(`../${output}/install.sh`, import.meta.url), readFileSync(new URL('../raspberry/install.sh', import.meta.url), 'utf8').replace(/\r\n/g, '\n'));
cpSync(new URL('../config/buildInfo.json', import.meta.url), new URL(`../${output}/buildInfo.json`, import.meta.url));
console.log(`Raspberry Pi package: ${output}`);
