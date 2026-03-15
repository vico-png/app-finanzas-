import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Fonts } from '@/constants/theme';

export default function ChatScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const dynamicStyles = {
    container: { backgroundColor: isDark ? '#0F172A' : '#F8FAFC' },
    iconBg: { backgroundColor: isDark ? '#1E293B' : '#EEF2FF' },
    textMain: { color: isDark ? '#F1F5F9' : '#1E293B' },
    textSub: { color: isDark ? '#94A3B8' : '#64748B' },
  };

  return (
    <ThemedView style={[styles.container, dynamicStyles.container]}>
      <View style={styles.content}>
        <View style={[styles.iconContainer, dynamicStyles.iconBg]}>
          <IconSymbol name="sparkles" size={60} color="#6366F1" />
        </View>
        
        <ThemedText style={[styles.title, dynamicStyles.textMain]}>
          Asistente IA
        </ThemedText>
        
        <View style={styles.badge}>
          <ThemedText style={styles.badgeText}>PRÓXIMAMENTE</ThemedText>
        </View>

        <ThemedText style={[styles.description, dynamicStyles.textSub]}>
          Estamos entrenando a tu asistente financiero personal para que pueda analizar tus gastos, 
          ayudarte a ahorrar y responder todas tus dudas económicas.
        </ThemedText>

        <View style={styles.featureList}>
          <View style={styles.featureItem}>
            <IconSymbol name="chart.bar.fill" size={20} color="#10B981" />
            <ThemedText style={[styles.featureText, dynamicStyles.textSub]}>Análisis de gastos automático</ThemedText>
          </View>
          <View style={styles.featureItem}>
            <IconSymbol name="lightbulb.fill" size={20} color="#FACC15" />
            <ThemedText style={[styles.featureText, dynamicStyles.textSub]}>Consejos de ahorro personalizados</ThemedText>
          </View>
          <View style={styles.featureItem}>
            <IconSymbol name="message.fill" size={20} color="#6366F1" />
            <ThemedText style={[styles.featureText, dynamicStyles.textSub]}>Consulta tus dudas en lenguaje natural</ThemedText>
          </View>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 30,
    alignItems: 'center',
    width: '100%',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 10,
    textAlign: 'center',
  },
  badge: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 20,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  featureList: {
    width: '100%',
    gap: 15,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
    padding: 15,
    borderRadius: 15,
    gap: 15,
  },
  featureText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
