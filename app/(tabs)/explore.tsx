import { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { store, ChatMessage } from '@/store/financeStore';

export default function ChatScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const scrollViewRef = useRef<ScrollView>(null);
  
  const [messages, setMessages] = useState<ChatMessage[]>(store.getChatHistory());
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState(store.getAiSettings());

  useEffect(() => {
    const unsub = store.subscribe(() => {
      setMessages(store.getChatHistory());
      setSettings(store.getAiSettings());
    });
    return unsub;
  }, []);

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    if (!settings.apiKey && settings.provider === 'gemini') {
      Alert.alert('Configuración necesaria', 'Por favor, configura tu API Key primero.', [
        { text: 'Ir a Ajustes', onPress: () => router.push('/ai-config') },
        { text: 'Cancelar', style: 'cancel' }
      ]);
      return;
    }

    const userMsg: ChatMessage = { role: 'user', content: input };
    store.addChatMessage(userMsg);
    setInput('');
    setIsLoading(true);
    scrollToBottom();

    try {
      let responseText = '';
      const context = store.getAIDataContext();
      
      if (settings.provider === 'gemini') {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${settings.model}:generateContent?key=${settings.apiKey}`;
          
          const history = store.getChatHistory().map(m => ({
            role: m.role === 'assistant' || m.role === 'model' ? 'model' : 'user',
            parts: [{ text: m.content }]
          }));

          // Add system context to the first prompt or as a separate part
          const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                { role: 'user', parts: [{ text: `CONTEXTO DEL SISTEMA (Usa esto para responder pero no lo menciones a menos que sea necesario):\n${context}` }] },
                ...history
              ]
            })
          });

          const data = await response.json();
          if (data.error) throw new Error(data.error.message);
          responseText = data.candidates[0].content.parts[0].text;

      } else {
          // LMStudio / Local (OpenAI Compatible)
          const response = await fetch(`${settings.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: settings.model,
              messages: [
                { role: 'system', content: context },
                ...store.getChatHistory().map(m => ({
                    role: m.role,
                    content: m.content
                }))
              ],
              temperature: 0.7
            })
          });
          const data = await response.json();
          responseText = data.choices[0].message.content;
      }

      store.addChatMessage({ role: 'assistant', content: responseText });
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Error al conectar con la IA');
      console.error(e);
    } finally {
      setIsLoading(false);
      scrollToBottom();
    }
  };

  const dynamicStyles = {
    container: { backgroundColor: isDark ? '#0F172A' : '#F8FAFC' },
    header: { backgroundColor: isDark ? '#1E293B' : 'white', borderBottomColor: isDark ? '#334155' : '#E2E8F0' },
    inputContainer: { backgroundColor: isDark ? '#1E293B' : 'white', borderTopColor: isDark ? '#334155' : '#E2E8F0' },
    input: { backgroundColor: isDark ? '#0F172A' : '#F1F5F9', color: isDark ? '#F1F5F9' : '#1E293B' },
    userBubble: { backgroundColor: '#6366F1' },
    aiBubble: { backgroundColor: isDark ? '#334155' : '#EEF2FF' },
    textMain: { color: isDark ? '#F1F5F9' : '#1E293B' },
    textAI: { color: isDark ? '#E2E8F0' : '#1E293B' },
  };

  if (!settings.apiKey && settings.provider === 'gemini' && messages.length === 0) {
      return (
        <ThemedView style={[styles.emptyContainer, dynamicStyles.container]}>
            <View style={styles.emptyIcon}>
                <IconSymbol name="sparkles" size={60} color="#6366F1" />
            </View>
            <ThemedText style={[styles.emptyTitle, dynamicStyles.textMain]}>Asistente IA</ThemedText>
            <ThemedText style={styles.emptySubtitle}>
                Analiza tus gastos, pide consejos de ahorro y entiende tus finanzas mejor que nunca.
            </ThemedText>
            <TouchableOpacity style={styles.setupBtn} onPress={() => router.push('/ai-config')}>
                <ThemedText style={styles.setupBtnText}>Configurar API Key</ThemedText>
            </TouchableOpacity>
        </ThemedView>
      );
  }

  return (
    <ThemedView style={[styles.container, dynamicStyles.container]}>
      {/* Header */}
      <View style={[styles.header, dynamicStyles.header]}>
        <ThemedText style={[styles.headerTitle, dynamicStyles.textMain]}>Asistente Financiero</ThemedText>
        <View style={styles.headerActions}>
            <TouchableOpacity onPress={() => store.clearChat()} style={styles.headerIcon}>
                <IconSymbol name="trash.fill" size={20} color="#94A3B8" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/ai-config')} style={styles.headerIcon}>
                <IconSymbol name="gearshape.fill" size={20} color="#94A3B8" />
            </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      >
        <ScrollView 
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={scrollToBottom}
          keyboardShouldPersistTaps="handled"
        >
          {messages.length === 0 && (
              <View style={styles.welcomeContainer}>
                  <ThemedText style={styles.welcomeText}>
                      ¡Hola! Soy tu asistente. Puedo ver que este mes has gastado {store.getCurrentMonthData().expenseTotal}€. ¿En qué puedo ayudarte hoy?
                  </ThemedText>
              </View>
          )}

          {messages.map((msg, i) => (
            <View key={i} style={[styles.messageWrapper, msg.role === 'user' ? styles.userWrapper : styles.aiWrapper]}>
              <View style={[styles.bubble, msg.role === 'user' ? dynamicStyles.userBubble : dynamicStyles.aiBubble]}>
                <ThemedText style={[styles.messageText, msg.role === 'user' ? { color: 'white' } : dynamicStyles.textAI]}>
                  {msg.content}
                </ThemedText>
              </View>
            </View>
          ))}

          {isLoading && (
            <View style={styles.aiWrapper}>
              <View style={[styles.bubble, dynamicStyles.aiBubble, styles.loadingBubble]}>
                <ActivityIndicator color="#6366F1" size="small" />
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input */}
        <View style={[styles.inputContainer, dynamicStyles.inputContainer]}>
          <TextInput
            style={[styles.input, dynamicStyles.input]}
            value={input}
            onChangeText={setInput}
            placeholder="Pregúntame algo..."
            placeholderTextColor="#94A3B8"
            multiline
          />
          <TouchableOpacity 
            style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]} 
            onPress={handleSend}
            disabled={!input.trim() || isLoading}
          >
            <IconSymbol name="paperplane.fill" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
      <View style={{ height: 80 }} /> {/* Espacio para la barra de navegación */}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 15,
  },
  headerIcon: {
    padding: 5,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 20,
  },
  messageWrapper: {
    marginBottom: 15,
    maxWidth: '85%',
  },
  userWrapper: {
    alignSelf: 'flex-end',
  },
  aiWrapper: {
    alignSelf: 'flex-start',
  },
  bubble: {
    padding: 15,
    borderRadius: 20,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  welcomeContainer: {
    padding: 20,
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.1)',
  },
  welcomeText: {
    textAlign: 'center',
    color: '#6366F1',
    fontWeight: '600',
    fontSize: 14,
    lineHeight: 20,
  },
  loadingBubble: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 15,
    alignItems: 'flex-end',
    borderTopWidth: 1,
    paddingBottom: Platform.OS === 'ios' ? 20 : 15,
  },
  input: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    maxHeight: 100,
    fontSize: 15,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  sendBtnDisabled: {
    backgroundColor: '#CBD5E1',
  },
  emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
  },
  emptyIcon: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: 'rgba(99, 102, 241, 0.1)',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 20,
  },
  emptyTitle: {
      fontSize: 24,
      fontWeight: '800',
      marginBottom: 10,
  },
  emptySubtitle: {
      textAlign: 'center',
      color: '#94A3B8',
      lineHeight: 22,
      marginBottom: 30,
  },
  setupBtn: {
      backgroundColor: '#6366F1',
      paddingHorizontal: 30,
      paddingVertical: 15,
      borderRadius: 20,
  },
  setupBtnText: {
      color: 'white',
      fontWeight: '800',
  }
});
