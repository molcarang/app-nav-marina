export const DEFAULT_HISTORY_HOURS = 2;
export const MAX_HISTORY_HOURS = 24;
export const HISTORY_WINDOW_MS = DEFAULT_HISTORY_HOURS * 60 * 60 * 1000;
export const HISTORY_SAMPLE_MS = 5000;
export const HISTORY_GAP_MS = 15000;
export function normalizeHistoryHours(value) {
    const hours = Number(value);
    return Number.isInteger(hours) && hours >= 1 && hours <= MAX_HISTORY_HOURS ? hours : DEFAULT_HISTORY_HOURS;
}
export const historyWindowMs = hours => normalizeHistoryHours(hours) * 60 * 60 * 1000;

export function pruneHistory(samples, now, hours = DEFAULT_HISTORY_HOURS) {
    if (!Array.isArray(samples)) return [];
    const windowMs = historyWindowMs(hours);
    return samples.filter(sample => sample && Number.isFinite(sample.time) && Number.isFinite(sample.value)
        && sample.value >= 0 && sample.time >= now - windowMs && sample.time <= now)
        .sort((a, b) => a.time - b.time).slice(-(Math.floor(windowMs / HISTORY_SAMPLE_MS) + 1));
}

export function appendHistory(samples, value, time, hours = DEFAULT_HISTORY_HOURS) {
    const recent = pruneHistory(samples, time, hours);
    if (!Number.isFinite(value) || value < 0) return recent;
    if (recent.length && time - recent[recent.length - 1].time < HISTORY_SAMPLE_MS) return recent;
    return [...recent, { time, value }].slice(-(Math.floor(historyWindowMs(hours) / HISTORY_SAMPLE_MS) + 1));
}

/** Agrega cada lectura recibida, sin perder picos entre actualizaciones de pantalla. */
export function appendWindReading(samples, value, time, hours = DEFAULT_HISTORY_HOURS) {
    if (!Number.isFinite(value) || value < 0 || !Number.isFinite(time)) return samples;
    const bucketTime = Math.floor(time / HISTORY_SAMPLE_MS) * HISTORY_SAMPLE_MS;
    const last = samples[samples.length - 1];
    if (last && bucketTime < last.time) return samples;
    if (last && bucketTime === last.time) {
        const count = last.count + 1;
        const sum = last.sum + value;
        const bucket = { ...last, count, sum, value: sum / count,
            min: Math.min(last.min, value), max: Math.max(last.max, value),
            minTime: value <= last.min ? time : last.minTime,
            maxTime: value >= last.max ? time : last.maxTime,
        };
        return [...samples.slice(0, -1), bucket];
    }
    return [...pruneHistory(samples, time, hours), {
        time: bucketTime, value, sum: value, count: 1, min: value, max: value, minTime: time, maxTime: time,
    }];
}

/** Extremos de las lecturas originales, no de las medias del gráfico. */
export function getHistoryExtrema(samples, now, hours = DEFAULT_HISTORY_HOURS) {
    const start = now - historyWindowMs(hours);
    const result = { min: null, max: null };
    for (const sample of samples) {
        for (const kind of ['min', 'max']) {
            const value = sample?.[kind] ?? sample?.value;
            const time = sample?.[`${kind}Time`] ?? sample?.time;
            if (!Number.isFinite(value) || !Number.isFinite(time) || time < start || time > now) continue;
            const previous = result[kind];
            if (!previous || (kind === 'min' ? value < previous.value : value > previous.value)
                || (value === previous.value && time > previous.time)) result[kind] = { value, time };
        }
    }
    return result;
}
