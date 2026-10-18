export function isValidPosition(position) {
    return Number.isFinite(position?.latitude) && Math.abs(position.latitude) <= 90
        && Number.isFinite(position?.longitude) && Math.abs(position.longitude) <= 180;
}

/** Grados, minutos y segundos; redondea antes de separar para propagar los acarreos. */
export function formatCoordinate(value, latitude) {
    if (!Number.isFinite(value) || Math.abs(value) > (latitude ? 90 : 180)) return '—';
    const tenths = Math.round(Math.abs(value) * 3600 * 10);
    const degrees = Math.floor(tenths / 36000);
    const minutes = Math.floor((tenths % 36000) / 600);
    const seconds = (tenths % 600) / 10;
    const hemisphere = latitude ? (value < 0 ? 'S' : 'N') : (value < 0 ? 'W' : 'E');
    return `${degrees}° ${String(minutes).padStart(2, '0')}′ ${seconds.toFixed(1).padStart(4, '0')}″ ${hemisphere}`;
}
