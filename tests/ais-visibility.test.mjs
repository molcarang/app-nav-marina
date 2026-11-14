import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import * as alertState from '../features/console/model/aisAlertState.js';
import { AIS_RISK_COLORS } from '../features/console/model/aisCollisionRisk.js';

const require = createRequire(import.meta.url);
const babel = require('@babel/core');
const compile = path => babel.transformSync(readFileSync(new URL(path, import.meta.url), 'utf8'), {
    configFile: false, babelrc: false,
    plugins: [['@babel/plugin-transform-react-jsx', { runtime: 'automatic' }], '@babel/plugin-transform-modules-commonjs'],
}).code;
const screenCode = compile('../features/console/ConsoleScreen.js');
const alarmCode = compile('../features/console/hooks/useAisCollisionAlarm.js');
const noticeCode = compile('../features/console/components/AisCollisionNotice.js');
const bellCode = compile('../features/console/components/AisAlarmBell.js');
const target = level => ({ collision: { level } });

// Exercise the console toggle with the real AIS alarm and notice, replacing device services.
function harness(landscape = false) {
    const state = [], effects = [];
    let stateIndex, effectIndex, pendingEffects, dirty, targets, elements, voices, page, notice, bell, frames;
    const react = {
        useState(initial) {
            const index = stateIndex++;
            if (!(index in state)) state[index] = initial;
            return [state[index], next => {
                const value = typeof next === 'function' ? next(state[index]) : next;
                if (!Object.is(value, state[index])) { state[index] = value; dirty = true; }
            }];
        },
        useEffect(callback, deps) {
            const index = effectIndex++;
            if (!effects[index] || deps.some((dep, i) => !Object.is(dep, effects[index][i]))) {
                effects[index] = deps;
                pendingEffects.push(callback);
            }
        },
        useCallback: callback => callback,
        useMemo: callback => callback(),
    };
    const jsx = (type, props) => {
        const element = { type, props };
        elements.push(element);
        return element;
    };
    const nightDimmer = { __esModule: true, default: 'NightDimmer', NightModeContext: { Provider: 'NightModeProvider' } };
    const modules = {
        react,
        'react/jsx-runtime': { jsx, jsxs: jsx },
        'react-native': {
            useWindowDimensions: () => landscape ? { width: 1000, height: 600 } : { width: 600, height: 1000 },
            StyleSheet: { create: styles => styles },
            Modal: 'Modal', ScrollView: 'ScrollView', Text: 'Text', TouchableOpacity: 'TouchableOpacity', View: 'View',
        },
        '../model/aisAlertState.js': alertState,
        '../model/aisCollisionRisk': { AIS_RISK_COLORS },
        './useAlarmSound': { useAlarmSound: active => voices.push(active) },
        '../../../localization/LanguageProvider': { useTranslation: () => ({ t: key => key }) },
        '../../../components/NightDimmer': nightDimmer,
        '@expo/vector-icons': { MaterialIcons: 'MaterialIcons' },
        '../../../hooks/useControlScale': { useControlScale: () => 1 },
        '../../components/UpdateNotice': 'UpdateNotice',
        './hooks/useVisibleAisCount': { useVisibleAisCount: () => 0 },
        './hooks/useAisAutoRange': { useAisAutoRange: () => 6 },
        '../../services/signalk/useSignalKData': { useSignalKData: () => ({ isConnected: true }) },
        '../../services/signalk/useWaypointData': { useWaypointData: () => ({}) },
        '../../services/signalk/useAisData': { useAisData: () => ({ targets, status: 'connected' }) },
        './components/ConsoleSettingsModal': 'ConsoleSettingsModal',
        './hooks/useConsoleSettings': { useConsoleSettings: () => ({ settings: {}, isLoaded: true }) },
        './hooks/useAnchorWatch': { AnchorWatchContext: { Provider: 'AnchorWatchProvider' }, useAnchorWatch: () => ({}) },
        './hooks/useAnchorAlarmSound': { useAnchorAlarmSound() {} },
        './hooks/useDepthAlarmSound': { useDepthAlarmSound: () => ({ remainingSeconds: 0 }) },
        './hooks/useSessionMaxima': { useSessionMaxima: () => ({}) },
        './hooks/useInstrumentHistory': { useInstrumentHistory: () => ({ history: [] }) },
        './model/navigationData': { deriveNavigationData: () => ({}) },
        './screens/NavigationPage': 'NavigationPage',
        './screens/LandscapeNavigationPage': 'LandscapeNavigationPage',
        './styles/consoleStyles': { styles: {} },
        './styles/consoleTheme': { getConsoleTheme: () => ({}) },
        '../../components/NightDimmer': nightDimmer,
        '../../localization/LanguageProvider': { LanguageProvider: 'LanguageProvider' },
        '../../components/StartupLauncher': 'StartupLauncher',
        './hooks/useAisCollisionRisk': { useAisCollisionRisk: vessels => vessels },
        './hooks/useEngineConsumption': { useEngineConsumption: () => 0 },
        './hooks/useEngineConsumptionTotal': {
            EngineConsumptionTotalContext: { Provider: 'EngineConsumptionTotalProvider' }, useEngineConsumptionTotal: () => ({}),
        },
        './hooks/useEngineHours': { EngineHoursContext: { Provider: 'EngineHoursProvider' }, useEngineHours: () => ({}) },
    };
    function load(code) {
        const exports = {};
        vm.runInNewContext(code, { exports, require(name) {
            if (name.endsWith('.wav')) return name;
            if (Object.hasOwn(modules, name)) return modules[name];
            throw Error(`Unexpected import: ${name}`);
        } });
        return exports;
    }
    modules['./hooks/useAisCollisionAlarm'] = load(alarmCode);
    modules['./components/AisCollisionNotice'] = load(noticeCode);
    const AisCollisionNotice = modules['./components/AisCollisionNotice'].default;
    const AisAlarmBell = load(bellCode).default;
    const ConsoleScreen = load(screenCode).default;
    return {
        render(nextTargets) {
            targets = nextTargets;
            frames = [];
            do {
                stateIndex = effectIndex = 0; pendingEffects = []; elements = []; voices = []; dirty = false;
                ConsoleScreen();
                page = elements.find(element => element.type === (landscape ? 'LandscapeNavigationPage' : 'NavigationPage')).props;
                notice = AisCollisionNotice(elements.find(element => element.type === AisCollisionNotice).props).props;
                bell = AisAlarmBell({ alarm: page.aisAlarm });
                frames.push({ voices: [...voices], noticeVisible: notice.visible });
                for (const callback of pendingEffects) callback();
            } while (dirty);
        },
        toggleAis() { page.onToggleAis(); },
        acknowledge() { bell.props.onPress(); notice.onRequestClose(); },
        toggleMute() { bell.props.onPress(); },
        get alarm() { return page.aisAlarm; },
        get frames() { return frames; },
        get voices() { return voices; },
        get noticeVisible() { return notice.visible; },
        get muteButton() { return bell; },
    };
}

