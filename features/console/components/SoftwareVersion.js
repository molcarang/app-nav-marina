import { Text } from 'react-native';
import buildInfo from '../../../config/buildInfo.json';
import { useControlScale } from '../../../hooks/useControlScale';

export default function SoftwareVersion({ style }) {
    const scale = useControlScale();
    const label = `v${buildInfo.version}${buildInfo.buildNumber > 0 ? ` \u00b7 #${buildInfo.buildNumber}` : ''}`;
    return <Text numberOfLines={1} adjustsFontSizeToFit
        style={[{ fontFamily: 'NauticalFont', color: '#8fa6b2', fontSize: 12 * scale, lineHeight: 16 * scale }, style]}>
        {label}
    </Text>;
}
