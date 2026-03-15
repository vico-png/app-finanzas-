import { useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, TextInput, View, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { store, AISettings } from '@/store/financeStore';

export default function AIConfigScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const [settings, setSettings] = useState<AISettings>(store.getAiSettings());
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [isFetching, setIsFetching] = useState(false);

  const fetchModels = async () => {
    if (settings.provider === 'gemini' && !settings.apiKey) {
      Alert.alert('Error', 'Introduce una API Key primero');
      return;
    }

    setIsFetching(true);
    try {
      let models: string[] = [];
      if (settings.provider === 'gemini') {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${settings.apiKey}`);
        const data = await response.json();
        if (data.models) {
          models = data.models
            .filter((m: any) => m.supportedGenerationMethods.includes('generateContent'))
            .map((m: any) => m.name.replace('models/', ''));
        }
      } else {
        const response = await fetch(`${settings.baseUrl}/models`);
        const data = await response.json();
        if (data.data) {
          models = data.data.map((m: any) => m.id);
        }
      }
      setAvailableModels(models);
      if (models.length > 0 && !models.includes(settings.model)) {
          // No auto-set to avoid overwriting preferred defaults unless necessary
      }
    } catch (e) {
      Alert.alert('Error', 'No se pudieron recuperar los modelos. Verifica la API Key o conexión.');
    } finally {
      setIsFetching(false);
    }
  };

  const handleSave = () => {
    store.updateAiSettings(settings);
    Alert.alert('Éxito', 'Configuración de IA guardada correctamente');
    router.back();
  };

  const dynamicStyles = {
    container: { backgroundColor: isDark ? '#0F172A' : '#F8FAFC' },
    card: { backgroundColor: isDark ? '#1E293B' : 'white' },
    header: { backgroundColor: isDark ? '#1E293B' : 'white' },
    textMain: { color: isDark ? '#F1F5F9' : '#1E293B' },
    textSub: { color: isDark ? '#94A3B8' : '#64748B' },
    inputBg: { backgroundColor: isDark ? '#0F172A' : '#F1F5F9', color: isDark ? '#F1F5F9' : '#1E293B' },
    border: { borderColor: isDark ? '#334155' : '#E2E8F0' },
    iconBg: { backgroundColor: isDark ? '#334155' : '#EEF2FF' },
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={{ flex: 1 }}
    >
      <ThemedView style={[styles.container, dynamicStyles.container]}>
        <View style={[styles.header, dynamicStyles.header]}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.closeButton, dynamicStyles.iconBg]}>
            <IconSymbol name="plus" size={24} color="#64748B" style={{ transform: [{ rotate: '45deg' }] }} />
          </TouchableOpacity>
          <ThemedText style={[styles.title, dynamicStyles.textMain]}>Configurar IA</ThemedText>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.infoCard, { backgroundColor: '#6366F1' }]}>
            <IconSymbol name="sparkles" size={32} color="white" />
            <ThemedText style={styles.infoTitle}>Conecta tu Cerebro</ThemedText>
            <ThemedText style={styles.infoDesc}>
              Para usar el chat, necesitas una API Key de Google Gemini (gratis en Google AI Studio) o un servidor local como LMStudio.
            </ThemedText>
          </View>

          <View style={[styles.section, dynamicStyles.card]}>
            <ThemedText style={[styles.sectionTitle, dynamicStyles.textMain]}>Proveedor</ThemedText>
            <View style={styles.providerRow}>
              <TouchableOpacity 
                style={[styles.providerBtn, settings.provider === 'gemini' && styles.providerActive]}
                onPress={() => setSettings({...settings, provider: 'gemini', model: 'gemini-1.5-flash'})}
              >
                <ThemedText style={[styles.providerText, settings.provider === 'gemini' && styles.textWhite]}>Google Gemini</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.providerBtn, settings.provider === 'lmstudio' && styles.providerActive]}
                onPress={() => setSettings({...settings, provider: 'lmstudio', model: 'model-identifier'})}
              >
                <ThemedText style={[styles.providerText, settings.provider === 'lmstudio' && styles.textWhite]}>LMStudio / Local</ThemedText>
              </TouchableOpacity>
            </View>

            <ThemedText style={[styles.label, dynamicStyles.textSub]}>API Key (Gemini)</ThemedText>
            <TextInput
              style={[styles.input, dynamicStyles.inputBg]}
              value={settings.apiKey}
              onChangeText={(v) => setSettings({...settings, apiKey: v})}
              placeholder="Introduce tu API Key..."
              placeholderTextColor="#94A3B8"
              secureTextEntry
            />

            {settings.provider === 'lmstudio' && (
              <>
                <ThemedText style={[styles.label, dynamicStyles.textSub]}>Base URL</ThemedText>
                <TextInput
                  style={[styles.input, dynamicStyles.inputBg]}
                  value={settings.baseUrl}
                  onChangeText={(v) => setSettings({...settings, baseUrl: v})}
                  placeholder="http://192.168.1.XX:1234/v1"
                  placeholderTextColor="#94A3B8"
                />
              </>
            )}

            <View style={styles.modelHeader}>
              <ThemedText style={[styles.label, dynamicStyles.textSub]}>Modelo</ThemedText>
              <TouchableOpacity onPress={fetchModels} disabled={isFetching}>
                <ThemedText style={styles.fetchText}>{isFetching ? 'Cargando...' : 'Actualizar lista'}</ThemedText>
              </TouchableOpacity>
            </View>
            
            {availableModels.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.modelSelector}>
                  {availableModels.map((m) => (
                      <TouchableOpacity 
                          key={m} 
                          style={[styles.modelBadge, settings.model === m && styles.modelBadgeActive]}
                          onPress={() => setSettings({...settings, model: m})}
                      >
                          <ThemedText style={[styles.modelBadgeText, settings.model === m && styles.textWhite]}>{m}</ThemedText>
                      </TouchableOpacity>
                  ))}
              </ScrollView>
            ) : (
              <TextInput
                style={[styles.input, dynamicStyles.inputBg]}
                value={settings.model}
                onChangeText={(v) => setSettings({...settings, model: v})}
                placeholder="ej: gemini-2.0-flash"
                placeholderTextColor="#94A3B8"
              />
            )}

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <ThemedText style={styles.saveBtnText}>Guardar Configuración</ThemedText>
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={styles.helpLink} 
            onPress={() => Alert.alert('Ayuda', 'Puedes conseguir una API Key gratuita en aistudio.google.com')}
          >
            <ThemedText style={styles.helpText}>¿Cómo consigo una API Key?</ThemedText>
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
    fontSize: 20,
    fontWeight: '800',
  },
  scrollContent: {
    padding: 20,
  },
  infoCard: {
    padding: 25,
    borderRadius: 25,
    marginBottom: 25,
    alignItems: 'center',
  },
  infoTitle: {
    color: 'white',
    fontSize: 22,
    fontWeight: '800',
    marginTop: 15,
    marginBottom: 8,
  },
  infoDesc: {
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
  },
  section: {
    padding: 20,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 20,
  },
  providerRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  providerBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  providerActive: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  providerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  textWhite: {
    color: 'white',
  },
  label: {
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 8,
    marginTop: 15,
  },
  input: {
    borderRadius: 12,
    padding: 15,
    fontSize: 14,
  },
  saveBtn: {
    backgroundColor: '#6366F1',
    paddingVertical: 16,
    borderRadius: 15,
    alignItems: 'center',
    marginTop: 30,
  },
  saveBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '800',
  },
  helpLink: {
    marginTop: 20,
    alignItems: 'center',
  },
  helpText: {
    color: '#6366F1',
    fontWeight: '700',
    fontSize: 14,
  },
  modelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: 15,
  },
  fetchText: {
    fontSize: 12,
    color: '#6366F1',
    fontWeight: '700',
  },
  modelSelector: {
    marginVertical: 10,
  },
  modelBadge: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modelBadgeActive: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  modelBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
});