for (const landscape of [false, true]) {
    const orientation = landscape ? 'horizontal' : 'vertical';
    for (const level of ['warning', 'danger']) test(`AIS ${orientation}: desactivar detiene sonido y avisos ${level}, incluso con nuevos contactos`, () => {
        const app = harness(landscape);
        const vessels = { a: target(level) };
        const assertInactive = () => {
            assert.equal(app.alarm.level, null);
            assert.ok(app.frames.every(frame => frame.voices.every(active => !active) && !frame.noticeVisible));
        };
        app.render(vessels);
        assertInactive();
        app.toggleAis();
        app.render(vessels);
        assert.equal(app.alarm.level, level);
        assert.deepEqual(app.voices, [level === 'warning', level === 'danger']);
        assert.equal(app.noticeVisible, true);

        app.toggleAis();
        app.render(vessels);
        assertInactive();
        const updatedVessels = { a: target('danger'), b: target('warning') };
        app.render(updatedVessels);
        assertInactive();

        app.toggleAis();
        app.render(updatedVessels);
        assert.equal(app.alarm.level, 'danger');
        assert.deepEqual(app.voices, [false, true]);
        assert.equal(app.noticeVisible, true);
    });

    test(`AIS ${orientation}: volver a activar rearma los avisos silenciados y cerrados`, () => {
        const app = harness(landscape);
        const vessels = { a: target('danger') };
        app.render(vessels);
        app.toggleAis();
        app.render(vessels);
        app.acknowledge();
        app.render(vessels);
        assert.equal(app.alarm.muted, true);
        assert.deepEqual(app.voices, [false, false]);
        assert.equal(app.noticeVisible, false);

        app.toggleAis();
        app.render(vessels);
        assert.equal(app.alarm.level, null);
        app.toggleAis();
        app.render(vessels);
        assert.equal(app.alarm.muted, false);
        assert.deepEqual(app.voices, [false, true]);
        assert.equal(app.noticeVisible, true);
    });

    test(`AIS ${orientation}: el boton mantiene la zona del muteo y permite anularlo sin avisos activos`, () => {
        const app = harness(landscape);
        app.render({ a: target('danger') });
        app.toggleAis();
        app.render({ a: target('danger') });
        app.acknowledge();
        app.render({ a: target('warning') });
        assert.equal(app.alarm.muted, true);
        app.render({ a: target('danger') });
        assert.equal(app.alarm.muted, true);
        assert.deepEqual(app.voices, [false, false]);

        app.render({ a: target('clear') });
        assert.equal(app.alarm.level, null);
        assert.equal(app.alarm.muted, true);
        assert.equal(app.muteButton.props.accessibilityLabel, 'aisAlarmUnmute');
        assert.equal(app.muteButton.props.accessibilityState.selected, true);
        app.toggleMute();
        app.render({ a: target('clear') });
        assert.equal(app.alarm.muted, false);
        assert.equal(app.muteButton, null);
        app.render({ a: target('danger') });
        assert.deepEqual(app.voices, [false, true]);
    });
}
