import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

import { store } from '@/store/financeStore';
import { useState, useEffect } from 'react';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const systemColorScheme = useColorScheme();
  const [appTheme, setAppTheme] = useState(store.getTheme());

  useEffect(() => {
    const unsub = store.subscribe(() => {
      setAppTheme(store.getTheme());
    });
    return unsub;
  }, []);

  const colorScheme = appTheme === 'auto' ? systemColorScheme : appTheme;

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Añadir' }} />
        <Stack.Screen name="recurring" options={{ presentation: 'modal', title: 'Recurrentes' }} />
        <Stack.Screen name="history" options={{ presentation: 'modal', title: 'Historial' }} />
        <Stack.Screen name="details" options={{ presentation: 'modal', title: 'Detalles' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
