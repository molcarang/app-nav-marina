import { useTranslation } from '../../../localization/LanguageProvider';
import AlternatorChargeIcon from '../../../components/icons/AlternatorChargeIcon';
import StatusIndicator from './StatusIndicator';

export default function AlternatorChargeAlarmIndicator({ connected, alternatorChargeAlarm }) {
    const { t } = useTranslation();
    const active = connected && alternatorChargeAlarm === true;
    const label = !connected || alternatorChargeAlarm == null ? 'alternatorChargeAlarmUnknown'
        : active ? 'alternatorChargeAlarmActive' : 'alternatorChargeAlarmInactive';
    return <StatusIndicator active={active} label={t(label)} icon={AlternatorChargeIcon} alarm alarmColor="#ff9800" />;
}
