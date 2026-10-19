import { useContext, useState } from 'react';
import { BackHandler, Modal, Platform, Text, TouchableOpacity, View } from 'react-native';
import buildInfo from '../../../config/buildInfo.json';
import { useTranslation } from '../../../localization/LanguageProvider';
import { useResponsiveStyles } from '../../../hooks/useControlScale';
import { AnchorWatchContext } from '../hooks/useAnchorWatch';
import { exitRaspberryApplication } from '../../../services/updates/raspberry';
import { styles as baseStyles } from '../styles/settingsStyles';
import NightDimmer from '../../../components/NightDimmer';

export default function AppExitButton() {
    const { t } = useTranslation();
    const styles = useResponsiveStyles(baseStyles);
    const watch = useContext(AnchorWatchContext);
    const [confirming, setConfirming] = useState(false);
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState('');
    const cancel = () => { if (!busy) { setConfirming(false); setMessage(''); } };
    const exit = async () => {
        if (busy) return;
        setBusy(true);
        setMessage('');
        try {
            if (Platform.OS === 'web' && buildInfo.target === 'raspberry') {
                await exitRaspberryApplication();
                setMessage('exitClosing');
            } else if (Platform.OS === 'web') {
                window.close();
                // A regular browser tab may reject window.close(). Keep the console running.
                setMessage('exitManual');
            } else if (Platform.OS === 'android') {
                BackHandler.exitApp();
            } else setMessage('exitManual');
        } catch { setMessage('exitFailed'); }
        finally { setBusy(false); }
    };
    return <>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel={t('exitApplication')}
            onPress={() => setConfirming(true)} style={styles.exitHeaderButton}>
            <Text numberOfLines={1} style={styles.exitHeaderText}>{t('close')}</Text>
        </TouchableOpacity>
        <Modal visible={confirming} transparent animationType="fade" statusBarTranslucent
            navigationBarTranslucent onRequestClose={cancel}>
        <View style={styles.modalOverlay}>
        <View style={styles.exitDialog}>
            <Text style={styles.exitTitle}>{t('exitConfirm')}</Text>
            {!!watch?.draft && <Text style={styles.exitWarning}>{t('exitAnchorWarning')}</Text>}
            <View style={styles.exitActions}>
                <TouchableOpacity accessibilityRole="button" disabled={busy}
                    onPress={cancel} style={styles.exitCancel}>
                    <Text style={styles.closeBtnText}>{t('exitCancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity accessibilityRole="button" disabled={busy} onPress={exit}
                    style={[styles.exitConfirm, busy && { opacity: 0.5 }]}>
                    <Text style={styles.closeBtnText}>{t(busy ? 'exitClosing' : 'exitConfirmButton')}</Text>
                </TouchableOpacity>
            </View>
        {!!message && <Text accessibilityLiveRegion="polite" style={styles.serverHint}>{t(message)}</Text>}
        </View>
        <NightDimmer />
        </View>
        </Modal>
    </>;
}
