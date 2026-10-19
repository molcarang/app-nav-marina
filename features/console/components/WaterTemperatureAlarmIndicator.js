import { useTranslation } from '../../../localization/LanguageProvider';
import CoolantTemperatureIcon from '../../../components/icons/CoolantTemperatureIcon';
import StatusIndicator from './StatusIndicator';

export default function WaterTemperatureAlarmIndicator({ connected, temperatureAlarm }) {
    const { t } = useTranslation();
    const active = connected && temperatureAlarm === true;
    const label = !connected || temperatureAlarm == null ? 'waterTemperatureAlarmUnknown'
        : active ? 'waterTemperatureAlarmActive' : 'waterTemperatureAlarmInactive';
    return <StatusIndicator active={active} label={t(label)} icon={CoolantTemperatureIcon} alarm />;
}
