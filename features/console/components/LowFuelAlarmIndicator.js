import { useTranslation } from '../../../localization/LanguageProvider';
import FuelLevelIcon from '../../../components/icons/FuelLevelIcon';
import StatusIndicator from './StatusIndicator';
import { isLowFuelAlarmActive } from '../model/lowFuelAlarm.js';

export default function LowFuelAlarmIndicator({ connected, fuelPercent, threshold, frameWidth, compactScale, compactHeightScale, iconScale }) {
    const { t } = useTranslation();
    const active = isLowFuelAlarmActive(connected, fuelPercent, threshold);
    const unknown = !connected || !Number.isFinite(fuelPercent) || fuelPercent < 0 || fuelPercent > 100;
    const label = active ? 'lowFuelAlarmActive' : unknown ? 'lowFuelAlarmUnknown' : 'lowFuelAlarmInactive';
    return <StatusIndicator active={active} label={t(label)} icon={FuelLevelIcon} alarm alarmColor="#ff9800" frameWidth={frameWidth} compactScale={compactScale} compactHeightScale={compactHeightScale} iconScale={iconScale} />;
}
