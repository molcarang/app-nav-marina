import { useEffect, useRef, useState } from 'react';
import { Linking, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import buildInfo from '../config/buildInfo.json';
import { checkForUpdate } from '../services/updates/releases';
import { getRaspberryUpdateStatus, installRaspberryUpdate } from '../services/updates/raspberry';
import { useTranslation } from '../localization/LanguageProvider';

const BUSY = ['downloading', 'verifying', 'installing'];
const RASPBERRY = buildInfo.target === 'raspberry';

export default function UpdateNotice() {
    const { t } = useTranslation();
    const [update, setUpdate] = useState(null);
    const [dismissed, setDismissed] = useState(false);
    const [failed, setFailed] = useState(false);
    const [local, setLocal] = useState(null);
    const [phase, setPhase] = useState('idle');
    const [confirming, setConfirming] = useState(false);
    const [starting, setStarting] = useState(false);
    const installing = useRef(false);
    const busy = BUSY.includes(phase);
    useEffect(() => {
        if (Platform.OS !== 'web') return;
        let mounted = true;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        checkForUpdate(buildInfo, { signal: controller.signal }).then(result => {
            if (mounted && !controller.signal.aborted) setUpdate(result);
        }).catch(() => { /* Sin Internet, el arranque continua normalmente. */ })
            .finally(() => clearTimeout(timeout));
        if (RASPBERRY) getRaspberryUpdateStatus().then(status => {
            if (!mounted) return;
            setLocal(status);
            if (status.installed?.buildNumber > buildInfo.buildNumber) setPhase('ready');
            else if (BUSY.includes(status.state)) setPhase(status.state);
        }).catch(() => { /* Instalador antiguo: ofrecer descarga manual. */ });
        return () => { mounted = false; controller.abort(); clearTimeout(timeout); };
    }, []);
    useEffect(() => {
        if (!busy) return;
        let mounted = true;
        let timer;
        const poll = async () => {
            try {
                const status = await getRaspberryUpdateStatus();
                if (!mounted) return;
                setLocal(status);
                setPhase(status.installed?.buildNumber > buildInfo.buildNumber ? 'ready' : status.state);
                if (BUSY.includes(status.state) && status.installed?.buildNumber <= buildInfo.buildNumber) timer = setTimeout(poll, 1000);
            } catch { if (mounted) setPhase('error'); }
        };
        timer = setTimeout(poll, 1000);
        return () => { mounted = false; clearTimeout(timer); };
    }, [busy]);
    if (dismissed || (!update && !busy && !starting && phase !== 'ready' && phase !== 'error')) return null;
    const download = () => {
        setFailed(false);
        Linking.openURL(update.url).catch(() => setFailed(true));
    };
    const install = async () => {
        if (installing.current) return;
        installing.current = true;
        setStarting(true);
        setConfirming(false);
        setFailed(false);
        try {
            // Refresh the local token and check no other update started meanwhile.
            const status = await getRaspberryUpdateStatus();
            setLocal(status);
            if (status.installed?.buildNumber >= update.buildNumber) {
                setPhase('ready');
                return;
            }
            if (BUSY.includes(status.state)) {
                setPhase(status.state);
                return;
            }
            await installRaspberryUpdate(update.releaseId, status.token);
            setPhase('downloading');
        } catch { setPhase('error'); }
        finally { installing.current = false; setStarting(false); }
    };
    const action = (key, onPress) => <TouchableOpacity accessibilityRole="button" onPress={onPress} style={styles.button}>
        <Text style={styles.text}>{t(key)}</Text>
    </TouchableOpacity>;
    const canInstall = RASPBERRY && local && Number.isSafeInteger(update?.releaseId);
    return <View style={styles.banner}>
        <View style={styles.message}>
            <Text accessibilityLiveRegion="polite" style={styles.text}>
                {t(starting ? 'updatePhase_downloading' : busy || phase === 'ready' || phase === 'error' ? `updatePhase_${phase}` : confirming ? 'updateConfirm'
                    : 'updateAvailable', { version: update?.version, build: update?.buildNumber })}
            </Text>
            {RASPBERRY && !local && <Text style={styles.text}>{t('updateManualSetup')}</Text>}
            {failed && <Text style={styles.text}>{t('updateOpenError')}</Text>}
        </View>
        {phase === 'ready' ? action('updateReload', () => window.location.reload()) : !busy && !starting && <>
            {update && (confirming ? action('updateInstallConfirm', install)
                : action(canInstall ? 'updateInstall' : 'updateDownload', canInstall ? () => setConfirming(true) : download))}
            {action(confirming ? 'updateCancel' : 'updateLater', () => {
                if (confirming) setConfirming(false);
                else setDismissed(true);
            })}
        </>}
    </View>;
}
const styles = StyleSheet.create({
    banner: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', padding: 8, gap: 8,
        backgroundColor: '#173e33', borderBottomWidth: 1, borderColor: '#45d39a' },
    message: { flex: 1, minWidth: 120 },
    text: { fontFamily: 'NauticalFont', color: '#c8eedf', fontSize: 11 },
    button: { minHeight: 44, paddingHorizontal: 10, justifyContent: 'center', borderRadius: 8,
        borderWidth: 1, borderColor: '#45d39a' },
});
