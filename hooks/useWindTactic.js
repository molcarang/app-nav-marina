import { useState, useEffect, useRef } from 'react';

/**
 * Hook para gestionar la media móvil del viento real (TWD)
 * @param {number} currentTWD - Dirección del viento instantánea
 * @param {number} bufferMinutes - Minutos para promediar (default 5)
 */
export const useWindTactic = (currentTWD, bufferMinutes = 5) => {
    const [meanTWD, setMeanTWD] = useState(currentTWD);
    const history = useRef([]);
    
    // Asumimos una frecuencia de actualización de SignalK de 1Hz (1 dato por seg)
    const MAX_SAMPLES = bufferMinutes * 60;

    useEffect(() => {
        if (currentTWD === undefined || currentTWD === null) return;

        // 1. Añadir al buffer
        history.current.push(currentTWD);
        if (history.current.length > MAX_SAMPLES) {
            history.current.shift();
        }

        // 2. Calcular Media Vectorial (Crucial para rumbos)
        let sinSum = 0;
        let cosSum = 0;

        for (const angle of history.current) {
            const rad = (angle * Math.PI) / 180;
            sinSum += Math.sin(rad);
            cosSum += Math.cos(rad);
        }

        const avgRad = Math.atan2(sinSum, cosSum);
        let avgDeg = (avgRad * 180) / Math.PI;
        
        // Normalizar a 0-360
        setMeanTWD((avgDeg + 360) % 360);

    }, [currentTWD]);

    return { meanTWD };
};