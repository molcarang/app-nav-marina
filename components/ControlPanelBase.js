
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Svg, { Defs, Rect } from 'react-native-svg';
import { GAUGE_THEME } from '../styles/GaugeTheme';
import { GaugeDefs } from './gauges/shared/GaugeDefs';

const ControlPanelBase = ({ children }) => {
    const { width: windowWidth, height: windowHeight } = useWindowDimensions();
    const isLandscape = windowWidth > windowHeight;
    const panelWidth = isLandscape ? windowWidth * 0.7 : windowWidth * 0.9;
    const panelHeight = isLandscape ? windowHeight * 0.23 : windowHeight * 0.20;
    return (
        <View style={{ width: panelWidth, height: panelHeight, justifyContent: 'center', 
        alignItems: 'center' }}>
            <Svg width={panelWidth} height={panelHeight} viewBox={`0 0 ${panelWidth} ${panelHeight}`}>
                <Defs>
                    <GaugeDefs />
                </Defs>
                <Rect
                    x={3}
                    y={3}
                    width={panelWidth - 6}
                    height={panelHeight - 6}
                    rx={14}
                    fill={GAUGE_THEME.colors.bg}
                />
            </Svg>
            <View style={styles.contentOverlay}>
                <View style={styles.row}>{children}</View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    contentOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
    },
});

export default ControlPanelBase;