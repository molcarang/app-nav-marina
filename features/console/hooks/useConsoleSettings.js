import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { DEFAULT_SETTINGS, SETTINGS_STORAGE_KEY } from '../model/settings';
import { normalizeServerAddress } from '../../../services/signalk/serverAddress.js';
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
        setSettings(previous => ({ ...previous, [key]: Math.round(value) }));
    }
    async function saveSetting(key, value) {
        const next = { ...settings, [key]: key === 'signalKAddress' ? normalizeServerAddress(value) : Math.round(value) };
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
