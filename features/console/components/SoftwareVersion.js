import { useLayoutEffect, useState } from 'react';
import { Platform, StyleSheet, Text } from 'react-native';
import buildInfo from '../../../config/buildInfo.json';
import { useControlScale } from '../../../hooks/useControlScale';

export default function SoftwareVersion({ style, availableWidth }) {
    const scale = useControlScale();
    const label = `v${buildInfo.version}${buildInfo.buildNumber > 0 ? ` \u00b7 #${buildInfo.buildNumber}` : ''}`;
    const fontSize = StyleSheet.flatten(style)?.fontSize ?? 12 * scale;
    const [naturalWidth, setNaturalWidth] = useState(null);
    // React Native Web ignores adjustsFontSizeToFit. Measure the loaded font so
    // the complete version stays inside the gap and its visible text is centered.
    useLayoutEffect(() => {
        if (Platform.OS !== 'web' || !(availableWidth > 0)) return;
        const context = document.createElement('canvas').getContext('2d');
        if (!context) return;
        context.font = `${fontSize}px NauticalFont`;
        setNaturalWidth(context.measureText(label).width);
    }, [label, fontSize, availableWidth]);
    const fittedFontSize = naturalWidth > 0 && availableWidth > 0
        ? Math.min(fontSize, fontSize * Math.max(1, availableWidth - 1) / naturalWidth) : fontSize;
    return <Text numberOfLines={1} adjustsFontSizeToFit
        style={[{ fontFamily: 'NauticalFont', color: '#8fa6b2', fontSize: 12 * scale, lineHeight: 16 * scale }, style,
            availableWidth != null && { width: availableWidth, textAlign: 'center', fontSize: fittedFontSize }]}>
        {label}
    </Text>;
}
