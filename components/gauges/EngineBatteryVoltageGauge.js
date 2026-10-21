import { useTranslation } from '../../localization/LanguageProvider';
import EngineInstrumentGauge from './EngineInstrumentGauge';
import LowBatteryIcon from '../icons/LowBatteryIcon';

export default function EngineBatteryVoltageGauge({ size, bezelWidth, batteryVoltage, connected }) {
    const { t } = useTranslation();
    const value = connected && Number.isFinite(batteryVoltage) && batteryVoltage >= 0 ? batteryVoltage : null;
    const description = value === null ? t('engineBatteryVoltageNoData')
        : t('engineBatteryVoltageDescription', { value: value.toFixed(1) });
    return <EngineInstrumentGauge size={size} bezelWidth={bezelWidth} value={value} maximum={16} tickStep={1} majorStep={4}
        label={t('engineBatteryVoltageGaugeLabel')} unit="V" description={description} icon={LowBatteryIcon} decimals={1} />;
}
