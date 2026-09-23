import { writeFileSync } from 'node:fs';
import { SIGNALK_FIELDS } from '../services/signalk/paths.js';

// Regenera únicamente el ejemplo local; no modifica el servidor del barco.
const items = Object.values(SIGNALK_FIELDS)
    .filter(field => field.simulator)
    .map(field => ({ path: field.path, ...field.simulator }));

writeFileSync(
    new URL('../simulator.json', import.meta.url),
    JSON.stringify({ enabled: true, configuration: { items } }, null, 2) + '\n'
);
console.log(`simulator.json generado con ${items.length} paths numéricos.`);
