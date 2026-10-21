import { useEffect, useId, useState } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, RadialGradient, Stop, Text as SvgText } from 'react-native-svg';
import { useTranslation } from '../../../localization/LanguageProvider';

export default function EngineDashboardStatus({ scale, connected, engineRunning, engineRpm, batteryVoltage }) {
    const { t } = useTranslation();
    const prefix = `engine-status-${useId().replace(/:/g, '')}`;
    const running = connected && engineRunning === true;
    const ignition = connected && Number.isFinite(batteryVoltage) && batteryVoltage > 0
        && !(Number.isFinite(engineRpm) && engineRpm > 0);
    const [lit, setLit] = useState(true);
    useEffect(() => {
        setLit(true);
        if (!ignition) return;
        const timer = setInterval(() => setLit(value => !value), 600);
        return () => clearInterval(timer);
    }, [ignition]);
    const ignitionLit = ignition && lit;
    const label = !connected || engineRunning == null ? 'engineStatusUnknown'
        : running ? 'engineStatusRunning' : 'engineStatusStopped';
    const ignitionLabel = !connected || !Number.isFinite(batteryVoltage) ? 'engineIgnitionUnknown'
        : ignition ? 'engineIgnitionOn' : 'engineIgnitionOff';
    return <View accessible accessibilityRole="image" accessibilityLabel={`${t(label)}. ${t(ignitionLabel)}`}
        style={{ position: 'absolute', left: 194 * scale, top: 20 * scale, width: 276 * scale, height: 64 * scale }}>
        <Svg accessible={false} width="100%" height="100%" viewBox="0 0 276 64">
            <Defs>
                <LinearGradient id={`${prefix}-metal`} x1="0%" y1="0%" x2="0%" y2="100%">
                    <Stop offset="0" stopColor="#fafafa" />
                    <Stop offset="0.45" stopColor="#d0d2d3" />
                    <Stop offset="1" stopColor="#85898b" />
                </LinearGradient>
                <RadialGradient id={`${prefix}-led`} cx="35%" cy="28%" r="70%">
                    <Stop offset="0" stopColor={running ? '#b7ff9a' : '#56604f'} />
                    <Stop offset="0.4" stopColor={running ? '#26ef25' : '#283426'} />
                    <Stop offset="1" stopColor={running ? '#087813' : '#111a12'} />
                </RadialGradient>
                <RadialGradient id={`${prefix}-ignition`} cx="35%" cy="28%" r="70%">
                    <Stop offset="0" stopColor={ignitionLit ? '#fff1a1' : '#625a45'} />
                    <Stop offset="0.4" stopColor={ignitionLit ? '#ffb522' : '#383023'} />
                    <Stop offset="1" stopColor={ignitionLit ? '#a25a00' : '#1b170e'} />
                </RadialGradient>
            </Defs>
            <Line x1={12} y1={17} x2={48} y2={17} stroke="#b5b8b9" strokeWidth={1} />
            <Line x1={228} y1={17} x2={264} y2={17} stroke="#b5b8b9" strokeWidth={1} />
            <SvgText x={138} y={25} textAnchor="middle" fontFamily="NauticalFont" fontSize={22}
                fill={`url(#${prefix}-metal)`}>{t('engine')}</SvgText>
            {running && <>
                <Circle cx={30} cy={49} r={11} fill="#22ef24" opacity={0.06} />
                <Circle cx={30} cy={49} r={8} fill="#22ef24" opacity={0.12} />
            </>}
            <Circle cx={30} cy={49} r={5.5} fill={`url(#${prefix}-led)`} stroke="#0a110a" strokeWidth={1.2} />
            <SvgText x={46} y={53} fontFamily="NauticalFont" fontSize={11}
                fill={running ? '#bec2c3' : '#697071'}>RUNNING</SvgText>
            {ignitionLit && <>
                <Circle cx={158} cy={49} r={11} fill="#ffb522" opacity={0.06} />
                <Circle cx={158} cy={49} r={8} fill="#ffb522" opacity={0.12} />
            </>}
            <Circle cx={158} cy={49} r={5.5} fill={`url(#${prefix}-ignition)`} stroke="#1b1408" strokeWidth={1.2} />
            <SvgText x={174} y={53} fontFamily="NauticalFont" fontSize={11}
                fill={ignition ? '#bec2c3' : '#697071'}>IGNITION</SvgText>
        </Svg>
    </View>;
}
