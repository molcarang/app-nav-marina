import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import EngineIcon from '../../../components/icons/EngineIcon';
import SailIcon from '../../../components/icons/SailIcon';
import { GAUGE_THEME } from '../../../styles/GaugeTheme';
import RudderIndicator from './RudderIndicator';

/** Panel de modos alineado con los tres indicadores inferiores. */
export default function NavigationModeLabels({ mode, windowWidth, isNightMode, height = 35, rudderAngle, rudderLimit, itemWidth, offsetY = -10 }) {
    const width = itemWidth ?? windowWidth * 0.9 / 3;
    const [rowWidth, setRowWidth] = useState(0);
    // Misma distribución que los tres InfoPanel: ancho, margen de 3 y space-evenly.
    const panelInset = Math.max(0, rowWidth - 3 * (width + 6)) / 4 + 3;
    const labelStyle = { fontSize: Math.min(18, Math.max(13, width * 0.12)) };
    const sailColor = mode === 'SAIL' ? (isNightMode ? '#007580' : GAUGE_THEME.colors.sail) : '#666';
    const engineColor = mode === 'ENGINE' ? (isNightMode ? '#900' : GAUGE_THEME.colors.engine) : '#666';

    return (
        <View style={[styles.row, { height, transform: [{ translateY: offsetY }] }]} onLayout={event => setRowWidth(event.nativeEvent.layout.width)}>
            <View
                pointerEvents="none"
                style={[
                    styles.panel,
                    {
                        left: panelInset,
                        width: 3 * width + 12 + Math.max(0, rowWidth - 3 * (width + 6)) / 2,
                        backgroundColor: isNightMode ? 'rgba(30, 0, 0, 0.8)' : GAUGE_THEME.colors.bg,
                    },
                ]}
            />
            <View style={[styles.label, { width }]} accessibilityLabel={`Modo vela${mode === 'SAIL' ? ' activo' : ' inactivo'}`}>
                <SailIcon size={20} color={sailColor} />
                <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.text, labelStyle, { color: sailColor }]}>
                    SAIL
                </Text>
            </View>
            <View style={[styles.spacer, { width }]}>
                <RudderIndicator angle={rudderAngle} alertAngle={rudderLimit} width={width} isNightMode={isNightMode} />
            </View>
            <View style={[styles.label, { width }]} accessibilityLabel={`Modo motor${mode === 'ENGINE' ? ' activo' : ' inactivo'}`}>
                <EngineIcon size={20} color={engineColor} />
                <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.text, labelStyle, { color: engineColor }]}>
                    ENGINE
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    row: { flexDirection: 'row', justifyContent: 'space-evenly', width: '100%', alignItems: 'center' },
    panel: { position: 'absolute', top: 0, bottom: 0, borderRadius: 12 },
    label: { marginHorizontal: 3, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
    spacer: { marginHorizontal: 3 },
    text: { fontFamily: 'NauticalFont', flexShrink: 1 },
});
