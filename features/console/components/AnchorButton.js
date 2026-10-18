import { useContext, useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from '../../../localization/LanguageProvider';
import { AnchorWatchContext } from '../hooks/useAnchorWatch';
import AnchorSetupModal from './AnchorSetupModal';
import AisRadarBackground from './AisRadarBackground';
import { useControlScale } from '../../../hooks/useControlScale';

export default function AnchorButton({ position, receivedAt, connected }) {
    const { t } = useTranslation();
    const scale = useControlScale();
    const [open, setOpen] = useState(false);
    const watch = useContext(AnchorWatchContext);
    const active = Boolean(watch.draft);
    const [lit, setLit] = useState(true);
    useEffect(() => {
        setLit(true);
        if (!active) return;
        const timer = setInterval(() => setLit(value => !value), 600);
        return () => clearInterval(timer);
    }, [active]);
    const color = watch.status === 'outside' ? '#ef6b72' : (watch.status === 'gpsLost' || watch.status === 'pending') ? '#e4bb78' : '#45d39a';
    return <View style={{ width: '100%' }}>
        <View style={[styles.row, { gap: 10 * scale }, active && [styles.panel,
            { padding: 8 * scale, borderRadius: 16 * scale, minHeight: 60 * scale + 2 }]]}>
        {active && <AisRadarBackground />}
        <TouchableOpacity accessibilityRole="button" accessibilityLabel={t(active ? 'anchorArmedHelp' : 'anchorButton')}
            accessibilityHint={active ? t('anchorArmedHelp') : undefined}
            disabled={!watch.ready} delayLongPress={2000} onLongPress={active ? watch.deactivate : undefined}
            onPress={() => setOpen(true)} style={[styles.button, { width: 132 * scale, maxWidth: '100%', minHeight: 44 * scale, paddingHorizontal: 12 * scale }, active && { borderColor: color, backgroundColor: lit ? color : '#10202c' }]}>
            <Feather name="anchor" size={20 * scale} color={active ? (lit ? '#10202c' : color) : '#aaa'} />
            <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.text, { fontSize: 12 * scale, flexShrink: 1, color: active ? (lit ? '#10202c' : color) : '#8fcbdc' }]}>{t('anchorButton')}</Text>
        </TouchableOpacity>
        <View style={{ flex: 1, minWidth: 0, gap: 3 * scale }}>
            <Text numberOfLines={1} adjustsFontSizeToFit accessibilityLiveRegion="polite" style={[styles.text, { color: active ? color : '#aaa', fontSize: 11 * scale }]}>
                {t(!watch.ready ? 'anchorStatus_loading' : `anchorStatus_${watch.status}`)}
            </Text>
            {active && <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.text, { fontSize: 11 * scale }]}>
                {t('anchorWatchDistance', { distance: watch.distanceMeters === null ? '\u2014' : watch.distanceMeters.toFixed(1), radius: watch.draft.radius })}
            </Text>}
        </View>
        </View>
        {!!watch.error && <Text accessibilityLiveRegion="polite" style={styles.text}>{t(watch.error)}</Text>}
        <AnchorSetupModal visible={open} onClose={() => setOpen(false)}
            position={position} receivedAt={receivedAt} connected={connected} />
    </View>;
}

const styles = StyleSheet.create({
    button: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
        flexShrink: 1, borderRadius: 10, borderWidth: 1, borderColor: '#aaa',
        backgroundColor: '#10202c', alignSelf: 'flex-start' },
    text: { fontFamily: 'NauticalFont', color: '#8fcbdc' },
    row: { flexDirection: 'row', alignItems: 'center' },
    panel: { borderWidth: 1, borderColor: '#426777', backgroundColor: 'rgba(10, 28, 40, 0.94)', overflow: 'hidden' },
});
