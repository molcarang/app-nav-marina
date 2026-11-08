import { useEffect, useRef, useState } from 'react';
import { Feather } from '@expo/vector-icons';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTranslation } from '../../../localization/LanguageProvider';
import { useControlScale, useResponsiveStyles } from '../../../hooks/useControlScale';
import { styles as baseStyles } from '../styles/settingsStyles';
import { normalizeEngineConsumptionTable, parseEngineConsumptionRows } from '../model/engineConsumptionTable.js';

const draftRows = table => normalizeEngineConsumptionTable(table).map((entry, index) => ({
    id: `saved-${index}`, rpm: String(entry.rpm), litresPerHour: String(entry.litresPerHour),
}));

export default function EngineConsumptionSettings({ settings, visible, onSave }) {
    const { t } = useTranslation();
    const styles = useResponsiveStyles(baseStyles);
    const scale = useControlScale();
    const [rows, setRows] = useState(() => draftRows(settings.engineConsumptionTable));
    const [message, setMessage] = useState(null);
    const [saving, setSaving] = useState(false);
    const nextId = useRef(0);
    useEffect(() => {
        if (visible) setRows(draftRows(settings.engineConsumptionTable));
    }, [settings.engineConsumptionTable, visible]);
    useEffect(() => { if (visible) setMessage(null); }, [visible]);

    function change(id, key, value) {
        setRows(previous => previous.map(row => row.id === id ? { ...row, [key]: value } : row));
        setMessage(null);
    }
    function add() {
        const id = `new-${nextId.current++}`;
        setRows(previous => [...previous, { id, rpm: '', litresPerHour: '' }]);
        setMessage(null);
    }
    function remove(id) {
        setRows(previous => previous.filter(row => row.id !== id));
        setMessage(null);
    }
    async function save() {
        const result = parseEngineConsumptionRows(rows);
        if (result.error) { setMessage({ key: result.error, row: result.row }); return; }
        setSaving(true);
        try {
            const saved = await onSave('engineConsumptionTable', result.table);
            setMessage({ key: saved ? 'consumptionTableSaved' : 'saveError' });
        } catch { setMessage({ key: 'saveError' }); }
        finally { setSaving(false); }
    }

    return <View style={styles.settingRowContainer}>
        <Text style={[styles.settingLabel, { color: '#ff9800', fontWeight: 'bold' }]}>{t('consumptionTableTitle')}</Text>
        <Text style={[styles.serverHint, { marginBottom: 12 * scale }]}>{t('consumptionTableHint')}</Text>
        {rows.length === 0 && <Text style={styles.serverHint}>{t('consumptionTableEmpty')}</Text>}
        {rows.length > 0 && <View style={{ flexDirection: 'row', gap: 8 * scale }}>
            <Text style={[styles.settingLabel, { flex: 1 }]}>RPM</Text>
            <Text style={[styles.settingLabel, { flex: 1 }]}>L/h</Text>
            <View style={{ width: 44 * scale }} />
        </View>}
        {rows.map((row, index) => <View key={row.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 * scale }}>
            <TextInput accessibilityLabel={t('consumptionTableRpmField', { row: index + 1 })}
                keyboardType="number-pad" maxLength={5} placeholder="RPM" placeholderTextColor="#748895"
                style={[styles.serverInput, { flex: 1, minWidth: 0 }]} value={row.rpm} editable={!saving}
                onChangeText={value => change(row.id, 'rpm', value)} />
            <TextInput accessibilityLabel={t('consumptionTableLitresField', { row: index + 1 })}
                keyboardType="decimal-pad" maxLength={12} placeholder="L/h" placeholderTextColor="#748895"
                style={[styles.serverInput, { flex: 1, minWidth: 0 }]} value={row.litresPerHour} editable={!saving}
                onChangeText={value => change(row.id, 'litresPerHour', value)} />
            <TouchableOpacity accessibilityRole="button" accessibilityLabel={t('consumptionTableRemove', { row: index + 1 })}
                disabled={saving} onPress={() => remove(row.id)}
                style={{ width: 44 * scale, minHeight: 44 * scale, marginTop: 8 * scale,
                    borderRadius: 8 * scale, alignItems: 'center', justifyContent: 'center', backgroundColor: '#40232a' }}>
                <Feather name="trash-2" size={18 * scale} color="#ffacac" />
            </TouchableOpacity>
        </View>)}
        <TouchableOpacity accessibilityRole="button" disabled={saving} onPress={add}
            style={[styles.serverSave, { backgroundColor: '#273b46' }, saving && { opacity: 0.5 }]}>
            <Text style={styles.closeBtnText}>+ {t('consumptionTableAdd')}</Text>
        </TouchableOpacity>
        <TouchableOpacity accessibilityRole="button" disabled={saving} onPress={save}
            style={[styles.serverSave, saving && { opacity: 0.5 }]}>
            <Text style={styles.closeBtnText}>{t(saving ? 'saving' : 'consumptionTableSave')}</Text>
        </TouchableOpacity>
        {message && <Text accessibilityLiveRegion="polite" style={styles.serverHint}>{t(message.key, message)}</Text>}
    </View>;
}
