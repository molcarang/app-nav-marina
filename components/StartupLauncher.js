import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useTranslation } from '../localization/LanguageProvider';

/** Looping startup video with the live Signal K connection status. */
export default function StartupLauncher({ ready, connected, onFinish }) {
    const { t } = useTranslation();
    const { width, height } = useWindowDimensions();
    const mediaHeight = Math.min(height, width * 9 / 16);
    const player = useVideoPlayer(require('../assets/videos/openboat-launch.mp4'), player => {
        player.muted = true;
        player.loop = true;
    });
    useEffect(() => {
        player.play();
        // Native players are released by useVideoPlayer; the web player needs to be paused.
        if (Platform.OS === 'web') return () => player.pause();
    }, [player]);
    const [minimumElapsed, setMinimumElapsed] = useState(false);
    const [connectionTimedOut, setConnectionTimedOut] = useState(false);
    const pulse = useRef(new Animated.Value(1)).current;
    useEffect(() => {
        const animation = Animated.loop(Animated.sequence([
            Animated.timing(pulse, { toValue: 0.4, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: Platform.OS !== 'web' }),
            Animated.timing(pulse, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: Platform.OS !== 'web' }),
        ]));
        animation.start();
        return () => animation.stop();
    }, [pulse]);
    useEffect(() => {
        const minimum = setTimeout(() => setMinimumElapsed(true), 2800);
        const timeout = setTimeout(() => setConnectionTimedOut(true), 6500);
        // A missing server must never prevent opening Settings to configure its address.
        const finish = setTimeout(onFinish, 8500);
        return () => { clearTimeout(minimum); clearTimeout(timeout); clearTimeout(finish); };
    }, [onFinish]);
    useEffect(() => {
        if (ready && connected && minimumElapsed) onFinish();
    }, [ready, connected, minimumElapsed, onFinish]);
    const status = connected ? 'startupConnected'
        : connectionTimedOut ? 'startupOffline' : 'startupConnecting';
    const color = connected ? '#38dca9' : connectionTimedOut ? '#ffb94d' : '#21d7f3';
    return (
        <View testID="startup-launcher" style={styles.overlay}>
            <VideoView player={player} contentFit="contain" nativeControls={false} playsInline
                allowsFullscreen={false} allowsPictureInPicture={false}
                accessibilityLabel="OpenBoat — Navigate the Future" style={styles.video} />
            <View style={[styles.footer, { bottom: Math.max(12, (height - mediaHeight) / 2 + 12) + mediaHeight * 0.2 }]}>
                <Animated.View style={[styles.statusRow, { opacity: pulse }]}>
                    <View style={[styles.led, { backgroundColor: color }]} />
                    <Text accessibilityLiveRegion="polite" numberOfLines={1} adjustsFontSizeToFit
                        style={[styles.status, { color }]}>{t(status)}</Text>
                </Animated.View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    overlay: { ...StyleSheet.absoluteFillObject, zIndex: 10000, backgroundColor: '#010b16', alignItems: 'center', overflow: 'hidden' },
    video: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
    footer: { position: 'absolute', alignItems: 'center', width: '96%', maxWidth: 1100, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 14, backgroundColor: 'rgba(1,11,22,0.72)' },
    statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', maxWidth: '100%', gap: 10 },
    led: { width: 7, height: 7, borderRadius: 4, flexShrink: 0 },
    status: { fontFamily: 'NauticalFont', fontSize: 18, textAlign: 'center', flexShrink: 1 },
});
