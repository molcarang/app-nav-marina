import { prepareBuildInfo } from './prepare-build-info.mjs';
import { stabilizeWebHtml } from './stabilize-web-html.mjs';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

prepareBuildInfo('web');
const root = fileURLToPath(new URL('../', import.meta.url));
const output = resolve(root, 'dist');
const result = spawnSync(process.execPath, [
  'node_modules/expo/bin/cli', 'export', '--platform', 'web', '--output-dir', output,
], { cwd: root, stdio: 'inherit', env: { ...process.env, NAVMARINA_PWA: '1' } });
if (result.status !== 0) process.exit(result.status || 1);
stabilizeWebHtml(output);

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

const head = `<link rel="manifest" href="/manifest.webmanifest" />
<meta name="theme-color" content="#071827" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-title" content="NavMarina" />
<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
<script src="/pwa-register.js" defer></script>`;

const files = walk(output).filter((path) => !path.endsWith(`${sep}sw.js`)).sort();
for (const path of files.filter((path) => path.endsWith('.html'))) {
  const html = readFileSync(path, 'utf8')
    .replace(/<title>.*?<\/title>/s, '<title>NavMarina</title>')
    .replace('</head>', `${head}</head>`);
  writeFileSync(path, html);
}

const hash = createHash('sha256');
const urls = files.map((path) => {
  const url = '/' + relative(output, path).split(sep).join('/');
  hash.update(url).update(readFileSync(path));
  return url;
});
const worker = readFileSync(new URL('./pwa-worker.js', import.meta.url), 'utf8')
  .replace('__CACHE_NAME__', JSON.stringify(`navmarina-pwa-${hash.digest('hex').slice(0, 16)}`))
  .replace('__APP_FILES__', JSON.stringify(urls));
writeFileSync(resolve(output, 'sw.js'), worker);
console.log(`PWA lista en ${output}; ${urls.length} archivos para uso sin conexión.`);
