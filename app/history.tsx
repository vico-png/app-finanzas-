import { useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { store } from '@/store/financeStore';

export default function HistoryScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [history, setHistory] = useState(store.getPastMonthsHistory());
  const [privacyMode, setPrivacyMode] = useState(store.isPrivacyMode());

  useEffect(() => {
    const unsub = store.subscribe(() => {
      setHistory(store.getPastMonthsHistory());
      setPrivacyMode(store.isPrivacyMode());
    });
    return unsub;
  }, []);

  const maskAmount = (val: number | null) => {
    if (val === null) return '-';
    if (privacyMode) return '****';
    return (val >= 0 ? '+' : '') + val.toFixed(0) + '€';
  };

  const dynamicStyles = {
    container: { backgroundColor: isDark ? '#0F172A' : '#F8FAFC' },
    card: { backgroundColor: isDark ? '#1E293B' : 'white' },
    header: { backgroundColor: isDark ? '#1E293B' : 'white' },
    textMain: { color: isDark ? '#F1F5F9' : '#1E293B' },
    iconBg: { backgroundColor: isDark ? '#334155' : '#F1F5F9' },
    monthIconBg: { backgroundColor: isDark ? '#334155' : '#EEF2FF' },
  };

  return (
    <ThemedView style={[styles.container, dynamicStyles.container]}>
      <View style={[styles.header, dynamicStyles.header]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.closeButton, dynamicStyles.iconBg]}>
          <IconSymbol name="chevron.right" size={24} color="#64748B" style={{ transform: [{ rotate: '180deg' }] }} />
        </TouchableOpacity>
        <ThemedText style={[styles.title, dynamicStyles.textMain]}>Historial de Balances</ThemedText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {history.length === 0 ? (
          <View style={styles.emptyContainer}>
            <IconSymbol name="paperplane.fill" size={48} color={isDark ? "#334155" : "#CBD5E1"} />
            <ThemedText style={styles.emptyText}>No hay historial disponible todavía</ThemedText>
          </View>
        ) : (
          history.map((h) => (
            <TouchableOpacity 
              key={h.id} 
              style={[styles.historyItem, dynamicStyles.card]} 
              onPress={() => router.push({ pathname: '/details', params: { index: h.index.toString() } })}
            >
              <View style={[styles.monthIcon, dynamicStyles.monthIconBg]}>
                <ThemedText style={styles.monthInitial}>{h.month.charAt(0).toUpperCase()}</ThemedText>
              </View>
              <View style={styles.info}>
                <ThemedText style={[styles.monthName, dynamicStyles.textMain]}>{h.month} {h.year}</ThemedText>
                <ThemedText style={styles.subtext}>Balance del ciclo</ThemedText>
              </View>
              <View style={styles.amountContainer}>
                <ThemedText style={[styles.balanceAmount, { color: h.balance >= 0 ? '#10B981' : '#EF4444' }]}>
                  {maskAmount(h.balance)}
                </ThemedText>
                <View style={[styles.badge, { backgroundColor: h.balance >= 0 ? (isDark ? '#064E3B' : '#ECFDF5') : (isDark ? '#450A0A' : '#FEF2F2') }]}>
                   <ThemedText style={[styles.badgeText, { color: h.balance >= 0 ? '#10B981' : '#EF4444' }]}>
                     {h.balance >= 0 ? 'AHORRO' : 'DÉFICIT'}
                   </ThemedText>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 20,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 1,
  },
  monthIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthInitial: {
    fontSize: 18,
    fontWeight: '800',
    color: '#6366F1',
  },
  info: {
    flex: 1,
    marginLeft: 15,
  },
  monthName: {
    fontSize: 16,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  subtext: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 2,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  balanceAmount: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 4,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 15,
    color: '#94A3B8',
    fontSize: 16,
    textAlign: 'center',
  },
});
