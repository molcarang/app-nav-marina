import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export function prepareBuildInfo(target) {
    if (!['web', 'raspberry', 'android'].includes(target)) throw new Error('Invalid build target');
    const app = JSON.parse(readFileSync(new URL('../app.json', import.meta.url), 'utf8'));
    const buildNumber = Number(process.env.NAVMARINA_BUILD_NUMBER || 0);
    const channel = process.env.NAVMARINA_CHANNEL || 'main';
    if (!Number.isSafeInteger(buildNumber) || buildNumber < 0 || !['main', 'Develop'].includes(channel)) {
        throw new Error('Invalid build number or channel');
    }
    const info = { schema: 1, version: app.expo.version, buildNumber, channel,
        commit: process.env.GITHUB_SHA || null, target, ...(target === 'raspberry' ? { updaterProtocol: 1 } : {}) };
    writeFileSync(new URL('../config/buildInfo.json', import.meta.url), JSON.stringify(info, null, 2) + '\n');
    return info;
}
if (process.argv[1] === fileURLToPath(import.meta.url)) prepareBuildInfo(process.argv[2]);
