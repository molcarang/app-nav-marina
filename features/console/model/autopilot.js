/** Etiqueta y color del piloto. */
export function getAutopilotInfo(state) {
    switch (state) {
        case 'auto':
            return { label: 'PILOT', value: 'AUTO', color: '#79f17bff' }; // Verde ceñida
        case 'wind':
            return { label: 'PILOT', value: 'WIND', color: '#2196f3' }; // Azul viento
        case 'route':
            return { label: 'PILOT', value: 'TRACK', color: '#bb86fc' }; // Púrpura navegación
        default:
            return { label: 'PILOT', value: 'STBY', color: '#ff4444' }; // Rojo standby
    }
}
