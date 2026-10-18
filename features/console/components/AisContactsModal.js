import { useEffect, useState } from 'react';
import { FlatList, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from '../../../localization/LanguageProvider';
import { visibleAisContacts } from '../model/aisContacts';
import { isValidPosition } from '../model/gpsPosition';

export default function AisContactsModal({ visible, onClose, targets, position, receivedAt, connected, rangeNm }) {
    const { t } = useTranslation();
    const [, refresh] = useState(0);
    useEffect(() => {
        if (!visible) return;
        const timer = setInterval(() => refresh(value => value + 1), 1000);
        return () => clearInterval(timer);
    }, [visible]);
    const now = Date.now();
    const fresh = isValidPosition(position) && Number.isFinite(receivedAt) && now - receivedAt < 30000;
    const contacts = visibleAisContacts(targets, position, receivedAt, connected, rangeNm, now);
    return <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <View style={styles.backdrop}>
            <View style={styles.panel} accessibilityViewIsModal>
                <View style={styles.header}>
                    <Text accessibilityRole="header" style={styles.title}>{t('aisContactsTitle')}</Text>
                    <TouchableOpacity accessibilityRole="button" onPress={onClose} style={styles.close}>
                        <Text style={styles.text}>{t('anchorClose')}</Text>
                    </TouchableOpacity>
                </View>
                <Text style={styles.subtitle}>{t('aisContactsRange', { range: rangeNm, count: contacts.length })}</Text>
                <FlatList style={styles.list} data={contacts} keyExtractor={item => item.id}
                    ListEmptyComponent={<Text style={styles.empty}>{t(!connected ? 'aisContactsDisconnected'
                        : !fresh ? 'aisContactsGpsNeeded' : 'aisContactsEmpty')}</Text>}
                    renderItem={({ item }) => <View style={styles.row}>
                        <View style={styles.identity}>
                            <Text numberOfLines={1} style={styles.name}>{item.name || t('aisContactUnnamed')}</Text>
                            <Text selectable style={styles.subtitle}>{item.mmsi ? `MMSI: ${item.mmsi}` : `ID: ${item.id.replace(/^vessels\./, '')}`}</Text>
                        </View>
                        <Text style={styles.distance}>{item.distanceNm.toFixed(2)} NM</Text>
                    </View>} />
            </View>
        </View>
    </Modal>;
}

const styles = StyleSheet.create({
    backdrop: { flex: 1, padding: 16, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', alignItems: 'center' },
    panel: { width: '100%', maxWidth: 680, maxHeight: '90%', padding: 16, gap: 12, borderRadius: 18, borderWidth: 1, borderColor: '#58788b', backgroundColor: '#10202c' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
    title: { fontFamily: 'NauticalFont', fontSize: 19, color: '#8fcbdc', flexShrink: 1 },
    close: { minHeight: 44, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1, borderColor: '#58788b', justifyContent: 'center' },
    text: { fontFamily: 'NauticalFont', fontSize: 12, color: '#8fcbdc' },
    subtitle: { fontFamily: 'NauticalFont', fontSize: 11, color: '#9db5bf' },
    list: { flexGrow: 0, flexShrink: 1 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#294452' },
    identity: { flex: 1, minWidth: 0, gap: 5 },
    name: { fontFamily: 'NauticalFont', fontSize: 14, color: '#eaf2f8' },
    distance: { fontFamily: 'NauticalFont', fontSize: 14, color: '#45d39a' },
    empty: { fontFamily: 'NauticalFont', fontSize: 13, color: '#e4bb78', paddingVertical: 20 },
});
