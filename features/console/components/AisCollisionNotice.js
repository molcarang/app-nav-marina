import { useEffect, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from '../../../localization/LanguageProvider';
import { AIS_RISK_COLORS } from '../model/aisCollisionRisk';
import { aisAlertSnapshot, hasNewAisAlert, reconcileAisAcknowledgement } from '../model/aisAlertState.js';
import NightDimmer from '../../../components/NightDimmer';

/** Closing an approach notice is independent of muting its audio. */
export default function AisCollisionNotice({ targets }) {
    const { t } = useTranslation();
    const snapshot = aisAlertSnapshot(targets);
    const alertKey = JSON.stringify(snapshot);
    const [dismissedFor, setDismissedFor] = useState(null);
    useEffect(() => {
        setDismissedFor(previous => reconcileAisAcknowledgement(previous, JSON.parse(alertKey)));
    }, [alertKey]);
    const alerts = snapshot.map(([id]) => [id, targets[id]])
        .sort(([, a], [, b]) => (b.collision.level === 'danger') - (a.collision.level === 'danger')
            || (a.collision.tcpaMinutes ?? 0) - (b.collision.tcpaMinutes ?? 0));
    const visible = hasNewAisAlert(dismissedFor, snapshot);
    const close = () => setDismissedFor(Object.fromEntries(snapshot));
    const level = alerts[0]?.[1].collision.level ?? 'warning';
    const color = AIS_RISK_COLORS[level];
    return <Modal visible={visible} transparent animationType="fade" statusBarTranslucent navigationBarTranslucent onRequestClose={close}>
        <View style={styles.overlay}>
            <View style={[styles.panel, { borderColor: color }]} accessibilityViewIsModal>
                <View style={styles.header}>
                    <Text accessibilityRole="header" style={[styles.title, { color }]}>{t(`aisRisk_${level}`)}</Text>
                    <TouchableOpacity accessibilityRole="button" accessibilityLabel={t('aisNoticeClose')}
                        onPress={close} style={styles.close}>
                        <Text style={styles.closeText}>{t('anchorClose')}</Text>
                    </TouchableOpacity>
                </View>
                <ScrollView style={styles.list} contentContainerStyle={styles.content}>
                    {alerts.map(([id, vessel]) => {
                        const risk = vessel.collision;
                        return <View key={id} style={styles.vessel}>
                            <Text style={styles.name}>{vessel.name || vessel.mmsi || id}</Text>
                            <Text style={[styles.level, { color: AIS_RISK_COLORS[risk.level] }]}>{t(`aisRisk_${risk.level}`)}</Text>
                            <View style={styles.row}>
                                <Text style={styles.label}>CPA</Text>
                                <Text style={styles.value}>{Number.isFinite(risk.cpaNm) ? `${risk.cpaNm.toFixed(2)} NM` : '—'}</Text>
                            </View>
                            <View style={styles.row}>
                                <Text style={styles.label}>TCPA</Text>
                                <Text style={styles.value}>{risk.tcpaMinutes < 0 ? t('aisRiskReceding')
                                    : Number.isFinite(risk.tcpaMinutes) ? `${risk.tcpaMinutes.toFixed(1)} min` : t('aisRiskProximity')}</Text>
                            </View>
                        </View>;
                    })}
                </ScrollView>
            </View>
            <NightDimmer />
        </View>
    </Modal>;
}

const styles = StyleSheet.create({
    overlay: { flex: 1, padding: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.6)' },
    panel: { width: '100%', maxWidth: 520, maxHeight: '85%', borderWidth: 2, borderRadius: 18, padding: 18, backgroundColor: '#10202c' },
    header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
    title: { flex: 1, fontFamily: 'NauticalFont', fontSize: 18 },
    close: { minWidth: 74, minHeight: 44, paddingHorizontal: 12, justifyContent: 'center', alignItems: 'center', borderRadius: 10, borderWidth: 1, borderColor: '#6d8d9e' },
    closeText: { color: '#eaf2f8', fontSize: 14 },
    list: { flexShrink: 1 }, content: { gap: 12 },
    vessel: { padding: 14, gap: 8, borderWidth: 1, borderColor: '#294452', borderRadius: 10 },
    name: { color: '#eaf2f8', fontFamily: 'NauticalFont', fontSize: 16 },
    level: { fontSize: 13 },
    row: { flexDirection: 'row', justifyContent: 'space-between', gap: 14 },
    label: { color: '#8fcbdc', fontSize: 13 }, value: { color: '#fff', fontSize: 15, flexShrink: 1 },
});
