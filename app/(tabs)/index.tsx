import { StyleSheet, TouchableOpacity, ScrollView, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import Svg, { Path, G } from 'react-native-svg';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { store } from '@/store/financeStore';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function HomeScreen() {
  const router = useRouter();
  const systemColorScheme = useColorScheme();
  const [data, setData] = useState(store.getCurrentMonthData());
  const [history, setHistory] = useState(store.getPastMonthsHistory());
  const [appTheme, setAppTheme] = useState(store.getTheme());
  const [privacyMode, setPrivacyMode] = useState(store.isPrivacyMode());

  useEffect(() => {
    const unsub = store.subscribe(() => {
      setData(store.getCurrentMonthData());
      setHistory(store.getPastMonthsHistory());
      setAppTheme(store.getTheme());
      setPrivacyMode(store.isPrivacyMode());
    });
    return unsub;
  }, []);

  const colorScheme = appTheme === 'auto' ? systemColorScheme : appTheme;
  const isDark = colorScheme === 'dark';

  const { movements, incomeTotal, expenseTotal, available, cycleStart, cycleEnd } = data;
  
  const totalSlots = incomeTotal + expenseTotal;
  const incomePercentage = totalSlots === 0 ? 0 : incomeTotal / totalSlots; 
  const expensePercentage = totalSlots === 0 ? 0 : expenseTotal / totalSlots; 

  const incomeArcSweepAngle = incomePercentage * 360;
  const expenseArcSweepAngle = expensePercentage * 360;

  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
      x: centerX + (radius * Math.cos(angleInRadians)),
      y: centerY + (radius * Math.sin(angleInRadians))
    };
  };

  const describeArc = (x: number, y: number, radius: number, startAngle: number, endAngle: number) => {
    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
    return [
      'M', start.x, start.y,
      'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y
    ].join(' ');
  };

  const formatDateRange = (start: Date, end: Date) => {
    return `${start.getDate()}/${start.getMonth()+1} al ${end.getDate()}/${end.getMonth()+1}`;
  };

  const toggleTheme = () => {
    const next = appTheme === 'light' ? 'dark' : 'light';
    store.setTheme(next);
  };

  const togglePrivacy = () => {
    store.togglePrivacyMode();
  };

  const maskValue = (val: number | string) => {
    if (privacyMode) return '****';
    if (typeof val === 'number') return val.toFixed(0) + '€';
    return val;
  };

  const maskAmount = (val: number | null) => {
    if (val === null) return '-';
    if (privacyMode) return '****';
    return val.toFixed(0) + '€';
  };

  // Theme-aware styles
  const dynamicStyles = {
    container: { backgroundColor: isDark ? '#0F172A' : '#F8FAFC' },
    card: { backgroundColor: isDark ? '#1E293B' : 'white' },
    textMain: { color: isDark ? '#F1F5F9' : '#1E293B' },
    textSub: { color: isDark ? '#94A3B8' : '#64748B' },
    iconBg: { backgroundColor: isDark ? '#334155' : '#EEF2FF' },
    border: { borderColor: isDark ? '#334155' : '#E2E8F0' },
  };

  return (
    <ThemedView style={[styles.container, dynamicStyles.container]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity style={[styles.themeButton, dynamicStyles.card]} onPress={toggleTheme}>
               <IconSymbol name={isDark ? "sun.max.fill" : "moon.fill"} size={20} color={isDark ? "#FACC15" : "#6366F1"} />
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.themeButton, dynamicStyles.card, { marginLeft: 10 }]} onPress={togglePrivacy}>
               <IconSymbol name={privacyMode ? "eye.slash.fill" : "eye.fill"} size={20} color="#64748B" />
            </TouchableOpacity>
          </View>
          
          <View style={{ flex: 1, alignItems: 'center' }}>
            <ThemedText style={[styles.greeting, dynamicStyles.textMain]}>Bienvenido 👋</ThemedText>
            <ThemedText style={[styles.subGreeting, dynamicStyles.textSub]}>Resumen mensual</ThemedText>
          </View>

          <TouchableOpacity style={[styles.profileButton, dynamicStyles.card]} onPress={() => router.push('/recurring')}>
             <IconSymbol name="person.fill" size={24} color="#6366F1" />
          </TouchableOpacity>
        </View>

        {/* Info del Ciclo */}
        <View style={{ alignItems: 'center', marginBottom: 20 }}>
            <ThemedText style={styles.cycleText}>Ciclo: {formatDateRange(cycleStart, cycleEnd)}</ThemedText>
        </View>

        {/* Chart Section */}
        <View style={styles.chartSection}>
          <View style={styles.chartWrapper}>
            <Svg height="200" width="200" viewBox="0 0 200 200">
              <G rotation="-90" origin="100, 100">
                <Path
                  d={describeArc(100, 100, 80, 0, 359.9)}
                  stroke={isDark ? "#334155" : "#F1F5F9"}
                  strokeWidth="30"
                  fill="none"
                />
                {incomeTotal > 0 && (
                  <Path
                    d={describeArc(100, 100, 80, 0, incomeArcSweepAngle)}
                    stroke="#10B981"
                    strokeWidth="30"
                    strokeLinecap="round"
                    fill="none"
                  />
                )}
                {expenseTotal > 0 && (
                  <Path
                    d={describeArc(100, 100, 80, incomeArcSweepAngle, incomeArcSweepAngle + expenseArcSweepAngle)}
                    stroke="#EF4444"
                    strokeWidth="30"
                    strokeLinecap="round"
                    fill="none"
                  />
                )}
              </G>
            </Svg>
          </View>

          {/* Totales del Ciclo */}
          <View style={styles.cycleTotalsRow}>
            <View style={styles.cycleTotalItem}>
              <ThemedText style={styles.availableLabel}>Disponible</ThemedText>
              <ThemedText style={[styles.availableAmount, { color: available >= 0 ? '#10B981' : '#EF4444' }]}>
                {maskAmount(available)}
              </ThemedText>
            </View>
            <View style={[styles.cycleTotalDivider, { backgroundColor: isDark ? '#334155' : '#E2E8F0' }]} />
            <View style={styles.cycleTotalItem}>
              <ThemedText style={styles.availableLabel}>Gastado</ThemedText>
              <ThemedText style={[styles.availableAmount, dynamicStyles.textMain]}>
                {maskAmount(expenseTotal)}
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: isDark ? '#064E3B' : '#ECFDF5' }]}>
            <ThemedText style={[styles.summaryTitle, { color: isDark ? '#34D399' : '#065F46' }]}>Ingresos</ThemedText>
            <ThemedText style={[styles.summaryAmount, { color: isDark ? '#10B981' : '#059669' }]}>{`+${incomeTotal}€`}</ThemedText>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: isDark ? '#7F1D1D' : '#FEF2F2' }]}>
            <ThemedText style={[styles.summaryTitle, { color: isDark ? '#FCA5A5' : '#991B1B' }]}>Gastos</ThemedText>
            <ThemedText style={[styles.summaryAmount, { color: isDark ? '#EF4444' : '#DC2626' }]}>{`-${expenseTotal}€`}</ThemedText>
          </View>
        </View>

        {/* Transaction List */}
        <View style={styles.transactionsHeader}>
          <ThemedText type="subtitle" style={dynamicStyles.textMain}>Últimos movimientos</ThemedText>
          <TouchableOpacity onPress={() => router.push({ pathname: '/details', params: { index: '0' } })}>
            <ThemedText style={styles.seeAllText}>Ver todos</ThemedText>
          </TouchableOpacity>
        </View>

        <View style={styles.transactionList}>
          {movements.length === 0 ? (
            <View style={[styles.emptyContainer, dynamicStyles.card, { borderStyle: 'dashed', borderWidth: 1, borderColor: isDark ? '#334155' : '#E2E8F0' }]}>
              <IconSymbol name="plus.circle.fill" size={32} color={isDark ? "#334155" : "#CBD5E1"} />
              <ThemedText style={styles.emptyText}>No hay movimientos todavía</ThemedText>
            </View>
          ) : (
            movements.slice(0, 5).map((t) => (
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
                    {t.isRecurring ? 'Recurrente' : new Date(t.date).toLocaleDateString()}
                  </ThemedText>
                </View>
                <ThemedText style={[styles.transactionAmount, { color: t.type === 'income' ? '#10B981' : '#EF4444' }]}>
                  {t.type === 'income' ? '+' : '-'}{maskAmount(t.amount)}
                </ThemedText>
              </View>
            ))
          )}
        </View>

        {/* History Section */}
        <View style={[styles.transactionsHeader, { marginTop: 30 }]}>
          <ThemedText type="subtitle" style={dynamicStyles.textMain}>Balance de ciclos pasados</ThemedText>
          {history.length > 0 && (
            <TouchableOpacity onPress={() => router.push('/history')}>
              <IconSymbol name="chevron.right" size={18} color="#6366F1" />
            </TouchableOpacity>
          )}
        </View>

        {history.length === 0 ? (
          <View style={[styles.historyEmptyCard, dynamicStyles.card, { borderStyle: 'dashed', borderWidth: 1, borderColor: isDark ? '#334155' : '#E2E8F0' }]}>
            <ThemedText style={styles.historyEmptyText}>Aún no hay datos de otros meses</ThemedText>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.historyScroll}>
            {history.slice(0, 4).map((h: any) => (
              <TouchableOpacity 
                key={h.id} 
                style={[styles.historyCard, dynamicStyles.card]}
                onPress={() => router.push({ pathname: '/details', params: { index: h.index.toString() } })}
              >
                <ThemedText style={styles.historyMonth}>{h.month.toUpperCase()}</ThemedText>
                  <ThemedText style={[styles.historyBalance, { color: h.balance >= 0 ? '#10B981' : '#EF4444' }]}>
                    {maskAmount(h.balance)}
                  </ThemedText>
                <ThemedText style={styles.historyStatus}>{h.balance >= 0 ? 'AHORRO' : 'DÉFICIT'}</ThemedText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={() => router.push('/modal')}>
        <IconSymbol name="plus" size={32} color="white" />
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  themeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  greeting: {
    fontSize: 20,
    fontWeight: '800',
  },
  subGreeting: {
    fontSize: 14,
  },
  cycleText: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
    fontWeight: '700',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  chartSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  chartWrapper: {
    height: 200,
    width: 200,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  cycleTotalsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    gap: 30,
  },
  cycleTotalItem: {
    alignItems: 'center',
  },
  cycleTotalDivider: {
    width: 1,
    height: 30,
  },
  availableLabel: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '700',
    marginBottom: 4,
  },
  availableAmount: {
    fontSize: 22,
    fontWeight: '800',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 30,
    marginTop: 10,
  },
  summaryCard: {
    flex: 1,
    padding: 20,
    borderRadius: 20,
    justifyContent: 'center',
  },
  summaryTitle: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 6,
  },
  summaryAmount: {
    fontSize: 18,
    fontWeight: '800',
  },
  transactionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  seeAllText: {
    color: '#6366F1',
    fontWeight: '700',
  },
  transactionList: {
    gap: 12,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 20,
  },
  categoryIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionInfo: {
    flex: 1,
    marginLeft: 12,
  },
  transactionTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  transactionCategory: {
    fontSize: 12,
    color: '#94A3B8',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '800',
  },
  historyScroll: {
    gap: 12,
    paddingBottom: 10,
  },
  historyCard: {
    padding: 15,
    borderRadius: 18,
    width: 120,
    alignItems: 'center',
  },
  historyMonth: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    marginBottom: 4,
  },
  historyBalance: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  historyStatus: {
    fontSize: 9,
    fontWeight: '800',
    color: '#CBD5E1',
  },
  historyEmptyCard: {
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyEmptyText: {
    fontSize: 14,
  },
  fab: {
    position: 'absolute',
    bottom: 100, // Subido de 30 a 100 para evitar la barra inferior
    right: 30,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 99, // Asegurar que esté por encima de todo
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
  },
  emptyText: {
    marginTop: 10,
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
  },
});