import { useId } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

const getFontSizes = (width) => {
    // Ajusta los tamaños de fuente proporcionalmente al ancho del panel
    return {
        label: Math.round(width * 0.07),
        value: Math.round(width * 0.09),
    };
};

const InfoPanel = ({ dataArray, color, width = 225, height, panelWidth, isNightMode = false }) => {
    const surfaceId = `info-${useId().replace(/:/g, '')}`;
    const accent = dataArray[0]?.color || '#79f17b';
    const fontSizes = getFontSizes(width);
    const { width: windowWidth } = useWindowDimensions();
    const SQUARE_WIDTH = panelWidth ?? (windowWidth * 0.9) / 3;
    return (

        <View style={[styles.panelContainer, height != null && {
            height, paddingVertical: 0, paddingBottom: 0, justifyContent: 'center',
        }, {
            backgroundColor: color, width: SQUARE_WIDTH,
            borderColor: isNightMode ? '#694747' : accent,
        }]}>
            <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
                <Svg width="100%" height="100%">
                    <Defs>
                        <LinearGradient id={surfaceId} x1="0%" y1="0%" x2="0%" y2="100%">
                            <Stop offset="0%" stopColor={isNightMode ? '#b47575' : '#c6edff'} stopOpacity={isNightMode ? 0.08 : 0.16} />
                            <Stop offset="48%" stopColor="#000" stopOpacity={0} />
                            <Stop offset="100%" stopColor="#000" stopOpacity={0.3} />
                        </LinearGradient>
                    </Defs>
                    <Rect width="100%" height="100%" fill={`url(#${surfaceId})`} />
                </Svg>
            </View>
            <View pointerEvents="none" style={[styles.topHighlight, { backgroundColor: isNightMode ? 'rgba(195, 140, 140, 0.15)' : 'rgba(225, 245, 255, 0.28)' }]} />
            {dataArray.map((item, index) => (
                <View key={index} style={[styles.dataRow, height != null && { marginBottom: 0 }]}>
                    <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.rowLabel, { color: isNightMode ? '#b38b8b' : '#bdcbd5', fontSize: height != null ? Math.min(fontSizes.label, height - 10) : fontSizes.label }]}>{item.label}</Text>
                    <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.rowValue, { color: item.color || '#fff', fontSize: height != null ? Math.min(fontSizes.value, height - 10) : fontSizes.value }]}>
                        {item.value}
                    </Text>
                </View>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    panelContainer: {
        // width se controla por prop
        borderRadius: 15,
        margin: 3, // Igual que DataSquare
        padding: 10,
        borderWidth: 1,
        overflow: 'hidden',
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        paddingBottom: 10, // Un poco menos de espacio abajo
        alignSelf: 'flex-start', // 👈 Importante: hace que no se estire verticalmente
    },
    dataRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
        gap: 6,
    },
    rowLabel: {
        color: '#888',
        fontSize: 14,
        fontFamily: 'NauticalFont',
        textAlign: 'left',
        flexShrink: 1,
        
    },
    rowValue: {
        flexShrink: 1,
        fontSize: 16,
        fontWeight: 'bold',
        fontFamily: 'NauticalFont',
        textAlign: 'right',
    },
    topHighlight: {
        position: 'absolute',
        top: 1,
        left: 12,
        right: 12,
        height: 1,
        borderRadius: 1,
    },
});

export default InfoPanel;
