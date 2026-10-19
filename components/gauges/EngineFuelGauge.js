import { useTranslation } from '../../localization/LanguageProvider';
import EngineInstrumentGauge from './EngineInstrumentGauge';
import FuelLevelIcon from '../icons/FuelLevelIcon';
import { normalizeLowFuelPercent } from '../../features/console/model/lowFuelAlarm.js';

export default function EngineFuelGauge({ size, bezelWidth, fuelLevelPercent, connected, lowFuelAlarmPercent }) {
    const { t } = useTranslation();
    const value = connected && Number.isFinite(fuelLevelPercent) && fuelLevelPercent >= 0 && fuelLevelPercent <= 100 ? fuelLevelPercent : null;
    const description = value === null ? t('engineFuelNoData')
        : t('engineFuelDescription', { value: Math.round(value) });
    return <EngineInstrumentGauge size={size} bezelWidth={bezelWidth} value={value} maximum={100} tickStep={5} majorStep={25}
        label={t('engineFuelGaugeLabel')} unit="%" description={description} icon={FuelLevelIcon}
        lowWarningThreshold={normalizeLowFuelPercent(lowFuelAlarmPercent)} />;
}
