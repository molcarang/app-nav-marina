import { ENGINE_PATH_PATTERN, ENGINE_RUNTIME_PATH_PATTERN, ENGINE_STATE_PATH_PATTERN } from '../../../services/signalk/paths.js';

/** Combine named propulsion units; an explicit state takes priority over its RPM. */
export function deriveEngineState(data) {
    const units = new Map();
    let engineRpm = null;
    let engineRpmReceivedAt = null;
    let engineRunTimeSeconds = null;
    let engineRunTimeReceivedAt = null;
    for (const [path, value] of Object.entries(data)) {
        if (ENGINE_PATH_PATTERN.test(path) && Number.isFinite(value) && value >= 0) {
            const id = path.split('.')[1];
            units.set(id, { ...units.get(id), rpm: value * 60 });
            if (engineRpm === null || value * 60 > engineRpm) {
                engineRpm = value * 60;
                const receivedAt = data[`${path}.receivedAt`];
                engineRpmReceivedAt = Number.isFinite(receivedAt) ? receivedAt : null;
            }
        } else if (ENGINE_RUNTIME_PATH_PATTERN.test(path) && Number.isFinite(value) && value >= 0) {
            if (engineRunTimeSeconds === null || value > engineRunTimeSeconds) {
                engineRunTimeSeconds = value;
                const receivedAt = data[`${path}.receivedAt`];
                engineRunTimeReceivedAt = Number.isFinite(receivedAt) ? receivedAt : null;
            }
        } else if (ENGINE_STATE_PATH_PATTERN.test(path) && ['started', 'stopped', 'unusable'].includes(value)) {
            const id = path.split('.')[1];
            units.set(id, { ...units.get(id), state: value });
        }
    }
    const statuses = [...units.values()].map(unit => unit.state === 'unusable' ? null
        : unit.state !== undefined ? unit.state === 'started' : unit.rpm > 0);
    const engineRunning = statuses.some(status => status === true) ? true
        : statuses.length && statuses.every(status => status === false) ? false : null;
    return { engineRpm, engineRunning, engineRpmReceivedAt, engineRunTimeSeconds, engineRunTimeReceivedAt };
}
