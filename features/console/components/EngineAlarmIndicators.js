import { View } from 'react-native';
import { useControlScale } from '../../../hooks/useControlScale';
import WaterTemperatureAlarmIndicator from './WaterTemperatureAlarmIndicator';
import OilPressureAlarmIndicator from './OilPressureAlarmIndicator';
import AlternatorChargeAlarmIndicator from './AlternatorChargeAlarmIndicator';
import LowBatteryAlarmIndicator from './LowBatteryAlarmIndicator';
import LowFuelAlarmIndicator from './LowFuelAlarmIndicator';

export default function EngineAlarmIndicators({ connected, navigation, settings, vertical = false, frameWidth }) {
    const scale = useControlScale();
    return <View style={{ flexDirection: vertical ? 'column' : 'row', flexWrap: vertical ? 'nowrap' : 'wrap', gap: 8 * scale }}>
        <WaterTemperatureAlarmIndicator connected={connected} temperatureAlarm={navigation?.waterTemperatureAlarm} frameWidth={frameWidth} />
        <OilPressureAlarmIndicator connected={connected} oilPressureAlarm={navigation?.oilPressureAlarm} frameWidth={frameWidth} />
        <AlternatorChargeAlarmIndicator connected={connected} alternatorChargeAlarm={navigation?.alternatorChargeAlarm} frameWidth={frameWidth} />
        <LowBatteryAlarmIndicator connected={connected} lowBatteryAlarm={navigation?.lowBatteryAlarm} frameWidth={frameWidth} />
        <LowFuelAlarmIndicator connected={connected} fuelPercent={navigation?.fuelLevelPercent} threshold={settings?.lowFuelAlarmPercent} frameWidth={frameWidth} />
    </View>;
}
