// Build first. Install the optional browser harness outside app dependencies:
// npm install --prefix artifacts/cls-tools --no-save --package-lock=false playwright-core
// node scripts/measure-cls.mjs baseline
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const require = createRequire(import.meta.url);
const { chromium } = require(resolve(root, 'artifacts/cls-tools/node_modules/playwright-core'));
const executablePath = process.env.NAVMARINA_BROWSER || [
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    '/usr/bin/chromium', '/usr/bin/google-chrome',
].find(path => existsSync(path));
if (!executablePath) throw new Error('Set NAVMARINA_BROWSER to an installed Chromium browser');
const dist = resolve(root, 'dist');
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css',
    '.otf': 'font/otf', '.ttf': 'font/ttf', '.woff': 'font/woff', '.png': 'image/png', '.svg': 'image/svg+xml', '.wav': 'audio/wav' };
const server = createServer((request, response) => {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const path = resolve(dist, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!path.startsWith(dist + sep) || !existsSync(path)) { response.writeHead(404).end(); return; }
    response.writeHead(200, { 'Content-Type': mime[extname(path)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    response.end(readFileSync(path));
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch({ executablePath, headless: true });
const output = resolve(root, 'artifacts/cls');
mkdirSync(output, { recursive: true });
const results = [];
try {
    for (const scenario of [
        { name: 'streaming-1920', width: 1920, height: 1080, dynamic: false },
        { name: 'dynamic-1920', width: 1920, height: 1080, dynamic: true },
        { name: 'dynamic-1280', width: 1280, height: 800, dynamic: true },
        { name: 'streaming-portrait', width: 768, height: 1024, dynamic: false },
    ]) {
        const context = await browser.newContext({ viewport: { width: scenario.width, height: scenario.height } });
        const page = await context.newPage();
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.route('**/signalk/v1/api/**', route => route.fulfill({ json: {} }));
        await page.route('https://api.github.com/repos/molcarang/app-nav-marina/releases**', async route => {
            await new Promise(resolve => setTimeout(resolve, 5500));
            await route.fulfill({ json: scenario.dynamic ? [{ id: 999, draft: false, prerelease: false,
                body: JSON.stringify({ schema: 1, app: 'navmarina', channel: 'main', buildNumber: 999999, version: 'test' }),
                assets: [{ name: 'navmarina-web.zip', state: 'uploaded', browser_download_url:
                    'https://github.com/molcarang/app-nav-marina/releases/download/test/navmarina-web.zip' }] }] : [] });
        });
        await page.addInitScript(({ dynamic }) => {
            localStorage.setItem('@ajustes_consola', JSON.stringify({ language: 'es', signalKAddress: 'http://mock.signalk:3000' }));
            if (dynamic) localStorage.setItem('@anchor_watch_v1', JSON.stringify({ method: 'drop',
                center: { latitude: 28, longitude: -13 }, radius: 50 }));
            window.__shifts = [];
            new PerformanceObserver(list => {
                for (const entry of list.getEntries()) if (!entry.hadRecentInput) window.__shifts.push({
                    time: entry.startTime, value: entry.value, sources: entry.sources.map(source => ({
                        text: source.node?.textContent?.slice(0, 90), tag: source.node?.nodeName,
                        previous: source.previousRect.toJSON(), current: source.currentRect.toJSON(),
                    })),
                });
            }).observe({ type: 'layout-shift', buffered: true });
            window.__sockets = [];
            let tick = 0;
            class MockWebSocket {
                static OPEN = 1;
                constructor() {
                    this.readyState = 0;
                    window.__sockets.push(this);
                    setTimeout(() => {
                        this.readyState = 1;
                        this.onmessage?.({ data: JSON.stringify({ self: 'vessels.own' }) });
                        this.onopen?.({});
                        this.timer = setInterval(() => this.publish(), 750);
                    }, 350);
                }
                send(body) {
                    const request = JSON.parse(body);
                    this.kind = request.context === 'vessels.*' ? 'ais'
                        : request.subscribe[0].path.startsWith('navigation.course') ? 'waypoint' : 'instruments';
                }
                publish() {
                    if (this.readyState !== 1 || this.kind !== 'instruments') return;
                    tick++;
                    const values = {
                        'navigation.position': { latitude: 28, longitude: -13 },
                        'navigation.headingTrue': tick % 2 ? 0.6 : 1.0,
                        'navigation.courseOverGroundTrue': tick % 2 ? 0.7 : 1.1,
                        'navigation.speedOverGround': tick % 2 ? 1 : 5,
                        'environment.wind.speedTrue': tick % 2 ? 2 : 10,
                        'environment.wind.speedApparent': 8, 'environment.wind.angleApparent': -0.5,
                        'environment.wind.angleTrueWater': -0.7, 'environment.wind.directionTrue': 1,
                        'environment.depth.belowTransducer': tick % 2 ? 8 : 15,
                        'environment.water.temperature': 295, 'navigation.attitude': { roll: 0.1 },
                        'steering.rudderAngle': 0.1, 'steering.autopilot.state': tick % 2 ? 'standby' : 'route',
                        'propulsion.0.revolutions': tick % 2 ? 0 : 30,
                    };
                    this.onmessage?.({ data: JSON.stringify({ context: 'vessels.self', updates: [{ timestamp: new Date().toISOString(),
                        values: Object.entries(values).map(([path, value]) => ({ path, value })) }] }) });
                }
                close() { this.readyState = 3; clearInterval(this.timer); this.onclose?.({}); }
            }
            window.WebSocket = MockWebSocket;
            if (dynamic) setTimeout(() => {
                for (const socket of window.__sockets) if (socket.kind === 'waypoint') socket.onmessage?.({ data: JSON.stringify({
                    context: 'vessels.self', updates: [{ timestamp: new Date().toISOString(), values: [
                        { path: 'navigation.courseRhumbline.nextPoint.position', value: { latitude: 28.01, longitude: -13.01 } },
                        { path: 'navigation.courseRhumbline.nextPoint.name', value: 'Puerto de prueba' },
                        { path: 'navigation.courseRhumbline.crossTrackError', value: 30 },
                    ] }],
                }) });
            }, 4000);
        }, { dynamic: scenario.dynamic });
        await page.goto(`http://127.0.0.1:${server.address().port}/`);
        await page.waitForTimeout(10500);
        const shifts = await page.evaluate(() => window.__shifts);
        let maximum = 0, windowTotal = 0, first = 0, last = 0;
        for (const shift of shifts) {
            if (shift.time - last > 1000 || shift.time - first > 5000) { first = shift.time; windowTotal = 0; }
            last = shift.time; windowTotal += shift.value; maximum = Math.max(maximum, windowTotal);
        }
        const result = { scenario: scenario.name, cls: maximum, errors, shifts };
        results.push(result);
        await page.screenshot({ path: resolve(output, `${process.argv[2] || 'current'}-${scenario.name}.png`) });
        console.log(JSON.stringify({ scenario: scenario.name, cls: maximum, shifts: shifts.length, errors }));
        await context.close();
    }
} finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
}
writeFileSync(resolve(output, `${process.argv[2] || 'current'}.json`), JSON.stringify(results, null, 2));
