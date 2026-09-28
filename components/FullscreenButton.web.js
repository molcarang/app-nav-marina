import { useControlScale } from '../hooks/useControlScale';
import { useEffect, useState } from 'react';
import { TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from '../localization/LanguageProvider';

export default function FullscreenButton() {
    const scale = useControlScale();
    const { t } = useTranslation();
    const [fullscreen, setFullscreen] = useState(false);
    useEffect(() => {
        const update = () => setFullscreen(Boolean(document.fullscreenElement));
        document.addEventListener('fullscreenchange', update);
        update();
        return () => document.removeEventListener('fullscreenchange', update);
    }, []);
    async function toggle() {
        try {
            if (document.fullscreenElement) await document.exitFullscreen();
            else await document.documentElement.requestFullscreen();
        } catch (error) { console.warn('Fullscreen:', error.message); }
    }
    return <TouchableOpacity onPress={toggle} accessibilityRole="button"
        accessibilityLabel={t(fullscreen ? 'exitFullscreen' : 'enterFullscreen')}
        style={{ minWidth: Math.max(48, 36 * scale), minHeight: Math.max(48, 36 * scale), alignItems: 'center', justifyContent: 'center', borderRadius: 12, borderWidth: 1, borderColor: '#58788b', backgroundColor: '#10202c', transform: [{ translateY: 5 }] }}>
        <MaterialIcons name={fullscreen ? 'fullscreen-exit' : 'fullscreen'} size={28 * scale} color="#8fcbdc" />
    </TouchableOpacity>;
}
