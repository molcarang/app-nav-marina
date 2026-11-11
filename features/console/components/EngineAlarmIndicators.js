import { View } from 'react-native';
import { useControlScale } from '../../../hooks/useControlScale';
import WaterTemperatureAlarmIndicator from './WaterTemperatureAlarmIndicator';
import OilPressureAlarmIndicator from './OilPressureAlarmIndicator';
import AlternatorChargeAlarmIndicator from './AlternatorChargeAlarmIndicator';
import LowBatteryAlarmIndicator from './LowBatteryAlarmIndicator';
import LowFuelAlarmIndicator from './LowFuelAlarmIndicator';

export default function EngineAlarmIndicators({ connected, navigation, settings, vertical = false, frameWidth,
    compact = false, compactWidthScale }) {
    const scale = useControlScale();
    // Compact engine panel keeps the same width as the main engine status indicator.
    const compactScale = compact ? (compactWidthScale ?? 1) : 1;
    const compactHeightScale = compact ? 0.95 : 1;
    const iconScale = compact ? Math.min(0.78, compactScale * 0.9) : 1;
    return <View style={{ flexDirection: vertical ? 'column' : 'row',
        flexWrap: vertical || compact ? 'nowrap' : 'wrap', gap: (compact ? 3 : 8) * scale }}>
        <WaterTemperatureAlarmIndicator connected={connected} temperatureAlarm={navigation?.waterTemperatureAlarm} frameWidth={frameWidth} compactScale={compactScale} compactHeightScale={compactHeightScale} iconScale={iconScale} />
        <OilPressureAlarmIndicator connected={connected} oilPressureAlarm={navigation?.oilPressureAlarm} frameWidth={frameWidth} compactScale={compactScale} compactHeightScale={compactHeightScale} iconScale={iconScale} />
        <AlternatorChargeAlarmIndicator connected={connected} alternatorChargeAlarm={navigation?.alternatorChargeAlarm} frameWidth={frameWidth} compactScale={compactScale} compactHeightScale={compactHeightScale} iconScale={iconScale} />
        <LowBatteryAlarmIndicator connected={connected} lowBatteryAlarm={navigation?.lowBatteryAlarm} frameWidth={frameWidth} compactScale={compactScale} compactHeightScale={compactHeightScale} iconScale={iconScale} />
        <LowFuelAlarmIndicator connected={connected} fuelPercent={navigation?.fuelLevelPercent} threshold={settings?.lowFuelAlarmPercent} frameWidth={frameWidth} compactScale={compactScale} compactHeightScale={compactHeightScale} iconScale={iconScale} />
    </View>;
}
