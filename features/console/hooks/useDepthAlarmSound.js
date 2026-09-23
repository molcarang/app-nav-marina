import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';

/** Un único reproductor para ambas orientaciones. En web se habilita con un gesto. */
export function useDepthAlarmSound(active) {
    const player = useAudioPlayer(require('../../../assets/sounds/depth-alarm.wav'));
    const { isLoaded } = useAudioPlayerStatus(player);
    const [testing, setTesting] = useState(false);
    const [foreground, setForeground] = useState(AppState.currentState === 'active');
    const timer = useRef(null);
    const [mutedUntil, setMutedUntil] = useState(0);
    const [now, setNow] = useState(Date.now);
    const remainingSeconds = Math.max(0, Math.ceil((mutedUntil - now) / 1000));
    const audible = foreground && ((active && remainingSeconds === 0) || testing);
    useEffect(() => {
        if (!active) setMutedUntil(0);
    }, [active]);
    useEffect(() => {
        if (!mutedUntil) return;
        const update = () => {
            const time = Date.now();
            setNow(time);
            if (time >= mutedUntil) setMutedUntil(0);
        };
        const interval = setInterval(update, 250);
        const subscription = AppState.addEventListener('change', update);
        return () => { clearInterval(interval); subscription.remove(); };
    }, [mutedUntil]);
    const silenceForMinute = useCallback(() => {
        clearTimeout(timer.current);
        setTesting(false);
        player.muted = true;
        const time = Date.now();
        setNow(time);
        setMutedUntil(time + 60000);
    }, [player]);
    useEffect(() => {
        const subscription = AppState.addEventListener('change', state => setForeground(state === 'active'));
        return () => subscription.remove();
    }, []);
    useEffect(() => {
        if (!isLoaded) return;
        player.loop = true;
        player.volume = 0.7;
        player.muted = !audible;
        if (Platform.OS !== 'web') {
            if (audible) player.play();
            else player.pause();
        }
    }, [player, isLoaded, audible]);
    useEffect(() => {
        if (Platform.OS !== 'web' || !isLoaded) return;
        // Mantiene el reproductor habilitado, en silencio cuando no hay alarma.
        const unlock = () => player.play();
        document.addEventListener('pointerup', unlock);
        document.addEventListener('keydown', unlock);
        return () => {
            document.removeEventListener('pointerup', unlock);
            document.removeEventListener('keydown', unlock);
        };
    }, [player, isLoaded]);
    useEffect(() => () => clearTimeout(timer.current), []);
    const testSound = useCallback(() => {
        clearTimeout(timer.current);
        player.muted = false;
        player.play();
        setTesting(true);
        timer.current = setTimeout(() => setTesting(false), 4500);
    }, [player]);
    return { testSound, silenceForMinute, remainingSeconds };
}
