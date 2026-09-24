import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { formatCoordinate, isValidPosition } from '../model/gpsPosition.js';
import HorizontalCompass from '../../../components/gauges/HorizontalCompass';
import GpsMapBackground from './GpsMapBackground';

export const GPS_PANEL_HEIGHT = 84;

export default function GpsPositionPanel({ width, position, receivedAt, isConnected, isNightMode, backgroundColor, heading }) {
    const [now, setNow] = useState(Date.now);
    useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), 5000);
        return () => clearInterval(timer);
    }, []);
    const valid = isValidPosition(position);
    const fresh = isConnected && valid && Number.isFinite(receivedAt) && now - receivedAt < 30000;
    const foreground = isNightMode ? '#c49797' : '#f3f6fa';
    const accent = isNightMode ? '#9d7777' : '#8fcbdc';
    return (
        <View style={[styles.panel, { width, height: GPS_PANEL_HEIGHT, backgroundColor,
            borderColor: isNightMode ? '#795353' : '#777' }]}>
            <GpsMapBackground isNightMode={isNightMode} />
            <View style={styles.coordinates}>
                {[{ label: 'LAT', value: valid ? formatCoordinate(position.latitude, true) : '—' },
                    { label: 'LON', value: valid ? formatCoordinate(position.longitude, false) : '—' }].map(item => (
                    <View key={item.label} style={styles.coordinate}>
                        <Text style={[styles.label, { color: accent }]}>{item.label}</Text>
                        <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.value, { color: foreground, opacity: fresh ? 1 : 0.5 }]}>{item.value}</Text>
                    </View>
                ))}
                {!fresh && <Text numberOfLines={1} style={[styles.status, { color: accent }]}>{valid ? 'SIN ACTUALIZAR' : 'SIN DATOS'}</Text>}
            </View>
            <View pointerEvents="none" style={[styles.divider, { backgroundColor: isNightMode ? '#795353' : '#777' }]} />
            <View style={styles.rightArea}>
                <HorizontalCompass heading={heading} isConnected={isConnected} isNightMode={isNightMode} />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    panel: { borderRadius: 15, borderWidth: 1, flexDirection: 'row', marginBottom: 8, overflow: 'hidden' },
    status: { fontFamily: 'NauticalFont', fontSize: 8, marginTop: 4 },
    coordinates: { width: '50%', justifyContent: 'center', paddingHorizontal: 10, paddingVertical: 8, gap: 6,
        overflow: 'hidden', borderTopLeftRadius: 14, borderBottomLeftRadius: 14 },
    coordinate: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    label: { fontFamily: 'NauticalFont', fontSize: 9 },
    value: { fontFamily: 'NauticalFont', fontSize: 14, flex: 1, textAlign: 'right' },
    divider: { position: 'absolute', left: '50%', top: 8, bottom: 8, width: 1, opacity: 0.4 },
    rightArea: { width: '50%' },
});
