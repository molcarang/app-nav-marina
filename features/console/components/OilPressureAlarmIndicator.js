import { useTranslation } from '../../../localization/LanguageProvider';
import OilPressureIcon from '../../../components/icons/OilPressureIcon';
import StatusIndicator from './StatusIndicator';

export default function OilPressureAlarmIndicator({ connected, oilPressureAlarm }) {
    const { t } = useTranslation();
    const active = connected && oilPressureAlarm === true;
    const label = !connected || oilPressureAlarm == null ? 'oilPressureAlarmUnknown'
        : active ? 'oilPressureAlarmActive' : 'oilPressureAlarmInactive';
    return <StatusIndicator active={active} label={t(label)} icon={OilPressureIcon} alarm />;
}
