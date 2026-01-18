import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { DEFAULT_SETTINGS, SETTINGS_STORAGE_KEY } from '../model/settings';
/** Estado de los sliders y persistencia local, independiente de Signal K. */
export function useConsoleSettings() {
    const [settings, setSettings] = useState(DEFAULT_SETTINGS);
    useEffect(() => {
        let mounted = true;
        async function load() {
            try {
                const saved = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
                if (saved && mounted)
                    setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(saved) });
            }
            catch (error) {
                console.warn('No se pudieron cargar los ajustes de consola', error);
            }
        }
        load();
        return () => { mounted = false; };
    }, []);
    function updateSetting(key, value) {
        setSettings(previous => ({ ...previous, [key]: Math.round(value) }));
    }
    async function saveSetting(key, value) {
        const next = { ...settings, [key]: Math.round(value) };
        setSettings(next);
        try {
            await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(next));
        }
        catch (error) {
            console.warn('No se pudieron guardar los ajustes de consola', error);
        }
    }
    return { settings, updateSetting, saveSetting };
}
