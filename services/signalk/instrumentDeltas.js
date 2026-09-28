import { isInstrumentPath, SIGNALK_PATHS as P } from './paths.js';

// Normaliza objetos y deltas parciales hacia las mismas lecturas internas.
const objectFields = {
    [P.attitude]: ['roll'],
    [P.current]: ['drift', 'setTrue', 'setMagnetic'],
};

export function readInstrumentDelta(message, self, receivedAt = Date.now()) {
    const context = message.context;
    if (context && context !== 'vessels.self' && context !== self) return {};
    const result = {};
    for (const update of message.updates ?? []) {
        for (const item of update.values ?? []) {
            if (!isInstrumentPath(item.path)) continue;
            if (objectFields[item.path]) {
                for (const field of objectFields[item.path]) {
                    // Un objeto nulo invalida todas sus propiedades.
                    if (item.value === null || Object.hasOwn(item.value ?? {}, field)) {
                        result[`${item.path}.${field}`] = item.value?.[field] ?? null;
                    }
                }
            } else {
                result[item.path] = item.value;
            }
            if (item.path === P.position) result.positionReceivedAt = receivedAt;
        }
    }
    return result;
}
