import { createEngineConsumptionTotal } from './engineConsumptionTotal.js';

export const ENGINE_HOURS_KEY = '@engine_hours_total_v1';

export function readEngineHours(serialized) {
    if (serialized === null) return 0;
    const saved = JSON.parse(serialized);
    if (saved?.schema !== 1 || !Number.isFinite(saved.hours) || saved.hours < 0) {
        throw new Error('Invalid saved engine hours');
    }
    return saved.hours;
}

/** Uses the same guarded RPM timeline as fuel accumulation, integrating one hour per running hour. */
export function createEngineHours(initialHours = 0) {
    const accumulator = createEngineConsumptionTotal(initialHours);
    return {
        update(input, now) {
            return accumulator.update({ ...input, rate: 1 }, now);
        },
        tick: now => accumulator.tick(now),
        pause: now => accumulator.pause(now),
        replace: (hours, now) => accumulator.replace(hours, now),
        get hours() { return accumulator.litres; },
    };
}
