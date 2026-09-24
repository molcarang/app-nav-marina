import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import StartupErrorBoundary from '@/components/StartupErrorBoundary';

SplashScreen.preventAutoHideAsync().catch(console.warn);

export const unstable_settings = { initialRouteName: 'index' };

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [fontsLoaded, fontError] = useFonts({
    NauticalFont: require('../assets/fonts/Venus_Rising_Rg.otf'),
  });
  const [fontTimeout, setFontTimeout] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setFontTimeout(true), 15000);
    return () => clearTimeout(timer);
  }, []);
  useEffect(() => {
    if (fontError) console.warn('No se pudo cargar la fuente náutica', fontError);
    if (fontsLoaded || fontError || fontTimeout) {
      SplashScreen.hideAsync().catch(console.warn);
    }
  }, [fontsLoaded, fontError, fontTimeout]);

  if (!fontsLoaded && !fontError && !fontTimeout) return null;

  return (
    <StartupErrorBoundary>
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{
        statusBarHidden: Platform.OS === 'android',
        navigationBarHidden: Platform.OS === 'android',
      }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" hidden={Platform.OS === 'android'} />
    </ThemeProvider>
    </StartupErrorBoundary>
  );
}
