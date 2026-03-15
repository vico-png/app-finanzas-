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

class FinanceStore {
  private transactions: Transaction[] = [];
  private recurring: RecurringItem[] = [];
  private listeners: (() => void)[] = [];
  private payDay: number = 1;
  private theme: 'light' | 'dark' | 'auto' = 'auto';

  constructor() {
    this.loadData();
  }

  private async loadData() {
    try {
      const transData = await AsyncStorage.getItem('transactions');
      const recData = await AsyncStorage.getItem('recurring');
      const payDayData = await AsyncStorage.getItem('payDay');
      const themeData = await AsyncStorage.getItem('theme');
      if (transData) this.transactions = JSON.parse(transData);
      if (recData) this.recurring = JSON.parse(recData);
      if (payDayData) this.payDay = parseInt(payDayData);
      if (themeData) this.theme = themeData as 'light' | 'dark' | 'auto';
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
      await AsyncStorage.multiRemove(['transactions', 'recurring', 'payDay']);
      this.transactions = [];
      this.recurring = [];
      this.payDay = 1;
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
}

export const store = new FinanceStore();
