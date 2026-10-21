import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { generateImageAsync } from '@expo/image-utils';
import { Resvg } from '@resvg/resvg-js';

// Keep the supplied vector artwork intact; contain it on its navy background for square icons.
const root = fileURLToPath(new URL('../', import.meta.url));
const vector = new URL('../assets/images/openboat-logo.svg', import.meta.url);
const src = fileURLToPath(new URL('../assets/images/openboat-logo.png', import.meta.url));
writeFileSync(src, new Resvg(readFileSync(vector), { fitTo: { mode: 'width', value: 2400 } }).render().asPng());
const icons = [
    ['assets/images/icon.png', 1024],
    ['assets/images/splash-icon.png', 1024],
    ['assets/images/android-icon-foreground.png', 1024],
    ['assets/images/favicon.png', 64],
    ['public/icons/icon-192.png', 192],
    ['public/icons/icon-512.png', 512],
    ['public/icons/apple-touch-icon.png', 180],
];
for (const [path, size] of icons) {
    const { source } = await generateImageAsync({ projectRoot: root }, {
        src, width: size, height: size, resizeMode: 'contain', backgroundColor: '#03162e', removeTransparency: true,
    });
    writeFileSync(new URL(`../${path}`, import.meta.url), source);
    console.log(`${path}: ${size}x${size}`);
}
