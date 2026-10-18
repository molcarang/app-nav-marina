import { createContext, useContext } from 'react';
import { StyleSheet, View } from 'react-native';

export const NightModeContext = createContext({ enabled: false, intensity: 30 });

/** Aplica la intensidad configurada sin cambiar los colores ni interceptar controles. */
export default function NightDimmer() {
    const { enabled, intensity } = useContext(NightModeContext);
    return enabled ? <View pointerEvents="none" accessible={false}
        style={[StyleSheet.absoluteFillObject, { backgroundColor: `rgba(0,0,0,${1 - intensity / 100})`, zIndex: 9999, elevation: 100 }]} /> : null;
}
