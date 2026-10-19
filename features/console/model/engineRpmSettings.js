export const DEFAULT_TACHOMETER_MAX_RPM = 5000;
export const DEFAULT_TACHOMETER_RED_ZONE_RPM = 4000;

/** Keep the red zone inside the scale, including when its maximum is reduced. */
export function normalizeEngineRpmSettings(settings = {}) {
    const maximum = settings.tachometerMaxRpm;
    const tachometerMaxRpm = Number.isFinite(maximum) && maximum >= 1000 && maximum <= 20000
        ? Math.round(maximum) : DEFAULT_TACHOMETER_MAX_RPM;
    const redZone = settings.tachometerRedZoneRpm;
    const tachometerRedZoneRpm = Math.min(tachometerMaxRpm,
        Number.isFinite(redZone) && redZone >= 0 && redZone <= 20000
            ? Math.round(redZone) : DEFAULT_TACHOMETER_RED_ZONE_RPM);
    return { tachometerMaxRpm, tachometerRedZoneRpm };
}
