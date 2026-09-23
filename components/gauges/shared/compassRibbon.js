export const normalizeHeading = degrees => ((degrees % 360) + 360) % 360;
export const cardinalHeading = degrees => ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.round(normalizeHeading(degrees) / 45) % 8];

export function compassTicks(heading) {
    const center = normalizeHeading(heading);
    const ticks = [];
    for (let angle = Math.ceil((center - 90) / 5) * 5; angle <= center + 90; angle += 5) {
        // Proyección cilíndrica: las marcas se comprimen al girar hacia los lados.
        const radians = (angle - center) * Math.PI / 180;
        const depth = Math.max(0, Math.cos(radians));
        ticks.push({ angle: normalizeHeading(angle), x: 160 + Math.sin(radians) * 140,
            scale: Math.max(0.08, depth), opacity: depth ** 0.65 });
    }
    return ticks;
}
