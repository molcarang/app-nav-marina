import { useTranslation } from '../../../localization/LanguageProvider';
import { SUPPORTED_LANGUAGES } from '../../../localization/translate';
import Slider from '@react-native-community/slider';
import { useEffect, useState } from 'react';
import { Modal, ScrollView, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { normalizeServerAddress } from '../../../services/signalk/serverAddress.js';
import { styles } from '../styles/settingsStyles';
import HistoryRetentionSetting from './HistoryRetentionSetting';
import NightDimmer from '../../../components/NightDimmer';
/** Presenta ajustes; el hook se ocupa de guardarlos. */
export default function ConsoleSettingsModal({ visible, settings, isNightMode, onChange, onSave, onNightModeChange, onClose, onTestDepthSound }) {
    const { t } = useTranslation();
    const [savingLanguage, setSavingLanguage] = useState(false);
    const [languageError, setLanguageError] = useState(false);
    async function changeLanguage(language) {
        setSavingLanguage(true);
        setLanguageError(false);
        try { setLanguageError(!await onSave('language', language)); }
        catch { setLanguageError(true); }
        finally { setSavingLanguage(false); }
    }
    const [address, setAddress] = useState(settings.signalKAddress);
    const [status, setStatus] = useState('');
    const [saving, setSaving] = useState(false);
    useEffect(() => {
        if (visible) { setAddress(settings.signalKAddress); setStatus(''); }
    }, [visible, settings.signalKAddress]);
    async function saveAddress() {
        setSaving(true);
        setStatus('');
        try {
            const normalized = normalizeServerAddress(address);
            const saved = await onSave('signalKAddress', normalized);
            setStatus(saved ? 'savedAddress' : 'saveError');
        } catch {
            setStatus('invalidAddress');
        } finally { setSaving(false); }
    }
    return (
        <Modal
            statusBarTranslucent
            navigationBarTranslucent
            animationType="fade"
            transparent
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                    <ScrollView keyboardShouldPersistTaps="handled">
                    <Text style={styles.modalTitle}>{t('title')}</Text>
                    <View style={styles.settingRowContainer}>
                        <Text style={styles.settingLabel}>{t('language')}</Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                            {SUPPORTED_LANGUAGES.map(({ code, label }) => (
                                <TouchableOpacity key={code} disabled={savingLanguage}
                                    accessibilityRole="button" accessibilityState={{ selected: settings.language === code, disabled: savingLanguage }}
                                    onPress={() => changeLanguage(code)}
                                    style={[styles.serverSave, { flexGrow: 1, flexBasis: 110, borderWidth: 1,
                                        borderColor: settings.language === code ? '#8fcbdc' : '#555',
                                        backgroundColor: settings.language === code ? '#24485c' : '#19232b', opacity: savingLanguage ? 0.5 : 1 }]}>
                                    <Text style={styles.closeBtnText}>{label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        {languageError && <Text style={styles.serverHint}>{t('saveError')}</Text>}
                    </View>
                    <View style={styles.settingRowContainer}>
                        <Text style={styles.settingLabel}>{t('server')}</Text>
                        <TextInput
                            style={styles.serverInput}
                            value={address}
                            onChangeText={value => { setAddress(value); setStatus(''); }}
                            placeholder="http://openplotter.local:3000"
                            placeholderTextColor="#788993"
                            autoCapitalize="none"
                            autoCorrect={false}
                            keyboardType="url"
                            editable={!saving}
                            accessibilityLabel={t('serverLabel')}
                        />
                        <Text style={styles.serverHint}>{t('serverHint')}</Text>
                        <TouchableOpacity disabled={saving} onPress={saveAddress} style={[styles.serverSave, saving && { opacity: 0.5 }]}>
                            <Text style={styles.closeBtnText}>{saving ? t('saving') : t('connect')}</Text>
                        </TouchableOpacity>
                        {!!status && <Text accessibilityLiveRegion="polite" style={styles.serverHint}>{t(status)}</Text>}
                    </View>

                    <View style={styles.settingRow}>
                        <Text style={styles.settingLabel}>{t('depthEnabled')}</Text>
                        <Switch value={settings.depthAlarmEnabled} onValueChange={value => onSave('depthAlarmEnabled', value)}
                            trackColor={{ false: '#333', true: '#dc1212' }} />
                    </View>
                    <HistoryRetentionSetting hours={settings.historyHours} visible={visible} onSave={onSave} />
                    <HistoryRetentionSetting metric="SOG" settingKey="sogHistoryHours" hours={settings.sogHistoryHours} visible={visible} onSave={onSave} />

                    {[
            { label: t('minWind'), key: 'minAnguloCeñida', min: 10, max: 45, color: '#00ff00' },
            { label: t('maxWind'), key: 'maxAnguloCeñida', min: 50, max: 90, color: '#ff0000' },
            { label: t('rudder'), key: 'rudderLimit', min: 20, max: 45, color: '#00ffff' },
            { label: t('depth'), key: 'depthAlarmMeters', min: 0.5, max: 30, step: 0.1, unit: ' m', color: '#dc1212' }
        ].map(s => (<View
            key={s.key}
            style={styles.settingRowContainer}
                    >
            <View style={styles.labelRow}>
                <Text style={styles.settingLabel}>{s.label}</Text>
                <Text style={[styles.valueLabel, { color: s.color }]}>
                    {s.key === 'depthAlarmMeters' ? settings[s.key].toFixed(1) : settings[s.key]}{s.unit ?? '°'}
                </Text>
            </View>
            <Slider
                style={styles.slider}
                minimumValue={s.min}
                maximumValue={s.max}
                step={s.step ?? 1}
                value={settings[s.key]}
                onValueChange={(v) => onChange(s.key, v)}
                onSlidingComplete={(v) => onSave(s.key, v)}
                minimumTrackTintColor={s.color}
                thumbTintColor={s.color}
                maximumTrackTintColor="rgba(255,255,255,0.1)"
            />
        </View>))}

                    <View style={styles.divider}/>
                    <View style={styles.settingRowContainer}>
                        <View style={styles.settingRow}>
                            <Text style={styles.settingLabel}>{t('sound')}</Text>
                            <Switch value={settings.depthAlarmSound} onValueChange={value => onSave('depthAlarmSound', value)}
                                trackColor={{ false: '#333', true: '#dc1212' }} />
                        </View>
                        <Text style={styles.serverHint}>{t('soundHint')}</Text>
                        <TouchableOpacity onPress={onTestDepthSound} style={styles.serverSave}>
                            <Text style={styles.closeBtnText}>{t('testSound')}</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.settingRowContainer}>
                        <View style={styles.labelRow}>
                            <Text style={styles.settingLabel}>{t('intensity')}</Text>
                            <Text style={[styles.valueLabel, { color: '#8fcbdc' }]}>{settings.nightIntensity} %</Text>
                        </View>
                        <Slider style={styles.slider} minimumValue={5} maximumValue={100} step={1}
                            value={settings.nightIntensity}
                            onValueChange={value => onChange('nightIntensity', value)}
                            onSlidingComplete={value => onSave('nightIntensity', value)}
                            minimumTrackTintColor="#8fcbdc" thumbTintColor="#8fcbdc"
                            maximumTrackTintColor="rgba(255,255,255,0.1)" />
                        <Text style={styles.serverHint}>{t('intensityHint')}</Text>
                    </View>
                    <View style={styles.settingRow}>
                        <Text style={styles.settingLabel}>{t('night')}</Text>
                        <Switch
                            value={isNightMode}
                            onValueChange={onNightModeChange}
                            trackColor={{ false: "#333", true: "#dc1212" }}
                        />
                    </View>

                    <TouchableOpacity
                        onPress={onClose}
                        style={styles.closeBtn}
                    >
                        <Text style={styles.closeBtnText}>{t('close')}</Text>
                    </TouchableOpacity>
                    </ScrollView>
                </View>
                <NightDimmer />
            </View>
        </Modal>
    );
}
