import { useTranslation } from '../localization/LanguageProvider';
import { Component } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';

/** Hace visible el componente que falla cuando el dispositivo no tiene depurador conectado. */
export default class StartupErrorBoundary extends Component {
    state = { error: null, componentStack: '' };

    static getDerivedStateFromError(error) {
        return { error };
    }

    componentDidCatch(error, info) {
        this.setState({ componentStack: info.componentStack || '' });
        console.warn('[Arranque] Error de renderizado:', error.message, info.componentStack);
    }

    render() {
        if (!this.state.error) return this.props.children;
        return <StartupError error={this.state.error} componentStack={this.state.componentStack} />;
    }
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: '#101820' },
    content: { padding: 24, paddingTop: 50 },
    title: { color: '#8fcbdc', fontSize: 20, marginBottom: 14, marginTop: 16 },
    message: { color: '#fff', fontSize: 15 },
    stack: { color: '#ddd', fontSize: 13 },
});

function StartupError({ error, componentStack }) {
    const { t } = useTranslation();
        return <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
            <Text style={styles.title}>{t('startupError')}</Text>
            <Text selectable style={styles.message}>{error.message}</Text>
            <Text style={styles.title}>{t('errorComponents')}</Text>
            <Text selectable style={styles.stack}>{componentStack || t('diagnostics')}</Text>
        </ScrollView>;
}
