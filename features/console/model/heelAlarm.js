export const DEFAULT_HEEL_ALARM_DEGREES = 30;

export function normalizeHeelAlarmDegrees(value) {
    return Number.isFinite(value) && value >= 1 && value <= 90
        ? Math.round(value) : DEFAULT_HEEL_ALARM_DEGREES;
}

// La escora puede tener cualquier signo: el límite se aplica a ambos costados.
export function isHeelAlarmActive(heel, limit) {
    // La conversión de radianes puede dejar 30° como 29.999999999999996.
    return Number.isFinite(heel) && Math.abs(heel) >= normalizeHeelAlarmDegrees(limit) - 1e-9;
}
