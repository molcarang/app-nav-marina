/**
 * Utilidades para cálculos náuticos y visualización
 */

// 1. Conversión de Unidades
export const mpsToKnots = (mps) => (mps * 1.94384).toFixed(1);
export const radToDeg = (rad) => (rad * 57.2958);
export const degToRad = (deg) => (deg * Math.PI / 180);

/**
 * Normaliza un ángulo al rango [-180, 180]
 * Útil para TWA (Wind Angle)
 */
export const normalizeAngle = (angle) => {
    let a = angle % 360;
    if (a > 180) a -= 360;
    if (a <= -180) a += 360;
    return a;
};

/**
 * Función LERP (Interpolación Lineal) para suavizado de movimientos.
 * Maneja correctamente el salto del Norte (360° -> 0°)
 */
export const lerpAngle = (start, end, factor) => {
    let diff = end - start;
    
    // Cruce del Norte: busca siempre el camino más corto
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    
    return start + diff * factor;
};

/**
 * Cálculos Geométricos para SVG
 */
export const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
        x: centerX + radius * Math.cos(angleInRadians),
        y: centerY + radius * Math.sin(angleInRadians),
    };
};

export const describeArc = (x, y, radius, startAngle, endAngle) => {
    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    return [
        "M", start.x, start.y, 
        "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
    ].join(" ");
};