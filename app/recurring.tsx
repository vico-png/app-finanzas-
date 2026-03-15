import { useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, TextInput, View, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { store, RecurringItem } from '@/store/financeStore';

export default function RecurringScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const [items, setItems] = useState<RecurringItem[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [payDay, setPayDay] = useState(store.getPayDay().toString());
  
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [day, setDay] = useState('');
  const [endMonth, setEndMonth] = useState('');
  const [endYear, setEndYear] = useState('');
  const [isResetVerified, setIsResetVerified] = useState(false);

  useEffect(() => {
    setItems(store.getRecurring());
    const unsub = store.subscribe(() => {
      setItems(store.getRecurring());
      setPayDay(store.getPayDay().toString());
    });
    return unsub;
  }, []);

  const handleUpdatePayDay = (val: string) => {
    const d = parseInt(val);
    if (d >= 1 && d <= 31) {
      store.setPayDay(d);
    }
    setPayDay(val);
  };

  const handleResetApp = () => {
    if (!isResetVerified) {
      Alert.alert('Verificación', 'Por favor, marca la casilla para confirmar que quieres borrar todo.');
      return;
    }

    Alert.alert(
      'BORRAR TODO',
      '¿Estás complemente seguro? Esta acción no se puede deshacer y borrará todos tus movimientos y configuración.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'SÍ, BORRAR TODO', 
          style: 'destructive', 
          onPress: async () => {
            await store.clearAllData();
            Alert.alert('Éxito', 'La aplicación ha sido reseteada.');
            setIsResetVerified(false);
          } 
        }
      ]
    );
  };

  const handleAdd = () => {
    if (!title || !amount || !day) {
      Alert.alert('Error', 'Por favor completa todos los campos principales');
      return;
    }
    const dayNum = parseInt(day);
    if (dayNum < 1 || dayNum > 31) {
      Alert.alert('Error', 'El día debe estar entre 1 y 31');
      return;
    }

    store.addRecurring({
      title,
      amount: parseFloat(amount),
      type,
      day: dayNum,
      endMonth: endMonth ? parseInt(endMonth) : undefined,
      endYear: endYear ? parseInt(endYear) : undefined,
    });

    setTitle('');
    setAmount('');
    setDay('');
    setEndMonth('');
    setEndYear('');
    setShowAdd(false);
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      'Eliminar',
      '¿Estás seguro de que quieres eliminar este elemento recurrente?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => store.removeRecurring(id) }
      ]
    );
  };

  const dynamicStyles = {
    container: { backgroundColor: isDark ? '#0F172A' : '#F8FAFC' },
    card: { backgroundColor: isDark ? '#1E293B' : 'white' },
    header: { backgroundColor: isDark ? '#1E293B' : 'white' },
    textMain: { color: isDark ? '#F1F5F9' : '#1E293B' },
    textSub: { color: isDark ? '#94A3B8' : '#64748B' },
    border: { borderColor: isDark ? '#334155' : '#E2E8F0' },
    iconBg: { backgroundColor: isDark ? '#334155' : '#F1F5F9' },
    itemIconBg: { backgroundColor: isDark ? '#334155' : '#EEF2FF' },
    inputBg: { backgroundColor: isDark ? '#0F172A' : '#F8FAFC' },
    resetCard: { borderColor: isDark ? '#7F1D1D' : '#FEE2E2', backgroundColor: isDark ? '#1E293B' : 'white' },
  };

  return (
    <ThemedView style={[styles.container, dynamicStyles.container]}>
      <View style={[styles.header, dynamicStyles.header]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.closeButton, dynamicStyles.iconBg]}>
          <IconSymbol name="chevron.right" size={24} color="#64748B" style={{ transform: [{ rotate: '180deg' }] }} />
        </TouchableOpacity>
        <ThemedText style={[styles.title, dynamicStyles.textMain]}>Configuración</ThemedText>
        <TouchableOpacity onPress={() => setShowAdd(!showAdd)} style={[styles.plusButton, dynamicStyles.itemIconBg]}>
          <IconSymbol name="plus" size={24} color="#6366F1" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Configuración de Día de Reseteo */}
        <View style={[styles.settingsCard, dynamicStyles.card]}>
          <View style={[styles.settingsIcon, dynamicStyles.itemIconBg]}>
             <IconSymbol name="house.fill" size={20} color="#6366F1" />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <ThemedText style={[styles.settingsLabel, dynamicStyles.textMain]}>Día de reseteo del mes</ThemedText>
            <ThemedText style={styles.settingsSub}>Los ciclos se calcularán desde este día</ThemedText>
          </View>
          <TextInput
            style={[styles.payDayInput, { backgroundColor: isDark ? '#334155' : '#F1F5F9', color: '#6366F1' }]}
            keyboardType="numeric"
            value={payDay}
            maxLength={2}
            onChangeText={handleUpdatePayDay}
          />
        </View>

        {/* Configuración de IA */}
        <TouchableOpacity 
          style={[styles.settingsCard, dynamicStyles.card]}
          onPress={() => router.push('/ai-config')}
        >
          <View style={[styles.settingsIcon, { backgroundColor: 'rgba(99, 102, 241, 0.1)' }]}>
             <IconSymbol name="sparkles" size={20} color="#6366F1" />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <ThemedText style={[styles.settingsLabel, dynamicStyles.textMain]}>Configurar Asistente IA</ThemedText>
            <ThemedText style={styles.settingsSub}>API Keys, proveedores y modelos</ThemedText>
          </View>
          <IconSymbol name="chevron.right" size={20} color="#94A3B8" />
        </TouchableOpacity>

        {showAdd && (
          <View style={[styles.addForm, dynamicStyles.card]}>
            <View style={[styles.typeSelector, { backgroundColor: isDark ? '#0F172A' : '#F1F5F9' }]}>
              <TouchableOpacity 
                style={[styles.typeButton, type === 'expense' && styles.expenseActive]} 
                onPress={() => setType('expense')}
              >
                <ThemedText style={[styles.typeText, type === 'expense' && styles.activeHeaderText]}>Gasto</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.typeButton, type === 'income' && styles.incomeActive]} 
                onPress={() => setType('income')}
              >
                <ThemedText style={[styles.typeText, type === 'income' && styles.activeHeaderText]}>Ingreso</ThemedText>
              </TouchableOpacity>
            </View>

            <TextInput
              style={[styles.input, dynamicStyles.inputBg, dynamicStyles.border, dynamicStyles.textMain]}
              placeholder="Descripción (ej. Nómina, Alquiler...)"
              value={title}
              onChangeText={setTitle}
              placeholderTextColor="#94A3B8"
            />
            
            <View style={styles.row}>
              <TextInput
                style={[styles.input, dynamicStyles.inputBg, dynamicStyles.border, dynamicStyles.textMain, { flex: 1, marginRight: 10 }]}
                placeholder="Cantidad (€)"
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
                placeholderTextColor="#94A3B8"
              />
              <TextInput
                style={[styles.input, dynamicStyles.inputBg, dynamicStyles.border, dynamicStyles.textMain, { width: 100 }]}
                placeholder="Día (1-31)"
                keyboardType="numeric"
                value={day}
                onChangeText={setDay}
                placeholderTextColor="#94A3B8"
              />
            </View>

            <View style={[styles.divider, dynamicStyles.border]} />
            <ThemedText style={[styles.subtext, dynamicStyles.textSub]}>¿Tiene fecha de fin? (Opcional)</ThemedText>
            <View style={styles.row}>
              <TextInput
                style={[styles.input, dynamicStyles.inputBg, dynamicStyles.border, dynamicStyles.textMain, { flex: 1, marginRight: 10 }]}
                placeholder="Mes final (1-12)"
                keyboardType="numeric"
                value={endMonth}
                onChangeText={setEndMonth}
                placeholderTextColor="#94A3B8"
              />
              <TextInput
                style={[styles.input, dynamicStyles.inputBg, dynamicStyles.border, dynamicStyles.textMain, { flex: 1 }]}
                placeholder="Año final (ej. 2026)"
                keyboardType="numeric"
                value={endYear}
                onChangeText={setEndYear}
                placeholderTextColor="#94A3B8"
              />
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleAdd}>
              <ThemedText style={styles.saveButtonText}>Añadir Recurrente</ThemedText>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.list}>
          <ThemedText style={styles.listSectionTitle}>MOVIMIENTOS RECURRENTES</ThemedText>
          {items.length === 0 ? (
            <View style={styles.emptyContainer}>
              <ThemedText style={styles.emptyText}>No tienes gastos o ingresos recurrentes</ThemedText>
            </View>
          ) : (
            items.map((item) => (
              <View key={item.id} style={[styles.item, dynamicStyles.card]}>
                <View style={[styles.iconBox, { backgroundColor: item.type === 'income' ? (isDark ? '#064E3B' : '#ECFDF5') : (isDark ? '#450A0A' : '#FEF2F2') }]}>
                  <IconSymbol 
                    name={item.type === 'income' ? 'arrow.up.right' : 'arrow.down.left'} 
                    size={20} 
                    color={item.type === 'income' ? '#10B981' : '#EF4444'} 
                  />
                </View>
                <View style={styles.info}>
                  <ThemedText style={[styles.itemTitle, dynamicStyles.textMain]}>{item.title}</ThemedText>
                  <ThemedText style={styles.itemDay}>Día {item.day} de cada mes</ThemedText>
                  {item.endMonth && item.endYear && (
                    <ThemedText style={[styles.itemRemaining, { backgroundColor: isDark ? '#312E81' : '#EEF2FF', color: isDark ? '#C7D2FE' : '#6366F1' }]}>
                      Quedan por pagar: <ThemedText style={{ fontWeight: '700' }}>{store.getRemainingTotal(item)}€</ThemedText>
                    </ThemedText>
                  )}
                </View>
                <ThemedText style={[styles.itemAmount, { color: item.type === 'income' ? '#10B981' : '#EF4444' }]}>
                  {item.type === 'income' ? '+' : '-'}{item.amount}€
                </ThemedText>
                <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteButton}>
                  <IconSymbol name="plus" size={16} color="#CBD5E1" style={{ transform: [{ rotate: '45deg' }] }} />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        {/* Zona de Reseteo */}
        <View style={styles.resetSection}>
          <ThemedText style={styles.listSectionTitle}>ZONA DE PELIGRO</ThemedText>
          <View style={[styles.resetCard, dynamicStyles.resetCard]}>
             <ThemedText style={styles.resetTitle}>Resetear aplicación</ThemedText>
             <ThemedText style={[styles.resetDesc, dynamicStyles.textSub]}>Borrara todos tus movimientos, recurrentes y configuración.</ThemedText>
             
             <TouchableOpacity 
              style={styles.checkboxRow} 
              onPress={() => setIsResetVerified(!isResetVerified)}
            >
              <View style={[styles.checkbox, isResetVerified && styles.checkboxActive, { borderColor: isDark ? '#334155' : '#E2E8F0' }]}>
                {isResetVerified && <IconSymbol name="checkmark" size={12} color="white" />}
              </View>
              <ThemedText style={[styles.checkboxLabel, { color: isDark ? '#F1F5F9' : '#475569' }]}>Entiendo que la acción es irreversible</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.resetBtn, !isResetVerified && styles.resetBtnDisabled]} 
              onPress={handleResetApp}
            >
              <ThemedText style={styles.resetBtnText}>BORRAR TODO EL CONTENIDO</ThemedText>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 40 }} />
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
  plusButton: {
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
  settingsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  settingsIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  settingsSub: {
    fontSize: 12,
    color: '#94A3B8',
  },
  payDayInput: {
    width: 50,
    height: 40,
    borderRadius: 10,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
  },
  addForm: {
    padding: 20,
    borderRadius: 20,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  typeSelector: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 4,
    marginBottom: 20,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  typeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  activeHeaderText: {
    color: 'white',
  },
  expenseActive: {
    backgroundColor: '#EF4444',
  },
  incomeActive: {
    backgroundColor: '#10B981',
  },
  input: {
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 15,
    borderWidth: 1,
    marginBottom: 15,
  },
  divider: {
    height: 1,
    marginVertical: 15,
  },
  subtext: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  saveButton: {
    backgroundColor: '#6366F1',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '700',
  },
  list: {
    gap: 12,
  },
  listSectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1,
    marginBottom: 10,
    marginLeft: 5,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#94A3B8',
    textAlign: 'center',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 1,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  itemDay: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  itemRemaining: {
    fontSize: 12,
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  itemAmount: {
    fontSize: 15,
    fontWeight: '700',
    marginRight: 10,
  },
  deleteButton: {
    padding: 5,
  },
  resetSection: {
    marginTop: 40,
  },
  resetCard: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
  },
  resetTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#EF4444',
    marginBottom: 4,
  },
  resetDesc: {
    fontSize: 13,
    marginBottom: 20,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  checkboxLabel: {
    fontSize: 13,
  },
  resetBtn: {
    backgroundColor: '#EF4444',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  resetBtnDisabled: {
    backgroundColor: '#FCA5A5',
    opacity: 0.6,
  },
  resetBtnText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '800',
  }
});
