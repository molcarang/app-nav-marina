import { View } from 'react-native';
import ControlPanelBase from '../../../components/ControlPanelBase';
import DataSquare from '../../../components/DataSquare';
import SogGauge from '../../../components/gauges/SOGGauge';
import NavigationMode from '../../../components/NavigationMode';
import SailDataOverlay from '../../../components/SailDataOverlay';
import ConsolePage from '../components/ConsolePage';
import ConnectionHeader from '../components/ConnectionHeader';
import { derivePerformance } from '../model/navigationData';
import { styles } from '../styles/consoleStyles';
/** Segunda página: velocidad y panel de instrumentos. */
export default function TelemetryPage({ navigation, settings, maxSOG, isConnected, isNightMode, theme, windowWidth, windowHeight, gaugeSize }) {
    const performance = derivePerformance(navigation, maxSOG, settings.minAnguloCeñida);
    return (
        <ConsolePage
            width={windowWidth}
            isNightMode={isNightMode}
        >
            <View style={styles.dataGrid}>
                <ConnectionHeader
                    isConnected={isConnected}
                    isNightMode={isNightMode}
                />
            </View>

            <View style={[styles.row, { marginBottom: windowHeight * 0.025 }]}>
                <SogGauge
                    size={gaugeSize}
                    value={parseFloat(navigation.sogKnots)}
                    isSail={navigation.navigationMode === 'SAIL'}
                    maxSpeed={maxSOG > 5 ? Math.ceil(maxSOG) : 10}
                    isNightMode={isNightMode}
                    headingColor={theme.heading}
                />
            </View>
            <View style={[styles.row, { marginBottom: windowHeight * 0.025 }]}>
                <NavigationMode
                    isSail={navigation.navigationMode === 'SAIL'}
                    isNightMode={isNightMode}
                >
                </NavigationMode>
            </View>
            <View style={styles.row}>
                <ControlPanelBase>
                    {navigation.navigationMode === 'SAIL' ? (<>
                        <SailDataOverlay
                            rudderAngle={navigation.rudderAngle}
                            rudderLimit={settings.rudderLimit}
                            heading={navigation.cogDeg}
                            vmg={performance.vmg}
                            targetVMG={performance.targetVMG}
                            vesselHeelDeg={navigation.vesselHeelDeg}
                            size={125}
                        />
                    </>) : (<SailDataOverlay
                        rudderAngle={navigation.rudderAngle}
                        rudderLimit={settings.rudderLimit}
                        heading={navigation.cogDeg}
                            />)}
                </ControlPanelBase>
            </View>
            <View style={styles.row}>
                <View style={{ marginTop: 40 }}>
                    <DataSquare
                        label="VMC"
                        value={performance.vmc.toFixed(1)}
                        unit="KTS"
                        color={theme.bg}
                    />
                </View>
            </View>

        </ConsolePage>
    );
}
