import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: Colors[colorScheme ?? 'light'].background,
          borderTopWidth: 0,
          elevation: 0,
          height: 80,
          paddingTop: 10,
          paddingBottom: 25,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          borderTopLeftRadius: 30,
          borderTopRightRadius: 30,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1,
          shadowRadius: 10,
        },
        tabBarLabelStyle: {
          fontWeight: '800',
          fontSize: 11,
          marginTop: 4,
        }
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Resumen',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Ajustes',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="gearshape.fill" color={color} />,
          href: '/recurring', // Redirigir directamente a la pantalla de configuración real
        }}
      />
    </Tabs>
  );
}
