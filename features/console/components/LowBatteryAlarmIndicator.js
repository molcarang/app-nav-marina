import { useTranslation } from '../../../localization/LanguageProvider';
import LowBatteryIcon from '../../../components/icons/LowBatteryIcon';
import StatusIndicator from './StatusIndicator';

export default function LowBatteryAlarmIndicator({ connected, lowBatteryAlarm }) {
    const { t } = useTranslation();
    const active = connected && lowBatteryAlarm === true;
    const label = !connected || lowBatteryAlarm == null ? 'lowBatteryAlarmUnknown'
        : active ? 'lowBatteryAlarmActive' : 'lowBatteryAlarmInactive';
    return <StatusIndicator active={active} label={t(label)} icon={LowBatteryIcon} alarm />;
}
