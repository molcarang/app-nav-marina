import { useControlScale } from '../../../hooks/useControlScale';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import HeadingGauge from '../../../components/gauges/HeadingGauge';
import HeelPanel, { HEEL_PANEL_ASPECT_RATIO } from '../../../components/gauges/HeelPanel';
import ConnectionHeader from '../components/ConnectionHeader';
import AisToggleButton from '../components/AisToggleButton';
import NavigationControls from '../components/NavigationControls';
import ConsoleBackground from '../components/ConsoleBackground';
import GpsPositionPanel, { GPS_PANEL_HEIGHT } from '../components/GpsPositionPanel';
import WaypointPreviewPanel, { WAYPOINT_PREVIEW_HEIGHT } from '../components/WaypointPreviewPanel';

/** Dos mitades: compás a la izquierda y controles a la derecha. */
export default function LandscapeNavigationPage(props) {
    const controlScale = useControlScale();
    const { navigation, settings, isConnected, isNightMode, onOpenSettings } = props;
    const hasActiveWaypoint = Boolean(props.waypoint);
    const [area, setArea] = useState({ width: 0, height: 0 });
    const [controlsHeight, setControlsHeight] = useState(0);
    const [scrollOffset, setScrollOffset] = useState(0);
    // Se mide el espacio real, después de cabecera, márgenes y áreas del sistema.
    const columnWidth = area.width / 2;
    const previousGaugeSize = Math.max(1, Math.min(
        Math.min(columnWidth - 16, area.height - 16) * 1.3915,
        columnWidth - 4,
        area.height - 4,
    ));
    const gaugeColumnWidth = columnWidth;
    // Compensa el margen negativo de la fila superior para alinearla con el marco.
    const controlsTop = 10;
    // Alinea los botones con el último panel visible, excluyendo su margen final.
    const lastPanelBottomMargin = (hasActiveWaypoint ? 3 : 8) * controlScale;
    const aisBottom = controlsHeight > 0
        ? Math.max(8, Math.min(area.height - 44 * controlScale, area.height - (controlsTop + controlsHeight - lastPanelBottomMargin - scrollOffset)))
        : 8;
    // Centrar en el hueco real entre la cabecera y los controles AIS.
    const gaugeTop = 48 * controlScale;
    const aisHeight = props.aisVisible ? 60 * controlScale + 2 : 44 * controlScale;
    const gaugeBottom = aisBottom + aisHeight + 8 * controlScale;
    const gaugeSize = Math.max(1, Math.min(previousGaugeSize * 1.10, columnWidth - 4,
        area.height - gaugeTop - gaugeBottom));
    const controlsWidth = Math.max(1, area.width - gaugeColumnWidth);
    const itemWidth = Math.max(1, (controlsWidth - 24) / 3);
    const heelWidth = Math.max(1, controlsWidth - 9);
    // Sin la fila de modos, las tarjetas aprovechan el espacio libre sobre la escora.
    // Se reservan márgenes, resumen superior y espacio inferior; en pantallas bajas hay scroll.
    const baseCardHeight = Math.max(80, Math.min(itemWidth * 0.9, (area.height - controlsTop - heelWidth * HEEL_PANEL_ASPECT_RATIO - GPS_PANEL_HEIGHT * controlScale - WAYPOINT_PREVIEW_HEIGHT * controlScale - 8 - 112) / 2));
    // Las dos filas de datos absorben exactamente la altura y el margen del waypoint.
    // Así el borde inferior y los márgenes existentes no cambian al alternarlo.
    const cardHeight = baseCardHeight + (hasActiveWaypoint ? 0 : (WAYPOINT_PREVIEW_HEIGHT + 5 + 5 + 3) * controlScale / 2);

    return (
        <View style={[localStyles.screen, { backgroundColor: isNightMode ? '#050000' : '#0a0a0a' }]}>
            <View
                style={[localStyles.frame, isNightMode && { borderColor: '#400' }]}
            >
                <ConsoleBackground isNightMode={isNightMode} />
                <View
                    style={localStyles.columns}
                    onLayout={({ nativeEvent }) => setArea(nativeEvent.layout)}
                >
                    <View style={[localStyles.compass, { width: gaugeColumnWidth }]}>
                        <View style={localStyles.leftHeader}>
                <ConnectionHeader
                    isConnected={isConnected}
                    isNightMode={isNightMode}
                    onOpenSettings={onOpenSettings}
                    settingsInline
                    style={{ width: '100%', paddingHorizontal: 8 }}
                />
                        </View>
                        <View style={[localStyles.gaugeArea, { top: gaugeTop, bottom: gaugeBottom }]}>
                        {area.width > 0 && (
                            <HeadingGauge
                                showAis={props.aisVisible} aisRangeNm={props.aisRangeNm}
                                aisTargets={props.aisTargets} position={navigation.position}
                                positionReceivedAt={navigation.positionReceivedAt} isConnected={isConnected}
                                size={gaugeSize}
                                value={navigation.headingDigital}
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
                        <View style={{ position: 'absolute', left: 8, right: 8, bottom: aisBottom, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <View style={{ width: '100%' }}>
                                <AisToggleButton visibleCount={props.aisVisibleCount} fullWidth auto={props.aisAuto} onToggleAuto={props.onToggleAisAuto} rangeNm={props.aisRangeNm} onRangeChange={props.onAisRangeChange} visible={props.aisVisible} onPress={props.onToggleAis} />
                            </View>
                        </View>
                    </View>
                    <View style={[localStyles.controls, { width: Math.max(0, area.width - gaugeColumnWidth) }]}>
                    <ScrollView
                        style={{ flex: 1 }}
                        onScroll={({ nativeEvent }) => setScrollOffset(nativeEvent.contentOffset.y)}
                        scrollEventThrottle={16}
                        contentContainerStyle={[localStyles.controlsContent, { paddingTop: controlsTop }]}
                    >
                        {area.width > 0 && (
                            <View style={{ width: controlsWidth, alignItems: 'center' }}
                                onLayout={({ nativeEvent }) => setControlsHeight(nativeEvent.layout.height)}>
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
                                    heading={navigation.headingDeg}
                                    receivedAt={navigation.positionReceivedAt} isConnected={isConnected}
                                    isNightMode={isNightMode} backgroundColor={props.theme.bg} />
                                {hasActiveWaypoint && <WaypointPreviewPanel width={heelWidth} waypoint={props.waypoint} />}
                            </View>
                        )}
                    </ScrollView>
                    </View>
                </View>
            </View>
        </View>
    );
}

const localStyles = StyleSheet.create({
    screen: { flex: 1, padding: 8 },
    frame: { flex: 1, paddingTop: 6, borderWidth: 2, borderColor: '#333', borderRadius: 25, overflow: 'hidden' },
    columns: { flex: 1, flexDirection: 'row', minHeight: 0 },
    compass: { width: '50%', alignItems: 'center' },
    gaugeArea: { position: 'absolute', left: 0, right: 0, alignItems: 'center', justifyContent: 'center' },
    leftHeader: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 2 },
    controls: { width: '50%', flexGrow: 0 },
    controlsContent: { flexGrow: 1, justifyContent: 'flex-start', alignItems: 'center', paddingBottom: 8 },
});
