import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
const root = new URL('../', import.meta.url);
const info = JSON.parse(readFileSync(new URL('config/buildInfo.json', root), 'utf8'));
if (!info.buildNumber || !info.commit) throw new Error('Release requires CI build metadata');
const files = ['navmarina-web.zip', 'navmarina-raspberry.zip'];
for (const name of files) {
    if (!existsSync(new URL(`artifacts/${name}`, root))) throw new Error(`Missing release package: ${name}`);
}
const manifest = { schema: 1, app: 'navmarina', version: info.version,
    buildNumber: info.buildNumber, channel: info.channel, commit: info.commit };
writeFileSync(new URL('artifacts/release.json', root), JSON.stringify(manifest, null, 2));
writeFileSync(new URL('artifacts/SHA256SUMS', root), files.map(name => {
    const hash = createHash('sha256').update(readFileSync(new URL(`artifacts/${name}`, root))).digest('hex');
    return `${hash}  ${name}`;
}).join('\n') + '\n');
