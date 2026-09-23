import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import HeadingGauge from '../../../components/gauges/HeadingGauge';
import HeelPanel, { HEEL_PANEL_ASPECT_RATIO } from '../../../components/gauges/HeelPanel';
import ConnectionHeader from '../components/ConnectionHeader';
import NavigationControls from '../components/NavigationControls';
import ConsoleBackground from '../components/ConsoleBackground';
import GpsPositionPanel, { GPS_PANEL_HEIGHT } from '../components/GpsPositionPanel';

/** Dos mitades: compás a la izquierda y controles a la derecha. */
export default function LandscapeNavigationPage(props) {
    const { navigation, settings, isConnected, isNightMode, onOpenSettings } = props;
    const [area, setArea] = useState({ width: 0, height: 0 });
    // Se mide el espacio real, después de cabecera, márgenes y áreas del sistema.
    const columnWidth = area.width / 2;
    const previousGaugeSize = Math.max(1, Math.min(
        Math.min(columnWidth - 16, area.height - 16) * 1.3915,
        columnWidth - 4,
        area.height - 4,
    ));
    const gaugeSize = Math.max(1, Math.min(previousGaugeSize * 1.10, area.width * 0.55 - 4, area.height - 4));
    const gaugeColumnWidth = Math.max(columnWidth, gaugeSize + 4);
    // Compensa el margen superior de 3 puntos de los InfoPanel.
    const controlsTop = Math.max(0, (area.height - gaugeSize) / 2 - 3);
    const controlsWidth = Math.max(1, area.width - gaugeColumnWidth) * 0.96;
    const itemWidth = Math.max(1, (controlsWidth - 24) / 3);
    const heelWidth = Math.max(1, controlsWidth - 9);
    // Sin la fila de modos, las tarjetas aprovechan el espacio libre sobre la escora.
    // Se reservan márgenes, resumen superior y espacio inferior; en pantallas bajas hay scroll.
    const cardHeight = Math.max(80, Math.min(itemWidth * 0.9, (area.height - controlsTop - heelWidth * HEEL_PANEL_ASPECT_RATIO - GPS_PANEL_HEIGHT - 112) / 2));

    return (
        <View style={[localStyles.screen, { backgroundColor: isNightMode ? '#050000' : '#0a0a0a' }]}>
            <View
                style={[localStyles.frame, isNightMode && { borderColor: '#400' }]}
            >
                <ConsoleBackground isNightMode={isNightMode} />
                <ConnectionHeader
                    isConnected={isConnected}
                    isNightMode={isNightMode}
                    onOpenSettings={onOpenSettings}
                    style={{ marginBottom: 4, width: '96%' }}
                />
                <View
                    style={localStyles.columns}
                    onLayout={({ nativeEvent }) => setArea(nativeEvent.layout)}
                >
                    <View style={[localStyles.compass, { width: gaugeColumnWidth }]}>
                        {area.width > 0 && (
                            <HeadingGauge
                                size={gaugeSize}
                                value={navigation.cogDigital}
                                awa={navigation.awa}
                                awsKnots={navigation.awsKnots}
                                twsKnots={Number(navigation.twsKnots)}
                                twd={navigation.twdDeg}
                                twaCog={navigation.twaCog}
                                isNightMode={isNightMode}
                                minLayline={settings.minAnguloCeñida}
                                maxLayline={settings.maxAnguloCeñida}
                                set={navigation.setDeg}
                                drift={navigation.driftKnots}
                            />
                        )}
                    </View>
                    <ScrollView
                        style={[localStyles.controls, { width: Math.max(0, area.width - gaugeColumnWidth) }]}
                        contentContainerStyle={[localStyles.controlsContent, { paddingTop: controlsTop }]}
                    >
                        {area.width > 0 && (
                            <View style={{ width: controlsWidth, alignItems: 'center' }}>
                                <NavigationControls
                                    {...props}
                                    landscape
                                    itemWidth={itemWidth}
                                    cardHeight={cardHeight}
                                />
                                <HeelPanel
                                    backgroundColor={props.theme.bg}
                                    rudderAngle={navigation.rudderAngle}
                                    rudderLimit={settings.rudderLimit}
                                    heel={navigation.vesselHeelDeg}
                                    width={heelWidth}
                                    isNightMode={isNightMode}
                                />
                                <GpsPositionPanel width={heelWidth} position={navigation.position}
                                    heading={navigation.cogDeg}
                                    receivedAt={navigation.positionReceivedAt} isConnected={isConnected}
                                    isNightMode={isNightMode} backgroundColor={props.theme.bg} />
                            </View>
                        )}
                    </ScrollView>
                </View>
            </View>
        </View>
    );
}

const localStyles = StyleSheet.create({
    screen: { flex: 1, padding: 8 },
    frame: { flex: 1, paddingTop: 6, borderWidth: 2, borderColor: '#333', borderRadius: 25, overflow: 'hidden' },
    columns: { flex: 1, flexDirection: 'row', minHeight: 0 },
    compass: { width: '50%', alignItems: 'center', justifyContent: 'center' },
    controls: { width: '50%', flexGrow: 0 },
    controlsContent: { flexGrow: 1, justifyContent: 'flex-start', alignItems: 'center', paddingBottom: 8 },
});
