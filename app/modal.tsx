import { useState } from 'react';
import { StyleSheet, TouchableOpacity, TextInput, View, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { store } from '@/store/financeStore';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function ModalScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  const handleSave = () => {
    if (!amount || !description) return;
    store.addTransaction({
      type,
      amount: parseFloat(amount),
      title: description,
    });
    router.back();
  };

  const dynamicStyles = {
    container: { backgroundColor: isDark ? '#0F172A' : '#F8FAFC' },
    card: { backgroundColor: isDark ? '#1E293B' : 'white' },
    inputBg: { backgroundColor: isDark ? '#1E293B' : 'white' },
    textMain: { color: isDark ? '#F1F5F9' : '#1E293B' },
    border: { borderColor: isDark ? '#334155' : '#E2E8F0' },
    headerIconBg: { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' },
    selectorBg: { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' },
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={[styles.container, dynamicStyles.container]}
    >
      <ThemedView style={[styles.content, dynamicStyles.container]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.closeButton, dynamicStyles.headerIconBg]}>
            <IconSymbol name="chevron.right" size={24} color="#64748B" style={{ transform: [{ rotate: '180deg' }] }} />
          </TouchableOpacity>
          <ThemedText style={[styles.title, dynamicStyles.textMain]}>Añadir Movimiento</ThemedText>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Selector de Tipo */}
          <View style={[styles.typeSelector, dynamicStyles.selectorBg]}>
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

          {/* Campo de Cantidad */}
          <View style={styles.inputSection}>
            <ThemedText style={styles.label}>Cantidad (€)</ThemedText>
            <View style={[styles.amountInputContainer, dynamicStyles.inputBg, dynamicStyles.border]}>
              <TextInput
                style={[styles.amountInput, dynamicStyles.textMain]}
                placeholder="0.00"
                keyboardType="numeric"
                autoFocus
                value={amount}
                onChangeText={setAmount}
                placeholderTextColor="#94A3B8"
              />
              <ThemedText style={styles.currencySymbol}>€</ThemedText>
            </View>
          </View>

          {/* Campo de Descripción */}
          <View style={styles.inputSection}>
            <ThemedText style={styles.label}>Descripción</ThemedText>
            <TextInput
              style={[styles.descriptionInput, dynamicStyles.inputBg, dynamicStyles.border, dynamicStyles.textMain]}
              placeholder={type === 'expense' ? "¿En qué lo has gastado?" : "¿De dónde viene este ingreso?"}
              value={description}
              onChangeText={setDescription}
              placeholderTextColor="#94A3B8"
            />
          </View>

          <TouchableOpacity 
            style={[styles.saveButton, { backgroundColor: type === 'expense' ? '#EF4444' : '#10B981' }]} 
            onPress={handleSave}
          >
            <ThemedText style={styles.saveButtonText}>Guardar</ThemedText>
          </TouchableOpacity>
        </ScrollView>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
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
  typeSelector: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 4,
    marginBottom: 30,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
  },
  typeText: {
    fontSize: 15,
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
  inputSection: {
    marginBottom: 25,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 10,
    marginLeft: 4,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 20,
    borderWidth: 1,
  },
  amountInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: '700',
    paddingVertical: 20,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: '600',
    color: '#94A3B8',
  },
  descriptionInput: {
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 18,
    fontSize: 16,
    borderWidth: 1,
  },
  saveButton: {
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
});
