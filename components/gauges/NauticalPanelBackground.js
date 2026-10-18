import { useId } from 'react';
import { ClipPath, Defs, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

/** Viento y oleaje abstractos, independientes de los datos de los instrumentos. */
export default function NauticalPanelBackground({ isNightMode }) {
    const clipId = `nautical-panel-${useId().replace(/:/g, '')}`;
    return <G pointerEvents="none">
        <Defs>
            <ClipPath id={clipId}><Rect x={3} y={3} width={794} height={294} rx={17} /></ClipPath>
            <LinearGradient id={`${clipId}-sea`} x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#101e2c" />
                <Stop offset="55%" stopColor="#193647" />
                <Stop offset="100%" stopColor="#0d202c" />
            </LinearGradient>
            <LinearGradient id={`${clipId}-wave`} x1="0%" y1="0%" x2="0%" y2="100%">
                <Stop offset="0%" stopColor="#548ca0" stopOpacity={0.25} />
                <Stop offset="100%" stopColor="#25485c" stopOpacity={0.03} />
            </LinearGradient>
        </Defs>
        <G clipPath={`url(#${clipId})`} opacity={isNightMode ? 0.16 : 0.65}>
            <Rect x={3} y={3} width={794} height={294} fill={`url(#${clipId}-sea)`} />
            {/* Capas de olas con un reflejo suave en sus crestas. */}
            {[0, 26, 52].map((offset, index) => <G key={offset} transform={`translate(0, ${offset})`}>
                <Path d="M-30 185 C85 125 151 243 280 186 S465 135 567 182 722 230 830 154 L830 330 -30 330 Z"
                    fill={`url(#${clipId}-wave)`} />
                <Path d="M-30 185 C85 125 151 243 280 186 S465 135 567 182 722 230 830 154"
                    fill="none" stroke="#7fa9b8" strokeWidth={index === 0 ? 1.8 : 1} opacity={0.3 - index * 0.06} />
            </G>)}
            <G fill="none" stroke="#7c9faf" strokeLinecap="round" opacity={0.25}>
                <Path d="M-40 61 C97 6 152 109 316 59 S531 7 679 49 768 61 840 18" strokeWidth={1.7} />
                <Path d="M-30 77 C99 27 162 123 323 76 S530 25 677 65 776 80 840 36" strokeWidth={0.9} />
                <Path d="M40 106 C151 89 184 148 340 103 S532 59 625 90" strokeWidth={1.2} />
                <Path d="M113 30 C184 57 232 43 276 29 M485 110 C574 93 611 130 696 114" strokeWidth={2.5} opacity={0.55} />
            </G>
        </G>
    </G>;
}
