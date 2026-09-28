// Alcance exterior; los tres anillos representan 1/3, 2/3 y el alcance completo.
export const AIS_RANGES_NM = [0.3, 0.75, 1.5, 6];
export const normalizeAisRange = value => AIS_RANGES_NM.includes(value) ? value : 6;
