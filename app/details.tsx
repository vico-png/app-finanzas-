import { useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, ScrollView, View } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { store } from '@/store/financeStore';

export default function DetailsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { index } = useLocalSearchParams<{ index: string }>();
  const cycleIndex = parseInt(index || '0');
  
  const [data, setData] = useState(store.getCycleData(cycleIndex));

  useEffect(() => {
    const unsub = store.subscribe(() => {
      setData(store.getCycleData(cycleIndex));
    });
    return unsub;
  }, [cycleIndex]);

  const { movements, incomeTotal, expenseTotal, available, cycleStart, cycleEnd } = data;

  const formatDate = (date: number) => {
    return new Date(date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  const dynamicStyles = {
    container: { backgroundColor: isDark ? '#0F172A' : '#F8FAFC' },
    card: { backgroundColor: isDark ? '#1E293B' : 'white' },
    header: { backgroundColor: isDark ? '#1E293B' : 'white' },
    textMain: { color: isDark ? '#F1F5F9' : '#1E293B' },
    iconBg: { backgroundColor: isDark ? '#334155' : '#F1F5F9' },
    border: { borderBottomColor: isDark ? '#334155' : '#F1F5F9', borderTopColor: isDark ? '#334155' : '#F1F5F9' },
  };

  return (
    <ThemedView style={[styles.container, dynamicStyles.container]}>
      <View style={[styles.header, dynamicStyles.header]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.closeButton, dynamicStyles.iconBg]}>
          <IconSymbol name="chevron.right" size={24} color="#64748B" style={{ transform: [{ rotate: '180deg' }] }} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <ThemedText style={[styles.title, dynamicStyles.textMain]}>Detalle del Ciclo</ThemedText>
          <ThemedText style={styles.subtext}>
            {cycleStart.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
          </ThemedText>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <View style={[styles.summaryStrip, dynamicStyles.header, { borderBottomWidth: 1, borderBottomColor: dynamicStyles.border.borderBottomColor }]}>
        <View style={styles.summaryItem}>
          <ThemedText style={styles.summaryLabel}>INGRESOS</ThemedText>
          <ThemedText style={[styles.summaryValue, { color: '#10B981' }]}>+{incomeTotal}€</ThemedText>
        </View>
        <View style={[styles.summaryDivider, { backgroundColor: dynamicStyles.border.borderBottomColor }]} />
        <View style={styles.summaryItem}>
          <ThemedText style={styles.summaryLabel}>GASTOS</ThemedText>
          <ThemedText style={[styles.summaryValue, { color: '#EF4444' }]}>-{expenseTotal}€</ThemedText>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <ThemedText style={styles.sectionTitle}>TODOS LOS MOVIMIENTOS</ThemedText>
        {movements.length === 0 ? (
          <View style={styles.emptyContainer}>
            <ThemedText style={styles.emptyText}>No hay movimientos en este periodo</ThemedText>
          </View>
        ) : (
          movements.map((t) => (
            <View key={t.id} style={[styles.transactionItem, dynamicStyles.card]}>
              <View style={[styles.categoryIcon, { backgroundColor: t.type === 'income' ? (isDark ? '#064E3B' : '#ECFDF5') : (isDark ? '#450A0A' : '#FEF2F2') }]}>
                <IconSymbol 
                  name={t.type === 'income' ? 'arrow.up.right' : 'arrow.down.left'} 
                  size={18} 
                  color={t.type === 'income' ? '#10B981' : '#EF4444'} 
                />
              </View>
              <View style={styles.transactionInfo}>
                <ThemedText style={[styles.transactionTitle, dynamicStyles.textMain]}>{t.title}</ThemedText>
                <ThemedText style={styles.transactionCategory}>
                  {t.isRecurring ? 'Recurrente' : formatDate(t.date)}
                </ThemedText>
              </View>
              <ThemedText style={[styles.transactionAmount, { color: t.type === 'income' ? '#10B981' : '#EF4444' }]}>
                {t.type === 'income' ? '+' : '-'}{t.amount}€
              </ThemedText>
            </View>
          ))
        )}
      </ScrollView>

      <View style={[styles.bottomBalance, dynamicStyles.header, { borderTopWidth: 1, borderTopColor: dynamicStyles.border.borderTopColor }]}>
        <ThemedText style={styles.balanceLabel}>RESULTADO FINAL</ThemedText>
        <ThemedText style={[styles.balanceValue, { color: available >= 0 ? '#10B981' : '#EF4444' }]}>
          {available >= 0 ? '+' : ''}{available}€
        </ThemedText>
      </View>
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
  headerTitleContainer: {
    alignItems: 'center',
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
  subtext: {
    fontSize: 12,
    color: '#94A3B8',
    textTransform: 'capitalize',
  },
  summaryStrip: {
    flexDirection: 'row',
    paddingVertical: 15,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  summaryDivider: {
    width: 1,
    height: '100%',
  },
  scrollContent: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1,
    marginBottom: 15,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 18,
    marginBottom: 12,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionInfo: {
    flex: 1,
    marginLeft: 12,
  },
  transactionTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  transactionCategory: {
    fontSize: 12,
    color: '#94A3B8',
  },
  transactionAmount: {
    fontSize: 15,
    fontWeight: '700',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#94A3B8',
    textAlign: 'center',
  },
  bottomBalance: {
    padding: 20,
    paddingBottom: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#64748B',
  },
  balanceValue: {
    fontSize: 20,
    fontWeight: '800',
  }
});
