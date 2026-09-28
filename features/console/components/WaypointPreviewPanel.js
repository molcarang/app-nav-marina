import { useControlScale, useResponsiveStyles } from '../../../hooks/useControlScale';
import { MaterialIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import CrossTrackRibbon from '../../../components/gauges/CrossTrackRibbon';
import { useTranslation } from '../../../localization/LanguageProvider';
import WaypointMapBackground from './WaypointMapBackground';

export const WAYPOINT_PREVIEW_HEIGHT = 108;

/** Presentación compartida por el destino real y la demostración explícita. */
export default function WaypointPreviewPanel({ width, waypoint }) {
    const scale = useControlScale();
    const styles = useResponsiveStyles(baseStyles);
    const { t } = useTranslation();
    if (!waypoint) return null;
    const timeMinutes = waypoint.timeMinutes;
    const totalMinutes = Number.isFinite(timeMinutes) && timeMinutes >= 0
        ? Math.ceil(timeMinutes) : null;
    const offset = waypoint.crossTrackNm;
    const validOffset = Number.isFinite(offset);
    const color = offset < 0 ? '#dc1212' : '#45d39a';
    const side = !validOffset ? '—' : Math.abs(offset) < 0.0005 ? t('centered') : t(offset < 0 ? 'port' : 'starboard');
    return (
        <View style={[styles.panel, { width }]}>
            <WaypointMapBackground />
            <View style={styles.content}>
                <View style={styles.leftZone}>
                    <View style={styles.header}>
                        <MaterialIcons name="outlined-flag" size={17 * scale} color="#8fcbdc" />
                        <Text numberOfLines={1} adjustsFontSizeToFit style={styles.destination}>{waypoint.name || t('waypointDestination')}</Text>
                    </View>
                    <View style={styles.metricRow}>
                        <Text numberOfLines={1} adjustsFontSizeToFit style={styles.metricLabel}>{t('waypointDistance')}</Text>
                        <Text numberOfLines={1} adjustsFontSizeToFit style={styles.metricValue}>
                            {Number.isFinite(waypoint.distanceNm) ? waypoint.distanceNm.toFixed(2) : '—'}<Text style={styles.unit}> NM</Text>
                        </Text>
                    </View>
                    <View style={[styles.metricRow, styles.lastMetric]}>
                        <Text numberOfLines={1} adjustsFontSizeToFit style={styles.metricLabel}>{t('waypointTime')}</Text>
                        <Text numberOfLines={1} adjustsFontSizeToFit style={styles.metricValue}>
                            {totalMinutes === null ? '—' : <>
                                {Math.floor(totalMinutes / 60)}<Text style={styles.unit}> h </Text>
                                {String(totalMinutes % 60).padStart(2, '0')}<Text style={styles.unit}> min</Text>
                            </>}
                        </Text>
                    </View>
                </View>
                <View style={styles.middleZone}>
                    <View style={styles.titleRow}>
                        <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.label, styles.sectionTitle]}>{t('waypointOffset')}</Text>
                    </View>
                    <CrossTrackRibbon height={45 * scale} offset={offset} />
                    <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.offset, { color: validOffset ? color : '#8fcbdc' }]}>{validOffset ? `${Math.abs(offset).toFixed(2)} NM · ${side}` : '—'}</Text>
                </View>
                <View style={styles.bearingZone}>
                    <View style={styles.titleRow}>
                        <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.label, styles.sectionTitle]}>{t('waypointBearing')}</Text>
                    </View>
                    <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5} style={styles.bearing}>
                        {Number.isFinite(waypoint.bearingDeg) ? `${Math.round(waypoint.bearingDeg) % 360}°` : '—'}<Text style={styles.bearingUnit}> T</Text>
                    </Text>
                </View>
            </View>
        </View>
    );
}

const baseStyles = StyleSheet.create({
    panel: { height: WAYPOINT_PREVIEW_HEIGHT + 5, marginTop: 5, marginBottom: 3, borderRadius: 15, borderWidth: 1, overflow: 'hidden',
        borderColor: '#456777', backgroundColor: '#10202c', paddingHorizontal: 12, paddingVertical: 9 },
    header: { height: 20, flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 4 },
    destination: { fontFamily: 'NauticalFont', color: '#eaf2f8', fontSize: 11, flex: 1 },
    content: { flex: 1, flexDirection: 'row', alignItems: 'stretch' },
    leftZone: { width: '34%', paddingRight: 10, justifyContent: 'flex-start' },
    middleZone: { width: '40%', paddingHorizontal: 10, justifyContent: 'flex-start', borderLeftWidth: 1, borderLeftColor: '#456777' },
    bearingZone: { width: '26%', borderLeftWidth: 1, borderLeftColor: '#456777', paddingLeft: 8, justifyContent: 'flex-start', alignItems: 'center', backgroundColor: 'rgba(6, 18, 28, 0.2)' },
    bearing: { fontFamily: 'NauticalFont', fontSize: 34, color: '#e5be78', textAlign: 'center', width: '100%' },
    bearingUnit: { fontFamily: 'NauticalFont', fontSize: 16 },
    titleRow: { height: 20, justifyContent: 'center', marginBottom: 4 },
    label: { fontFamily: 'NauticalFont', fontSize: 8, color: '#8fcbdc' },
    sectionTitle: { fontSize: 11 },
    metricRow: { height: 32, paddingHorizontal: 6, borderBottomWidth: 1, borderBottomColor: 'rgba(143,203,220,0.15)', marginBottom: 3 },
    lastMetric: { borderBottomWidth: 0, marginBottom: 0 },
    metricLabel: { fontFamily: 'NauticalFont', fontSize: 8, lineHeight: 10, color: '#8fcbdc' },
    metricValue: { fontFamily: 'NauticalFont', fontSize: 15, lineHeight: 21, color: '#eaf2f8', width: '100%', textAlign: 'right' },
    unit: { fontFamily: 'NauticalFont', fontSize: 9, color: '#8fcbdc' },
    offset: { fontFamily: 'NauticalFont', fontSize: 8, color: '#45d39a', textAlign: 'center' },
});
