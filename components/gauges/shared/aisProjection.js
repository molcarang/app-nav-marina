const radians = degrees => degrees * Math.PI / 180;
const validPosition = p => Number.isFinite(p?.latitude) && Math.abs(p.latitude) <= 90
    && Number.isFinite(p?.longitude) && Math.abs(p.longitude) <= 180;

/** Distancia geográfica y posición en un radar con la proa hacia arriba. */
export function projectAisPosition(own, target, heading, radius, rangeNm = 6) {
    if (!Number.isFinite(rangeNm) || rangeNm <= 0) return null;
    if (!validPosition(own) || !validPosition(target) || !Number.isFinite(heading)) return null;
    const lat1 = radians(own.latitude), lat2 = radians(target.latitude);
    const dLat = lat2 - lat1, dLon = radians(target.longitude - own.longitude);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
    const distanceNm = 6371000 / 1852 * 2 * Math.asin(Math.sqrt(Math.min(1, Math.max(0, a))));
    if (distanceNm > rangeNm) return null;
    const bearing = Math.atan2(Math.sin(dLon) * Math.cos(lat2),
        Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon));
    const relative = bearing - radians(heading);
    return { x: radius * distanceNm / rangeNm * Math.sin(relative),
        y: -radius * distanceNm / rangeNm * Math.cos(relative), distanceNm };
}
