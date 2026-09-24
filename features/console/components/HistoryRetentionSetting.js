import { useTranslation } from '../../../localization/LanguageProvider';
import { useEffect, useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { MAX_HISTORY_HOURS } from '../model/twsHistory.js';
import { styles } from '../styles/settingsStyles';

export default function HistoryRetentionSetting({ hours, visible, onSave, metric = 'TWS', settingKey = 'historyHours' }) {
    const { t } = useTranslation();
    const [draft, setDraft] = useState(String(hours));
    const [message, setMessage] = useState('');
    const [saving, setSaving] = useState(false);
    useEffect(() => { setDraft(String(hours)); }, [hours, visible]);
    async function save() {
        const value = Number(draft);
        if (!draft.trim() || !Number.isInteger(value) || value < 1 || value > MAX_HISTORY_HOURS) {
            setMessage('historyInvalid');
            return;
        }
        setSaving(true);
        try {
            const saved = await onSave(settingKey, value);
            setMessage(saved ? 'historySaved' : 'saveError');
        } catch { setMessage('saveError'); }
        finally { setSaving(false); }
    }
    return (
        <View style={styles.settingRowContainer}>
            <Text style={styles.settingLabel}>{t('historyTitle', { metric })}</Text>
            <TextInput style={styles.serverInput} value={draft}
                onChangeText={text => { setDraft(text); setMessage(''); }}
                keyboardType="number-pad" editable={!saving} maxLength={2}
                accessibilityLabel={t('historyLabel', { metric })} />
            <Text style={styles.serverHint}>{t('historyHint', { max: MAX_HISTORY_HOURS })}</Text>
            <TouchableOpacity accessibilityRole="button" disabled={saving} onPress={save}
                style={[styles.serverSave, saving && { opacity: 0.5 }]}>
                <Text style={styles.closeBtnText}>{saving ? t('saving') : t('saveHours')}</Text>
            </TouchableOpacity>
            {!!message && <Text accessibilityLiveRegion="polite" style={styles.serverHint}>{t(message, { max: MAX_HISTORY_HOURS })}</Text>}
        </View>
    );
}
