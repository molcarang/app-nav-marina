/** Paleta de la consola y estado visual del intervalo de ceñida. */
export function getConsoleTheme(isNightMode, twa, settings) {
    const angle = Math.abs(twa || 0);
    const inTarget = angle >= settings.minAnguloCeñida && angle <= settings.maxAnguloCeñida;
    return {
        heading: '#dc1212ff',
        wind: isNightMode ? '#900' : '#ff9800',
        twd: isNightMode ? '#004' : '#2196f3',
        bg: isNightMode ? 'rgba(30, 0, 0, 0.8)' : 'rgba(45, 45, 45, 0.75)',
        alarm: 'rgba(210, 0, 0, 0.95)',
        statusDot: inTarget ? '#00FF00' : '#FF0000',
    };
}
