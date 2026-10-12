import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from '../../../localization/LanguageProvider';
import AnchorSetupModal from './AnchorSetupModal';
import { useControlScale } from '../../../hooks/useControlScale';

/** Entrada a la futura vigilancia de fondeo; todavía no activa ninguna alarma. */
export default function AnchorButton({ position, receivedAt, connected }) {
    const { t } = useTranslation();
    const scale = useControlScale();
    const [open, setOpen] = useState(false);
    return <>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel={t('anchorButton')}
            onPress={() => setOpen(true)} style={[styles.button, { minHeight: 44 * scale, paddingHorizontal: 12 * scale }]}>
            <Feather name="anchor" size={20 * scale} color="#aaa" />
            <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.text, { fontSize: 12 * scale, flexShrink: 1 }]}>{t('anchorButton')}</Text>
        </TouchableOpacity>
        <AnchorSetupModal visible={open} onClose={() => setOpen(false)}
            position={position} receivedAt={receivedAt} connected={connected} />
    </>;
}

const styles = StyleSheet.create({
    button: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
        flexShrink: 1, borderRadius: 10, borderWidth: 1, borderColor: '#aaa',
        backgroundColor: '#10202c', alignSelf: 'flex-start' },
    text: { fontFamily: 'NauticalFont', color: '#8fcbdc' },
    backdrop: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.7)', padding: 20 },
    panel: { width: '100%', maxWidth: 560, padding: 24, gap: 20, alignItems: 'center',
        backgroundColor: '#10202c', borderColor: '#58788b', borderWidth: 1, borderRadius: 18 },
    close: { borderWidth: 1, borderColor: '#58788b', borderRadius: 10 },
});
