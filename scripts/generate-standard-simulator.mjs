import { writeFileSync } from 'node:fs';
import { SIGNALK_FIELDS } from '../services/signalk/paths.js';

// Los instrumentos numéricos proceden del mismo catálogo que utiliza la app.
const fields = Object.fromEntries(Object.entries(SIGNALK_FIELDS)
    .filter(([, field]) => field.simulator)
    .map(([name, field]) => [name, { path: field.path, ...field.simulator }]));
for (const name of ['position', 'attitude', 'current', 'courseOverGround', 'autopilotState']) {
    fields[name] = { path: SIGNALK_FIELDS[name].path };
}
writeFileSync(new URL('../simulation/signalk-standard-demo/fields.json', import.meta.url),
    JSON.stringify(fields, null, 2) + '\n');
console.log('Catálogo del simulador estándar generado.');
