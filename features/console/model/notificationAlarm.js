/** Aggregate received notifications, preserving the distinction between normal and unknown. */
export function deriveNotificationAlarm(data, pathPattern) {
    const states = Object.entries(data)
        .filter(([path]) => pathPattern.test(path))
        .map(([, value]) => {
            if (['alert', 'warn', 'alarm', 'emergency'].includes(value?.state)) return true;
            if (['normal', 'nominal'].includes(value?.state)) return false;
            return null;
        });
    if (states.includes(true)) return true;
    return states.length && states.every(state => state === false) ? false : null;
}
