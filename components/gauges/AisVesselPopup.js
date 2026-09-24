import { useTranslation } from '../../localization/LanguageProvider';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import NightDimmer from '../NightDimmer';
import { formatCoordinate } from '../../features/console/model/gpsPosition';

export default function AisVesselPopup({ vessel, onClose }) {
    const { t } = useTranslation();
    if (!vessel) return null;
    const speed = vessel['navigation.speedOverGround'];
    const course = vessel['navigation.courseOverGroundTrue'];
    const position = vessel['navigation.position'];
    const rows = [
        ['MMSI', vessel.mmsi || vessel.id.match(/mmsi:(\d+)$/)?.[1] || '—'],
        [t('distance'), `${vessel.distanceNm.toFixed(2)} NM`],
        [t('speed'), Number.isFinite(speed) ? `${(speed * 1.94384).toFixed(1)} kn` : '—'],
        [t('course'), Number.isFinite(course) ? `${Math.round(((course * 180 / Math.PI) % 360 + 360) % 360) % 360}°` : '—'],
        ['LAT', formatCoordinate(position?.latitude, true)],
        ['LON', formatCoordinate(position?.longitude, false)],
    ];
    return <Modal transparent visible statusBarTranslucent navigationBarTranslucent animationType="fade" onRequestClose={onClose}>
        <View style={styles.overlay}>
            <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} accessibilityLabel={t('closeAis')} />
            <View style={styles.panel} accessibilityViewIsModal>
                <Text style={styles.title}>{vessel.name || t('vessel')}</Text>
                {rows.map(([label, value]) => <View key={label} style={styles.row}>
                    <Text style={styles.label}>{label}</Text>
                    <Text style={styles.value}>{value}</Text>
                </View>)}
            </View>
            <NightDimmer />
        </View>
    </Modal>;
}

const styles = StyleSheet.create({
    overlay: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.55)' },
    panel: { width: '90%', maxWidth: 420, padding: 20, borderRadius: 18, borderWidth: 1, borderColor: '#73a9bb', backgroundColor: '#10202c' },
    title: { fontFamily: 'NauticalFont', color: '#45d39a', fontSize: 17, textAlign: 'center', marginBottom: 16 },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginVertical: 5 },
    label: { fontFamily: 'NauticalFont', color: '#8fcbdc', fontSize: 10 },
    value: { fontFamily: 'NauticalFont', color: '#fff', fontSize: 12, flexShrink: 1, textAlign: 'right' },
});
