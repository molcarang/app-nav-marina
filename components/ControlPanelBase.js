import React from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Svg, { Defs, G, Rect } from 'react-native-svg';
import { GAUGE_THEME } from '../styles/GaugeTheme';
import { GaugeDefs } from './gauges/shared/GaugeDefs';

// 1. Componente de celda individual
const DataField = ({ label, value, color }) => (
    <View style={styles.dataField}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <Text style={[styles.fieldValue, { color }]}>{value}</Text>
    </View>
);

const ControlPanelBase = ({ mode = 'sail' }) => {
    const { width: windowWidth, height: windowHeight } = useWindowDimensions();

    // Configuración de datos (Tus valores de layline incluidos)
    const PANEL_DATA = {
        sail: [
            { label: "TWA", value: "45°", color: GAUGE_THEME.colors.sail },
            { label: "LAYLINES", value: "20°  60°", color: "#FFF" },
            { label: "VMG", value: "6.4 kt", color: GAUGE_THEME.colors.sail },
        ],
        engine: [
            { label: "RPM", value: "2400", color: GAUGE_THEME.colors.engine },
            { label: "TEMP", value: "82°C", color: "#FFF" },
            { label: "FUEL", value: "78%", color: GAUGE_THEME.colors.engine },
        ]
    };

    // Obtenemos los datos según el modo
    const currentData = PANEL_DATA[mode] || PANEL_DATA.sail;

    const isLandscape = windowWidth > windowHeight;
    const panelWidth = isLandscape ? windowWidth * 0.7 : windowWidth * 0.9;
    const panelHeight = isLandscape ? windowHeight * 0.18 : windowHeight * 0.15;
    // Lógica de gradiente dinámico como SOGGauge
    const metalId = mode === 'sail' ? 'blueMetal' : 'redMetal';
    const activeColor = mode === 'sail' ? GAUGE_THEME.colors.sail : GAUGE_THEME.colors.engine;
    return (
        <View style={{ width: panelWidth, height: panelHeight, justifyContent: 'center', alignItems: 'center' }}>
            <Svg width={panelWidth} height={panelHeight} viewBox={`0 0 ${panelWidth} ${panelHeight}`}>
                <Defs>
                    <GaugeDefs />
                </Defs>
                {/* Fondo de pantalla */}
                <Rect
                    x="3" y="3"
                    width={panelWidth - 6} height={panelHeight - 6}
                    rx={14} fill={GAUGE_THEME.colors.bg}
                />
                {/* Detalles decorativos */}
                <G>
                    <Rect x={panelWidth * 0.33} y={panelHeight * 0.35} width="2" height={panelHeight * 0.3} fill={activeColor} opacity={0.5} />
                    <Rect x={panelWidth * 0.33} y={panelHeight * 0.35} width="1" height={panelHeight * 0.3} fill="url(#bezelRidge)" />
                    <Rect x={panelWidth * 0.66} y={panelHeight * 0.35} width="2" height={panelHeight * 0.3} fill={activeColor} opacity={0.5} />
                    <Rect x={panelWidth * 0.66} y={panelHeight * 0.35} width="1" height={panelHeight * 0.3} fill="url(#bezelRidge)" />
                </G>
            </Svg>
            <View style={styles.contentOverlay}>
                <View style={styles.row}>
                    {currentData.map((item, index) => (
                        <React.Fragment key={index}>
                            <DataField label={item.label} value={item.value} color={item.color} />
                            {index < currentData.length - 1 && <View style={styles.divider} />}
                        </React.Fragment>
                    ))}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    contentOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        width: '100%',
    },
    dataField: {
        alignItems: 'center',
        flex: 1,
    },
    fieldLabel: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.5)',
        fontFamily: 'NauticalFont', // Asegúrate de tener esta fuente cargada
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    fieldValue: {
        fontSize: 22,
        fontWeight: 'bold',
        fontFamily: 'NauticalFont',
    },
    divider: {
        width: 1,
        height: '40%',
        backgroundColor: 'rgba(255,255,255,0.1)',
    }
});

export default ControlPanelBase;