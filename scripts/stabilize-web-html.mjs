import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

// Apply before React's CSS loads, including on a cold start without a service worker.
const initialLayout = '<style id="navmarina-initial-layout">html,body{margin:0;padding:0;background:#000}#root{min-height:100%}</style>';

export function stabilizeWebHtml(directory) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
        const path = join(directory, entry.name);
        if (entry.isDirectory()) stabilizeWebHtml(path);
        else if (entry.name.endsWith('.html')) {
            const html = readFileSync(path, 'utf8');
            if (!html.includes('id="navmarina-initial-layout"')) {
                writeFileSync(path, html.replace('<head>', '<head>' + initialLayout));
            }
        }
    }
}
