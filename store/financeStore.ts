import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: 'income' | 'expense';
  date: number; // timestamp
  isRecurring?: boolean;
}

export interface RecurringItem {
  id: string;
  title: string;
  amount: number;
  type: 'income' | 'expense';
  day: number; // 1-31
  endMonth?: number; // 1-12
  endYear?: number;
}

export interface AISettings {
  apiKey: string;
  provider: 'gemini' | 'lmstudio';
  baseUrl: string;
  model: string;
}

export interface ChatMessage {
  role: 'user' | 'model' | 'assistant' | 'system';
  content: string;
}

class FinanceStore {
  private transactions: Transaction[] = [];
  private recurring: RecurringItem[] = [];
  private listeners: (() => void)[] = [];
  private payDay: number = 1;
  private theme: 'light' | 'dark' | 'auto' = 'auto';
  private aiSettings: AISettings = {
    apiKey: '',
    provider: 'gemini',
    baseUrl: 'http://localhost:1234/v1',
    model: 'gemini-2.0-flash',
  };
  private chatHistory: ChatMessage[] = [];

  constructor() {
    this.loadData();
  }

  private async loadData() {
    try {
      const transData = await AsyncStorage.getItem('transactions');
      const recData = await AsyncStorage.getItem('recurring');
      const payDayData = await AsyncStorage.getItem('payDay');
      const themeData = await AsyncStorage.getItem('theme');
      const aiData = await AsyncStorage.getItem('aiSettings');
      const chatData = await AsyncStorage.getItem('chatHistory');
      
      if (transData) this.transactions = JSON.parse(transData);
      if (recData) this.recurring = JSON.parse(recData);
      if (payDayData) this.payDay = parseInt(payDayData);
      if (themeData) this.theme = themeData as 'light' | 'dark' | 'auto';
      if (aiData) this.aiSettings = JSON.parse(aiData);
      if (chatData) this.chatHistory = JSON.parse(chatData);
      this.notify();
    } catch (e) {
      console.error('Error loading data', e);
    }
  }

  private async saveData() {
    try {
      await AsyncStorage.setItem('transactions', JSON.stringify(this.transactions));
      await AsyncStorage.setItem('recurring', JSON.stringify(this.recurring));
      await AsyncStorage.setItem('payDay', this.payDay.toString());
      await AsyncStorage.setItem('theme', this.theme);
      await AsyncStorage.setItem('aiSettings', JSON.stringify(this.aiSettings));
      await AsyncStorage.setItem('chatHistory', JSON.stringify(this.chatHistory));
    } catch (e) {
      console.error('Error saving data', e);
    }
  }

  setTheme(theme: 'light' | 'dark' | 'auto') {
    this.theme = theme;
    this.saveData();
    this.notify();
  }

  getTheme() {
    return this.theme;
  }

  setPayDay(day: number) {
    this.payDay = day;
    this.saveData();
    this.notify();
  }

  getPayDay() {
    return this.payDay;
  }

  async clearAllData() {
    try {
      await AsyncStorage.multiRemove(['transactions', 'recurring', 'payDay', 'aiSettings', 'chatHistory']);
      this.transactions = [];
      this.recurring = [];
      this.payDay = 1;
      this.chatHistory = [];
      this.notify();
    } catch (e) {
      console.error('Error clearing data', e);
    }
  }

  subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => l());
  }

  addTransaction(t: Omit<Transaction, 'id' | 'date'>) {
    const newT = {
      ...t,
      id: Math.random().toString(36).substring(7),
      date: Date.now(),
    };
    this.transactions = [newT, ...this.transactions];
    this.saveData();
    this.notify();
  }

  addRecurring(r: Omit<RecurringItem, 'id'>) {
    const newR = {
      ...r,
      id: Math.random().toString(36).substring(7),
    };
    this.recurring = [...this.recurring, newR];
    this.saveData();
    this.notify();
  }

  removeRecurring(id: string) {
    this.recurring = this.recurring.filter(r => r.id !== id);
    this.saveData();
    this.notify();
  }

  getTransactions() {
    return this.transactions;
  }

  getRecurring() {
    return this.recurring;
  }

  getRemainingTotal(item: RecurringItem) {
    if (!item.endMonth || !item.endYear) return null;
    
    const now = new Date();
    const end = new Date(item.endYear, item.endMonth - 1, item.day);
    
    const months = (end.getFullYear() - now.getFullYear()) * 12 + (end.getMonth() - now.getMonth());
    return Math.max(0, months) * item.amount;
  }

  getCurrentCycleRange() {
    const now = new Date();
    let startDay = this.payDay;
    let start = new Date(now.getFullYear(), now.getMonth(), startDay);
    
    if (now.getDate() < startDay) {
      start = new Date(now.getFullYear(), now.getMonth() - 1, startDay);
    }
    
    const end = new Date(start.getFullYear(), start.getMonth() + 1, startDay - 1);
    return { start, end };
  }

  getCurrentMonthData() {
    return this.getCycleData(0);
  }

  getCycleData(i: number = 0) {
    const now = new Date();
    let startDay = this.payDay;
    
    // Encontrar el inicio del ciclo actual (i=0)
    let currentStart = new Date(now.getFullYear(), now.getMonth(), startDay);
    if (now.getDate() < startDay) {
      currentStart = new Date(now.getFullYear(), now.getMonth() - 1, startDay);
    }

    // Calcular el inicio del ciclo i-ésimo hacia atrás
    let start = new Date(currentStart.getFullYear(), currentStart.getMonth() - i, startDay);
    let end = new Date(start.getFullYear(), start.getMonth() + 1, startDay - 1);
    
    const startTime = start.getTime();
    const endTime = end.getTime();
    
    const manualMovements = this.transactions.filter(t => t.date >= startTime && t.date <= endTime);

    const generatedRecurring = this.recurring.filter(r => {
      let rDate = new Date(start.getFullYear(), start.getMonth(), r.day);
      if (rDate < start) {
        rDate = new Date(start.getFullYear(), start.getMonth() + 1, r.day);
      }
      
      const isPastOrToday = rDate.getTime() <= Date.now();
      const inRange = rDate >= start && rDate <= end;

      if (r.endYear && r.endMonth) {
        const endDate = new Date(r.endYear, r.endMonth - 1, r.day);
        if (rDate > endDate) return false;
      }

      return isPastOrToday && inRange;
    }).map(r => {
      let rDate = new Date(start.getFullYear(), start.getMonth(), r.day);
      if (rDate < start) {
        rDate = new Date(start.getFullYear(), start.getMonth() + 1, r.day);
      }
      return {
        id: `rec-${r.id}`,
        title: r.title,
        amount: r.amount,
        type: r.type,
        date: rDate.getTime(),
        isRecurring: true
      };
    });

    const movements = [...manualMovements, ...generatedRecurring].sort((a, b) => b.date - a.date);

    let incomeTotal = 0;
    let expenseTotal = 0;

    movements.forEach(m => {
      if (m.type === 'income') incomeTotal += m.amount;
      else expenseTotal += m.amount;
    });

    return {
      movements,
      incomeTotal,
      expenseTotal,
      available: incomeTotal - expenseTotal,
      cycleStart: start,
      cycleEnd: end
    };
  }

  getPastMonthsHistory() {
    const history = [];
    const currentMonthData = this.getCurrentMonthData();
    
    for (let i = 1; i <= 6; i++) {
        const data = this.getCycleData(i);
        if (data.incomeTotal > 0 || data.expenseTotal > 0) {
            history.push({
                id: i.toString(),
                month: data.cycleStart.toLocaleString('es-ES', { month: 'short' }),
                year: data.cycleStart.getFullYear(),
                balance: data.available,
                index: i // Para saber qué ciclo cargar luego
            });
        }
    }
    return history;
  }

  // AI Methods
  getAiSettings() {
    return this.aiSettings;
  }

  updateAiSettings(settings: Partial<AISettings>) {
    this.aiSettings = { ...this.aiSettings, ...settings };
    this.saveData();
    this.notify();
  }

  getChatHistory() {
    return this.chatHistory;
  }

  addChatMessage(msg: ChatMessage) {
    this.chatHistory = [...this.chatHistory, msg];
    // Keep last 20 messages to save quota/tokens
    if (this.chatHistory.length > 20) this.chatHistory.shift();
    this.saveData();
    this.notify();
  }

  clearChat() {
    this.chatHistory = [];
    this.saveData();
    this.notify();
  }

  getAIDataContext() {
    const current = this.getCurrentMonthData();
    const history = this.getPastMonthsHistory();
    const recurring = this.getRecurring();

    return `
Eres un asistente financiero personal experto, amable y directo. 
Tu objetivo es ayudar al usuario a entender sus finanzas y ahorrar de forma eficiente.
Habla siempre en español, siendo breve y evitando irte por las ramas. 

PAUTAS DE RESPUESTA:
- Sé amable pero muy conciso. No uses introducciones largas ni despedidas pomposas.
- Ve al grano: si el usuario pregunta algo, respóndelo directamente.
- Explica todo lo necesario sin dejarte detalles, pero usa las palabras justas.
- No des consejos genéricos a menos que se te pida específicamente.

DATOS ACTUALES DEL CICLO:
- Periodo: ${current.cycleStart.toLocaleDateString()} al ${current.cycleEnd.toLocaleDateString()}
- Ingresos totales: ${current.incomeTotal}€
- Gastos totales: ${current.expenseTotal}€
- Balance actual: ${current.available}€

MOVIMIENTOS RECIENTES:
${current.movements.slice(0, 15).map(m => `- ${new Date(m.date).toLocaleDateString()}: ${m.title} (${m.type === 'income' ? '+' : '-'}${m.amount}€)`).join('\n')}

GASTOS/INGRESOS RECURRENTES:
${recurring.map(r => `- ${r.title}: ${r.amount}€ (Día ${r.day})`).join('\n')}

HISTORIAL DE MESES PASADOS:
${history.map(h => `- ${h.month} ${h.year}: ${h.balance}€`).join('\n')}

INSTRUCCIONES:
1. Responde preguntas sobre los datos proporcionados de forma escueta y útil.
2. Si el usuario malgasta, identifícalo basándote en los títulos de sus gastos de forma casual.
3. Da consejos concretos de ahorro basados solo en SUS datos.
4. Si no sabes algo, admítelo brevemente.
`;
  }
}

export const store = new FinanceStore();
