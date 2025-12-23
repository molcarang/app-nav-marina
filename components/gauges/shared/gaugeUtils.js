// shared/gaugeUtils.js
// Helpers comunes para gauges: dimensiones y coordenadas.

/**
 * Calcula dimensiones comunes para los gauges en función del tamaño.
 * @param {number} size - Tamaño total del SVG (lado del cuadrado).
 * @returns {{CENTER:number, BEZEL_SIZE:number, RADIUS:number, INNER_RADIUS:number}}
 */
export function computeCommonDims(size) {
    const CENTER = size / 2;
    const BEZEL_SIZE = size * 0.06;
    const RADIUS = CENTER - BEZEL_SIZE;
    const INNER_RADIUS = RADIUS - (size * 0.08);
    return { CENTER, BEZEL_SIZE, RADIUS, INNER_RADIUS };
}

/**
 * Convierte ángulo en coordenadas cartesianas sobre un círculo.
 * @param {number} centerX
 * @param {number} centerY
 * @param {number} radius
 * @param {number} angleInDegrees
 * @returns {{x:number, y:number}}
 */
export function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
        x: centerX + radius * Math.cos(angleInRadians),
        y: centerY + radius * Math.sin(angleInRadians),
    };
}
