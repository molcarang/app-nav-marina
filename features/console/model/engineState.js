import { ENGINE_PATH_PATTERN, ENGINE_STATE_PATH_PATTERN } from '../../../services/signalk/paths.js';

/** Combine named propulsion units; an explicit state takes priority over its RPM. */
export function deriveEngineState(data) {
    const units = new Map();
    let engineRpm = null;
    for (const [path, value] of Object.entries(data)) {
        if (ENGINE_PATH_PATTERN.test(path) && Number.isFinite(value) && value >= 0) {
            const id = path.split('.')[1];
            units.set(id, { ...units.get(id), rpm: value * 60 });
            engineRpm = Math.max(engineRpm ?? 0, value * 60);
        } else if (ENGINE_STATE_PATH_PATTERN.test(path) && ['started', 'stopped', 'unusable'].includes(value)) {
            const id = path.split('.')[1];
            units.set(id, { ...units.get(id), state: value });
        }
    }
    const statuses = [...units.values()].map(unit => unit.state === 'unusable' ? null
        : unit.state !== undefined ? unit.state === 'started' : unit.rpm > 0);
    const engineRunning = statuses.some(status => status === true) ? true
        : statuses.length && statuses.every(status => status === false) ? false : null;
    return { engineRpm, engineRunning };
}
