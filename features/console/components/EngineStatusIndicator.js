import { useTranslation } from '../../../localization/LanguageProvider';
import { useState } from 'react';
import EngineRunningIcon from '../../../components/icons/EngineRunningIcon';
import StatusIndicator from './StatusIndicator';
import EngineDashboard from './EngineDashboard';

export default function EngineStatusIndicator({ connected, engineRunning, navigation, settings }) {
    const { t } = useTranslation();
    const [dashboardOpen, setDashboardOpen] = useState(false);
    const running = connected && engineRunning === true;
    const label = !connected || engineRunning == null ? 'engineStatusUnknown'
        : running ? 'engineStatusRunning' : 'engineStatusStopped';
    return <>
        <StatusIndicator active={running} label={t(label)} icon={EngineRunningIcon}
            onPress={() => setDashboardOpen(true)} hint={t('openEngineDashboard')} />
        {dashboardOpen && <EngineDashboard connected={connected} engineRunning={engineRunning} navigation={navigation} settings={settings}
            onClose={() => setDashboardOpen(false)} />}
    </>;
}
