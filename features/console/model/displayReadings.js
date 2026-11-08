export const DEFAULT_DISPLAY_REFRESH_SECONDS = 2;

export function normalizeDisplayRefreshSeconds(value) {
    return Number.isFinite(value) && value >= 0 && value <= 5
        ? Math.round(value) : DEFAULT_DISPLAY_REFRESH_SECONDS;
}

const fields = ['twsKnots', 'sogKnots', 'twa', 'awa', 'cogDeg', 'depthMeters',
    'trueWindDirectionDeg', 'apparentWindDirectionDeg'];
const available = value => Number.isFinite(typeof value === 'string' ? Number(value) : value);
const availabilityChanged = (previous, next) => fields.some(key => available(previous[key]) !== available(next[key]));

/** Latest sample at a fixed cadence, with immediate first data and invalidation. */
export function createDisplayReadings(publish, seconds) {
    const period = normalizeDisplayRefreshSeconds(seconds) * 1000;
    let latest = null, displayed = null, disposed = false;
    const flush = () => {
        if (disposed || latest === null || displayed === latest) return;
        displayed = latest;
        publish(displayed);
    };
    const timer = period > 0 ? setInterval(flush, period) : null;
    return {
        push(navigation) {
            if (disposed) return;
            latest = navigation;
            if (period === 0 || displayed === null || availabilityChanged(displayed, latest)) flush();
        },
        dispose() { disposed = true; if (timer !== null) clearInterval(timer); },
    };
}
