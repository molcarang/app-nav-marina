import { useId, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, G, Path, Rect } from 'react-native-svg';
import { GaugeDefs } from '../../../components/gauges/shared/GaugeDefs';

/** Aluminium bevel and recessed screw heads, using the instruments' metal gradients. */
export default function EngineDashboardFrame({ scale }) {
    const prefix = `engine-frame-${useId().replace(/:/g, '')}-`;
    const [size, setSize] = useState({ width: 0, height: 0 });
    const paint = name => `url(#${prefix}${name})`;
    const width = size.width / scale;
    const height = size.height / scale;
    return <View pointerEvents="none" accessible={false} style={StyleSheet.absoluteFillObject}
        onLayout={({ nativeEvent }) => setSize(nativeEvent.layout)}>
        {width > 24 && height > 24 && <Svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`}>
            <Defs><GaugeDefs idPrefix={prefix} /></Defs>
            <Rect x={3} y={3} width={width - 6} height={height - 6} rx={15}
                fill="none" stroke={paint('bezelOuter')} strokeWidth={6} />
            <Rect x={9} y={9} width={width - 18} height={height - 18} rx={9}
                fill="none" stroke={paint('bezelInner')} strokeWidth={6} />
            <Rect x={6} y={6} width={width - 12} height={height - 12} rx={12}
                fill="none" stroke={paint('bezelRidge')} strokeWidth={0.9} opacity={0.8} />
            {[
                { x: 21, y: 21, angle: 24 },
                { x: width - 21, y: 21, angle: -18 },
                { x: 21, y: height - 21, angle: -32 },
                { x: width - 21, y: height - 21, angle: 38 },
            ].map((screw, index) => <G key={index} transform={`translate(${screw.x} ${screw.y})`}>
                <Circle cx={0.9} cy={1.3} r={8.4} fill="#000" opacity={0.55} />
                <Circle r={8.1} fill={paint('bezelInner')} stroke="#17191b" strokeWidth={0.8} />
                <Circle r={6.6} fill={paint('bezelOuter')} stroke="#c2c4c6" strokeWidth={0.5} />
                <G rotation={screw.angle}>
                    <Path d="M-4.5 0.9H4.5M0.7-4.2V4.2" stroke="#eee" strokeOpacity={0.65} strokeWidth={1.4} />
                    <Path d="M-4.5 0H4.5M0-4.2V4.2" stroke="#242729" strokeWidth={1.7} strokeLinecap="round" />
                </G>
            </G>)}
        </Svg>}
    </View>;
}
