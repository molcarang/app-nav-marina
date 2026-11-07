import { createServer } from 'node:http';
import { existsSync, readFileSync } from 'node:fs';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../../', import.meta.url));
const output = resolve(root, 'artifacts/ais-simulation-web');
if (!existsSync(resolve(output, 'index.html'))) throw Error('Export the web preview to artifacts/ais-simulation-web first.');
const port = Number(process.env.AIS_PREVIEW_PORT || 4173);
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.json': 'application/json', '.css': 'text/css',
    '.png': 'image/png', '.svg': 'image/svg+xml', '.ttf': 'font/ttf', '.otf': 'font/otf', '.wav': 'audio/wav', '.mp4': 'video/mp4', '.ico': 'image/x-icon' };
const server = createServer((request, response) => {
    const path = new URL(request.url, 'http://localhost').pathname;
    if (path === '/__ais-simulation/stop') {
        response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
        response.end('<html lang="es"><title>Simulación terminada</title><body style="background:#10202c;color:#eaf5fb;font:20px system-ui;padding:40px"><h1>Simulación terminada</h1><p>Puedes cerrar esta pestaña. La app y el servidor Signal K reales no se han modificado.</p></body></html>');
        server.close();
        setTimeout(() => process.exit(0), 500);
        return;
    }
    const fixtures = { '/__ais-simulation/scenario.js': 'scenario.cjs', '/__ais-simulation/client.js': 'client.js' };
    if (fixtures[path]) {
        response.writeHead(200, { 'Content-Type': 'application/javascript; charset=utf-8', 'Cache-Control': 'no-store' });
        response.end(readFileSync(new URL(fixtures[path], import.meta.url)));
        return;
    }
    const file = resolve(output, '.' + (path === '/' ? '/index.html' : decodeURIComponent(path)));
    if (!file.startsWith(output + sep) || !existsSync(file)) { response.writeHead(404).end(); return; }
    response.writeHead(200, { 'Content-Type': mime[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    if (extname(file) === '.html') {
        const inject = '<script src="/__ais-simulation/scenario.js"></script><script src="/__ais-simulation/client.js"></script>';
        response.end(readFileSync(file, 'utf8').replace('<head>', '<head>' + inject));
    } else response.end(readFileSync(file));
});
server.listen(port, '127.0.0.1', () => console.log(`Temporary AIS simulation: http://127.0.0.1:${server.address().port}`));
