import AsyncStorage from '@react-native-async-storage/async-storage';
import { normalizeLanguage } from '../../../localization/translate';
import { useEffect, useState } from 'react';
import { DEFAULT_SETTINGS, SETTINGS_STORAGE_KEY } from '../model/settings';
import { normalizeServerAddress } from '../../../services/signalk/serverAddress.js';
import { normalizeHistoryHours } from '../model/twsHistory.js';
const normalizeDepthAlarm = value => Number.isFinite(value) && value >= 0.5 && value <= 30
    ? Math.round(value * 10) / 10 : DEFAULT_SETTINGS.depthAlarmMeters;
const normalizeNightIntensity = value => Number.isFinite(value)
    ? Math.max(5, Math.min(100, Math.round(value))) : DEFAULT_SETTINGS.nightIntensity;
/** Estado de los sliders y persistencia local, independiente de Signal K. */
export function useConsoleSettings() {
    const [settings, setSettings] = useState(DEFAULT_SETTINGS);
    const [isLoaded, setLoaded] = useState(false);
    useEffect(() => {
        let mounted = true;
        async function load() {
            try {
                const saved = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
                if (saved && mounted) {
                    const restored = { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
                    restored.language = normalizeLanguage(restored.language);
                    restored.historyHours = normalizeHistoryHours(restored.historyHours);
                    restored.sogHistoryHours = normalizeHistoryHours(restored.sogHistoryHours);
                    restored.depthAlarmMeters = normalizeDepthAlarm(restored.depthAlarmMeters);
                    restored.nightIntensity = normalizeNightIntensity(restored.nightIntensity);
                    restored.depthAlarmSound = typeof restored.depthAlarmSound === 'boolean' ? restored.depthAlarmSound : true;
                    restored.depthAlarmEnabled = typeof restored.depthAlarmEnabled === 'boolean' ? restored.depthAlarmEnabled : true;
                    try { restored.signalKAddress = normalizeServerAddress(restored.signalKAddress); }
                    catch { restored.signalKAddress = DEFAULT_SETTINGS.signalKAddress; }
                    setSettings(restored);
                }
            }
            catch (error) {
                console.warn('No se pudieron cargar los ajustes de consola', error);
            }
            finally { if (mounted) setLoaded(true); }
        }
        load();
        return () => { mounted = false; };
    }, []);
    function updateSetting(key, value) {
        setSettings(previous => ({ ...previous, [key]: key === 'depthAlarmMeters' ? normalizeDepthAlarm(value)
            : key === 'nightIntensity' ? normalizeNightIntensity(value) : Math.round(value) }));
    }
    async function saveSetting(key, value) {
        const next = { ...settings, [key]: key === 'signalKAddress' ? normalizeServerAddress(value)
            : key === 'language' ? normalizeLanguage(value)
            : ['depthAlarmSound', 'depthAlarmEnabled'].includes(key) ? Boolean(value)
            : key === 'depthAlarmMeters' ? normalizeDepthAlarm(value)
            : key === 'nightIntensity' ? normalizeNightIntensity(value)
                : ['historyHours', 'sogHistoryHours'].includes(key) ? normalizeHistoryHours(value) : Math.round(value) };
        try {
            await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(next));
            setSettings(next);
            return true;
        }
        catch (error) {
            console.warn('No se pudieron guardar los ajustes de consola', error);
            return false;
        }
    }
    return { settings, isLoaded, updateSetting, saveSetting };
}
