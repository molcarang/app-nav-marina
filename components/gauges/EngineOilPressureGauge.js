import { useTranslation } from '../../localization/LanguageProvider';
import EngineInstrumentGauge from './EngineInstrumentGauge';
import OilPressureIcon from '../icons/OilPressureIcon';

export default function EngineOilPressureGauge({ size, bezelWidth, pressureBar, connected }) {
    const { t } = useTranslation();
    const value = connected && Number.isFinite(pressureBar) && pressureBar >= 0 ? pressureBar : null;
    const description = value === null ? t('engineOilPressureNoData')
        : t('engineOilPressureDescription', { value: value.toFixed(1) });
    return <EngineInstrumentGauge size={size} bezelWidth={bezelWidth} value={value} maximum={10} tickStep={0.5} majorStep={2}
        label={t('engineOilPressureGaugeLabel')} unit="bar" description={description} icon={OilPressureIcon} decimals={1} />;
}
