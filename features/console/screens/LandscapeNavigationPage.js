import { useControlScale } from '../../../hooks/useControlScale';
import { useCallback, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import HeadingGauge from '../../../components/gauges/HeadingGauge';
import HeelPanel, { HEEL_PANEL_ASPECT_RATIO } from '../../../components/gauges/HeelPanel';
import ConnectionHeader from '../components/ConnectionHeader';
import AisToggleButton from '../components/AisToggleButton';
import AnchorButton from '../components/AnchorButton';
import SoftwareVersion from '../components/SoftwareVersion';
import NavigationControls from '../components/NavigationControls';
import ConsoleBackground from '../components/ConsoleBackground';
import GpsPositionPanel, { GPS_PANEL_HEIGHT } from '../components/GpsPositionPanel';
import WaypointPreviewPanel, { WAYPOINT_PREVIEW_HEIGHT } from '../components/WaypointPreviewPanel';
import { isHeelAlarmActive } from '../model/heelAlarm.js';

/** Dos mitades: compás a la izquierda y controles a la derecha. */
export default function LandscapeNavigationPage(props) {
    const controlScale = useControlScale();
    const { navigation, settings, isConnected, isNightMode, onOpenSettings } = props;
    const hasActiveWaypoint = Boolean(props.waypoint);
    const [area, setArea] = useState({ width: 0, height: 0 });
    const [controlsHeight, setControlsHeight] = useState(0);
    const [bottomControlsHeight, setBottomControlsHeight] = useState(0);
    const [headerHeight, setHeaderHeight] = useState(0);
    const [scrollOffset, setScrollOffset] = useState(0);
    const columnsRef = useRef(null);
    const scrollOffsetRef = useRef(0);
    const [columnsOrigin, setColumnsOrigin] = useState(null);
    const [fullscreenBounds, setFullscreenBounds] = useState(null);
    const [maxTwsBounds, setMaxTwsBounds] = useState(null);
    const recordMaxTwsBounds = useCallback(bounds => {
        setMaxTwsBounds({ ...bounds, scrollOffset: scrollOffsetRef.current });
    }, []);
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
    const gaugeTop = Math.max(48 * controlScale, headerHeight + 8 * controlScale);
    const aisHeight = props.aisVisible ? 60 * controlScale + 2 : 44 * controlScale;
    const gaugeBottom = aisBottom
        + (bottomControlsHeight || aisHeight + (44 + 8) * controlScale) + 8 * controlScale;
    const gaugeSize = Math.max(1, Math.min(previousGaugeSize * 1.10, columnWidth - 4,
        area.height - gaugeTop - gaugeBottom));
    const controlsWidth = Math.max(1, area.width - gaugeColumnWidth);
    const itemWidth = Math.max(1, (controlsWidth - 24) / 3);
    const summaryFontSize = Math.min(Math.round(itemWidth * 0.07), 32);
    const versionGap = columnsOrigin && fullscreenBounds && maxTwsBounds ? {
        left: fullscreenBounds.x + fullscreenBounds.width - columnsOrigin.x,
        width: Math.max(0, maxTwsBounds.x - fullscreenBounds.x - fullscreenBounds.width),
        top: ((fullscreenBounds.y + fullscreenBounds.height / 2)
            + (maxTwsBounds.y + maxTwsBounds.height / 2 - (scrollOffset - maxTwsBounds.scrollOffset))) / 2
            - columnsOrigin.y - 21,
    } : null;
    const heelWidth = Math.max(1, controlsWidth - 9);
    // Alturas reales: resumen (45), márgenes de las dos filas (28) y escora (16).
    const controlsSpacing = 45 + 28 + 16 + 8 * controlScale;
    // El destino incluye su altura, padding de diseño y márgenes superior e inferior.
    const waypointHeight = hasActiveWaypoint ? (WAYPOINT_PREVIEW_HEIGHT + 5 + 5 + 3) * controlScale : 0;
    // Repartir todo el espacio restante entre las dos filas, dejando 8 px al final.
    // En pantallas bajas se conserva el mínimo legible y el desplazamiento vertical.
    const cardHeight = Math.max(80, (area.height - controlsTop - 8
        - heelWidth * HEEL_PANEL_ASPECT_RATIO - GPS_PANEL_HEIGHT * controlScale
        - waypointHeight - controlsSpacing) / 2);
    const layoutReady = area.width > 0 && area.height > 0 && headerHeight > 0
        && controlsHeight > 0 && bottomControlsHeight > 0;

    return (
        <View style={[localStyles.screen, { backgroundColor: isNightMode ? '#050000' : '#0a0a0a' }]}>
            <View
                style={[localStyles.frame, isNightMode && { borderColor: '#400' }]}
            >
                <ConsoleBackground isNightMode={isNightMode} />
                <View
                    ref={columnsRef}
                    style={[localStyles.columns, { opacity: layoutReady ? 1 : 0 }]}
                    onLayout={({ nativeEvent }) => {
                        setArea(nativeEvent.layout);
                        columnsRef.current?.measureInWindow((x, y) => setColumnsOrigin({ x, y }));
                    }}
                >
                    <View style={[localStyles.compass, { width: gaugeColumnWidth }]}>
                        <View style={localStyles.leftHeader}
                            onLayout={({ nativeEvent }) => setHeaderHeight(nativeEvent.layout.height)}>
                <ConnectionHeader
                    settings={settings}
                    navigation={navigation}
                    isConnected={isConnected}
                    isNightMode={isNightMode}
                    onOpenSettings={onOpenSettings}
                    onFullscreenBounds={setFullscreenBounds}
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
                            <View style={{ width: '100%', gap: 8 * controlScale }}
                                onLayout={({ nativeEvent }) => setBottomControlsHeight(nativeEvent.layout.height)}>
                                <AnchorButton position={navigation.position} receivedAt={navigation.positionReceivedAt} connected={isConnected} />
                                <AisToggleButton targets={props.aisTargets} position={navigation.position} positionReceivedAt={navigation.positionReceivedAt} connected={isConnected && props.aisStatus === 'connected'} visibleCount={props.aisVisibleCount} fullWidth auto={props.aisAuto} onToggleAuto={props.onToggleAisAuto} rangeNm={props.aisRangeNm} onRangeChange={props.onAisRangeChange} visible={props.aisVisible} onPress={props.onToggleAis} />
                            </View>
                        </View>
                    </View>
                    <View style={[localStyles.controls, { width: Math.max(0, area.width - gaugeColumnWidth) }]}>
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        style={{ flex: 1 }}
                        onScroll={({ nativeEvent }) => {
                            scrollOffsetRef.current = nativeEvent.contentOffset.y;
                            setScrollOffset(nativeEvent.contentOffset.y);
                        }}
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
                                    onMaxTwsBounds={recordMaxTwsBounds}
                                />
                                <HeelPanel
                                    backgroundColor={props.theme.bg}
                                    alarmActive={isHeelAlarmActive(navigation.vesselHeelDeg, settings.heelAlarmDegrees)}
                                    alarmColor={props.theme.alarm}
                                    rudderAngle={navigation.rudderAngle}
                                    rudderLimit={settings.rudderLimit}
                                    heel={navigation.vesselHeelDeg}
                                    width={heelWidth}
                                    isNightMode={isNightMode}
                                />
                                <GpsPositionPanel width={heelWidth} position={navigation.position}
                                    waterTemperatureCelsius={navigation.waterTemperatureCelsius}
                                    heading={navigation.headingDeg}
                                    receivedAt={navigation.positionReceivedAt} isConnected={isConnected}
                                    isNightMode={isNightMode} backgroundColor={props.theme.bg} />
                                <WaypointPreviewPanel width={heelWidth} waypoint={props.waypoint} />
                            </View>
                        )}
                    </ScrollView>
                    </View>
                    {versionGap && versionGap.width > 0 && <View pointerEvents="none"
                        style={{ position: 'absolute', zIndex: 3, ...versionGap, height: 42,
                            paddingHorizontal: 8 * controlScale, alignItems: 'center', justifyContent: 'center' }}>
                        <SoftwareVersion availableWidth={Math.max(0, versionGap.width - 16 * controlScale)}
                            style={{ textAlign: 'center', fontSize: summaryFontSize,
                            lineHeight: Math.ceil(summaryFontSize * 1.35) }} />
                    </View>}
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
