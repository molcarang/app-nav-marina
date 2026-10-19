import { useTranslation } from '../../localization/LanguageProvider';
import EngineInstrumentGauge from './EngineInstrumentGauge';
import CoolantTemperatureIcon from '../icons/CoolantTemperatureIcon';

export default function EngineTemperatureGauge({ size, bezelWidth, temperatureCelsius, connected }) {
    const { t } = useTranslation();
    const value = connected && Number.isFinite(temperatureCelsius) ? temperatureCelsius : null;
    const description = value === null ? t('engineTemperatureNoData')
        : t('engineTemperatureDescription', { value: Math.round(value) });
    return <EngineInstrumentGauge size={size} bezelWidth={bezelWidth} value={value} maximum={120} tickStep={5} majorStep={20}
        label={t('engineTemperatureGaugeLabel')} unit="°C" description={description} icon={CoolantTemperatureIcon} />;
}
