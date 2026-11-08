import React, { useId, useMemo } from 'react';
import { Defs, G, LinearGradient, Path, Stop } from 'react-native-svg';

/** Incoming wind, fading before the central instruments. */
export default function WindFlow({ center, size, margin, angle, speed, phase, isNightMode, variant = 'apparent' }) {
    const id = `${variant}-wind-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
    const colors = variant === 'true'
        ? ['#ffb64d', '#ffe2a3', '#ffb347', '#ff9800']
        : ['#48caff', '#62d8ff', '#38baff', '#2196f3'];
    const startY = -margin * 2.4;
    const endY = center - size * 0.12;
    const period = size * 0.26;
    const strength = Math.min(1, Math.max(0, speed / 30));
    const spread = 1.3;
    const streams = useMemo(() => Array.from({ length: 7 }, (_, index) => {
        const offset = (index - 3) * size * 0.027 * spread;
        // Gentle animated curves with restrained sideways movement.
        const wave = ((index % 2 === 0 ? 1 : -1) * 0.025
            + Math.sin(phase * Math.PI * 2 + index * 0.55) * 0.007) * size;
        const shoulder = center + offset + wave;
        const waist = center + offset * 0.8 - wave;
        const join = center + offset * 0.6;
        const tip = center + offset * 0.18;
        const width = size * (0.012 + strength * 0.009) * spread;
        return {
            path: `M ${center + offset} ${startY}
                C ${shoulder} ${-margin * 1.65},
                  ${waist} ${-margin * 0.25}, ${join} ${size * 0.09}
                C ${center + offset * 0.9 + wave * 0.3} ${size * 0.19},
                  ${center + offset * 0.45} ${center - size * 0.23},
                  ${tip} ${endY}`,
            ribbon: `M ${center + offset} ${startY}
                C ${shoulder + width} ${-margin * 1.65},
                  ${waist + width} ${-margin * 0.25}, ${join + width * 0.5} ${size * 0.09}
                C ${join + width * 0.35} ${size * 0.2}, ${tip + width * 0.1} ${endY - size * 0.05}, ${tip} ${endY}
                C ${tip - width * 0.1} ${endY - size * 0.05}, ${join - width * 0.35} ${size * 0.2}, ${join - width * 0.5} ${size * 0.09}
                C ${waist - width} ${-margin * 0.25}, ${shoulder - width} ${-margin * 1.65}, ${center + offset} ${startY} Z`,
            opacity: 1 - Math.abs(index - 3) * 0.16,
            offset: index * period / 7,
        };
    }), [center, size, margin, startY, endY, period, phase, strength, spread]);

    return <G pointerEvents="none" rotation={angle} origin={`${center}, ${center}`}
        opacity={isNightMode ? 0.45 : 1}>
        <Defs>
            <LinearGradient id={id} x1={center} y1={startY} x2={center} y2={endY}
                gradientUnits="userSpaceOnUse">
                <Stop offset="0" stopColor={colors[0]} stopOpacity="0" />
                <Stop offset="0.12" stopColor={colors[1]} stopOpacity="1" />
                <Stop offset="0.35" stopColor={colors[2]} stopOpacity="0.95" />
                <Stop offset="0.48" stopColor={colors[3]} stopOpacity="0.5" />
                <Stop offset="0.75" stopColor={colors[3]} stopOpacity="0.12" />
                <Stop offset="1" stopColor={colors[3]} stopOpacity="0" />
            </LinearGradient>
        </Defs>
        {streams.filter((_, index) => index % 2 === 1).map((stream, index) => (
            <Path key={`ribbon-${index}`} d={stream.ribbon} fill={`url(#${id})`}
                opacity={0.38 * stream.opacity} />
        ))}
        {streams.map((stream, index) => <G key={index} opacity={stream.opacity}>
            <Path d={stream.path} fill="none" stroke={`url(#${id})`}
                strokeWidth={size * (0.019 + strength * 0.009)} opacity={0.12} />
            <Path d={stream.path} fill="none" stroke={`url(#${id})`}
                strokeWidth={size * (0.003 + strength * 0.0015)} strokeLinecap="round"
                strokeDasharray={`${period * 0.62} ${period * 0.38}`}
                strokeDashoffset={stream.offset - phase * period} opacity={0.9} />
        </G>)}
    </G>;
}
