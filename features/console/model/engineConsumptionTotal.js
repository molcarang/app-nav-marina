export const ENGINE_CONSUMPTION_TOTAL_KEY = '@engine_consumption_total_v1';
export const ENGINE_RPM_FRESH_MS = 30000;

export function readEngineConsumptionTotal(serialized) {
    if (serialized === null) return 0;
    const saved = JSON.parse(serialized);
    if (saved?.schema !== 1 || !Number.isFinite(saved.litres) || saved.litres < 0) {
        throw new Error('Invalid saved engine consumption total');
    }
    return saved.litres;
}

/** Integrates the last calculated L/h only over confirmed, observed running time. */
export function createEngineConsumptionTotal(initialLitres = 0) {
    let total = initialLitres, rate = null, until = null, observedAt = null, source = null;
    const advance = end => {
        if (until === null || !Number.isFinite(end) || end <= until) return total;
        const next = total + rate * ((end - until) / 3600000);
        if (Number.isFinite(next)) total = next;
        until = end;
        return total;
    };
    const pause = now => {
        advance(Math.min(now, observedAt ?? now));
        rate = until = observedAt = null;
        return total;
    };
    return {
        update(input, now) {
            if (input.source !== source) { pause(now); source = input.source; }
            const fresh = Number.isFinite(input.receivedAt) && input.receivedAt <= now
                && now - input.receivedAt <= ENGINE_RPM_FRESH_MS;
            const running = input.connected && input.active && fresh && Number.isFinite(input.rpm) && input.rpm > 0
                && Number.isFinite(input.rate) && input.rate >= 0;
            if (!running) {
                // A confirmed stop closes the last partial interval up to its timestamp.
                if (input.connected && input.active && fresh && input.rpm === 0) advance(input.receivedAt);
                return pause(now);
            }
            if (until !== null && (input.receivedAt - observedAt > ENGINE_RPM_FRESH_MS || now < until)) pause(now);
            if (until === null) {
                rate = input.rate;
                until = now;
            } else if (input.rate !== rate) {
                advance(input.receivedAt);
                rate = input.rate;
            }
            observedAt = observedAt === null ? input.receivedAt : Math.max(observedAt, input.receivedAt);
            return total;
        },
        tick(now) {
            if (observedAt === null) return total;
            if (now - observedAt > ENGINE_RPM_FRESH_MS) return pause(now);
            return advance(Math.min(now, observedAt));
        },
        pause,
        reset(now) { total = 0; if (until !== null) until = now; return total; },
        replace(value, now) {
            if (!Number.isFinite(value) || value < 0) return total;
            total = value;
            if (until !== null) until = now;
            return total;
        },
        get litres() { return total; },
    };
}
