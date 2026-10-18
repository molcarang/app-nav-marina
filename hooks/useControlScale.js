import { useWindowDimensions } from 'react-native';
import { useMemo } from 'react';
import { getControlScale, scaleStyles } from '../utils/responsiveScale';

/** Escala controles en pantallas amplias, conservando el tamaño en tablets pequeñas. */
export function useControlScale() {
    const { width, height } = useWindowDimensions();
    return getControlScale(width, height);
}

export function useResponsiveStyles(styles) {
    const scale = useControlScale();
    return useMemo(() => scaleStyles(styles, scale), [styles, scale]);
}
