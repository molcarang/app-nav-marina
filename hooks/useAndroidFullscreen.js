import { useEffect } from 'react';
import { AppState, Dimensions, Keyboard, Platform, StatusBar } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';

/** Restaura las barras ocultas al recuperar el foco, sin actualizar estado React. */
export function useAndroidFullscreen(enabled) {
    useEffect(() => {
        if (Platform.OS !== 'android' || !enabled) return;
        let timer;
        let disposed = false;
        let focused = AppState.currentState === 'active';
        const hide = () => {
            if (disposed || !focused || AppState.currentState !== 'active') return;
            StatusBar.setHidden(true, 'none');
            NavigationBar.setVisibilityAsync('hidden').catch(error => {
                if (!disposed) console.warn('No se pudo ocultar la barra de Android:', error);
            });
        };
        const schedule = (delay = 250) => {
            clearTimeout(timer);
            timer = setTimeout(hide, delay);
        };
        const subscriptions = [
            AppState.addEventListener('change', state => {
                focused = state === 'active';
                if (focused) schedule();
            }),
            AppState.addEventListener('focus', () => { focused = true; schedule(); }),
            AppState.addEventListener('blur', () => { focused = false; clearTimeout(timer); }),
            Dimensions.addEventListener('change', () => schedule()),
            Keyboard.addListener('keyboardDidHide', () => schedule()),
            NavigationBar.addVisibilityListener(({ visibility }) => {
                if (visibility === 'visible' && focused) schedule(2500);
            }),
        ];
        schedule();
        return () => {
            disposed = true;
            clearTimeout(timer);
            subscriptions.forEach(subscription => subscription.remove());
        };
    }, [enabled]);
}
