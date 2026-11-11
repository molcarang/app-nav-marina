import { useTranslation } from '../../../localization/LanguageProvider';
import { useState } from 'react';
import { View } from 'react-native';
import { useControlScale } from '../../../hooks/useControlScale';
import EngineRunningIcon from '../../../components/icons/EngineRunningIcon';
import StatusIndicator from './StatusIndicator';
import EngineDashboard from './EngineDashboard';
import EngineAlarmIndicators from './EngineAlarmIndicators';

export default function EngineStatusIndicator({ connected, engineRunning, navigation, settings, showEngineAlarms = false, alarmScale = 1, alarmTop, onDashboardVisibilityChange }) {
    const { t } = useTranslation();
    const scale = useControlScale();
    const [dashboardOpen, setDashboardOpen] = useState(false);
    const running = connected && engineRunning === true;
    const label = !connected || engineRunning == null ? 'engineStatusUnknown'
        : running ? 'engineStatusRunning' : 'engineStatusStopped';
    return <>
        <StatusIndicator active={running} label={t(label)} icon={EngineRunningIcon}
            onPress={() => { setDashboardOpen(true); onDashboardVisibilityChange?.(true); }} hint={t('openEngineDashboard')} />
        {showEngineAlarms && running && !dashboardOpen &&
            <View style={{ position: 'absolute', left: 0, top: alarmTop ?? 62.6 * scale,
                width: 62.4 * scale * alarmScale, height: 305 * scale * alarmScale }}>
                <View style={{ width: 62.4 * scale, transformOrigin: 'top left', transform: [{ scale: alarmScale }] }}>
                    <EngineAlarmIndicators vertical connected={connected} navigation={navigation} settings={settings} frameWidth={1 / alarmScale} />
                </View>
            </View>}
        {dashboardOpen && <EngineDashboard connected={connected} engineRunning={engineRunning} navigation={navigation} settings={settings}
            onClose={() => { setDashboardOpen(false); onDashboardVisibilityChange?.(false); }} />}
    </>;
}
