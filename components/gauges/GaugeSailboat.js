import { G, Path } from 'react-native-svg';

/** Minimal top view, centered on the gauge's existing steel ball. */
export default function GaugeSailboat({ center, size, isNightMode, showAis = false }) {
    const opacity = (isNightMode ? 0.24 : 0.42) * (showAis ? 0.5 : 1);
    return (
        <G pointerEvents="none" transform={`translate(${center}, ${center}) scale(${size / 500 * 0.8})`}
            opacity={opacity} stroke="#adcbd5" strokeWidth={1.2}
            strokeLinejoin="round" strokeLinecap="round" fill="none">
            {/* Slim hull, pointed bow and softly squared stern. */}
            <Path d="M0 -110 C16 -88 29 -42 29 10 L25 88 Q24 95 17 96 L-17 96 Q-24 95 -25 88 L-29 10 C-29 -42 -16 -88 0 -110 Z"
                strokeWidth={1.8} />
            {/* Cabin forward and cockpit aft leave the central hub clear. */}
            <Path d="M-12 -30 L-10 -49 Q0 -57 10 -49 L12 -30 Q0 -26 -12 -30 Z" opacity={0.7} />
            <Path d="M-14 37 L-14 74 Q0 80 14 74 L14 37 Z" opacity={0.7} />
        </G>
    );
}
