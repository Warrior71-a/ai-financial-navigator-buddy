import React, { createContext, useContext, useReducer, useCallback, useMemo } from 'react';
import { useLocalStorageWithErrorRecovery } from '@/hooks/useLocalStorage';
import { supabase } from '@/integrations/supabase/client';
import { Loan } from '@/types/finance';

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  date: string;
  createdAt: string;
}

export interface FilterState {
  dateRange: { start: string; end: string } | null;
  categories: string[];
  searchTerm: string;
  type: 'all' | 'income' | 'expense';
}

interface FinanceState {
  transactions: Transaction[];
  filters: FilterState;
}

type FinanceAction =
  | { type: 'ADD_TRANSACTION'; payload: Transaction }
  | { type: 'UPDATE_TRANSACTION'; payload: Transaction }
  | { type: 'DELETE_TRANSACTION'; payload: string }
  | { type: 'SET_FILTERS'; payload: Partial<FilterState> }
  | { type: 'RESET_FILTERS' }
  | { type: 'LOAD_TRANSACTIONS'; payload: Transaction[] };

const initialState: FinanceState = {
  transactions: [],
  filters: {
    dateRange: null,
    categories: [],
    searchTerm: '',
    type: 'all'
  }
};

const financeReducer = (state: FinanceState, action: FinanceAction): FinanceState => {
  switch (action.type) {
    case 'ADD_TRANSACTION':
      return {
        ...state,
        transactions: [...state.transactions, action.payload]
      };
    case 'UPDATE_TRANSACTION':
      return {
        ...state,
        transactions: state.transactions.map(t => 
          t.id === action.payload.id ? action.payload : t
        )
      };
    case 'DELETE_TRANSACTION':
      return {
        ...state,
        transactions: state.transactions.filter(t => t.id !== action.payload)
      };
    case 'SET_FILTERS':
      return {
        ...state,
        filters: { ...state.filters, ...action.payload }
      };
    case 'RESET_FILTERS':
      return {
        ...state,
        filters: initialState.filters
      };
    case 'LOAD_TRANSACTIONS':
      return {
        ...state,
        transactions: action.payload
      };
    default:
      return state;
  }
};

interface FinanceContextType {
  state: FinanceState;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => void;
  updateTransaction: (transaction: Transaction) => void;
  deleteTransaction: (id: string) => void;
  setFilters: (filters: Partial<FilterState>) => void;
  resetFilters: () => void;
  getFilteredTransactions: () => Transaction[];
  getTotalIncome: (filtered?: boolean) => number;
  getTotalExpenses: (filtered?: boolean) => number;
  getNetCashFlow: (filtered?: boolean) => number;
  getTransactionsByDate: (date: string) => Transaction[];
  getCategories: () => string[];
  // Enhanced methods for dashboard
  getTotalDebt: () => number;
  getTotalMonthlyPayments: () => number;
  getTotalMonthlyExpensesFromSupabase: () => number;
  // Credit card methods
  getTotalCreditLimit: () => number;
  getTotalCreditBalance: () => number;
  getCreditUtilization: () => number;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(financeReducer, initialState);
  const [supabaseExpenses, setSupabaseExpenses] = React.useState<any[]>([]);
  const [creditCards, setCreditCards] = React.useState<any[]>([]);
  
  const { value: persistedTransactions, setValue: setPersistedTransactions } = 
    useLocalStorageWithErrorRecovery<Transaction[]>('finance-transactions', [], {
      validateData: (data): data is Transaction[] => 
        Array.isArray(data) && data.every(item => 
          typeof item === 'object' && 
          typeof item.id === 'string' &&
          typeof item.type === 'string' &&
          typeof item.amount === 'number' &&
          typeof item.category === 'string' &&
          typeof item.description === 'string' &&
          typeof item.date === 'string'
        )
    });

  // Get loans from localStorage with listener for changes
  const [loans, setLoans] = React.useState<Loan[]>([]);
  
  React.useEffect(() => {
    const loadLoans = () => {
      try {
        const saved = localStorage.getItem('loans');
        setLoans(saved ? JSON.parse(saved) : []);
      } catch {
        setLoans([]);
      }
    };

    // Load initial loans
    loadLoans();
    
    // Listen for storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'loans') {
        loadLoans();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom events (for same-tab updates)
    const handleLoansUpdate = () => loadLoans();
    window.addEventListener('loansUpdated', handleLoansUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('loansUpdated', handleLoansUpdate);
    };
  }, []);

  // Load credit cards from localStorage with listener for changes
  React.useEffect(() => {
    const loadCreditCards = () => {
      try {
        const saved = localStorage.getItem('credit-cards');
        setCreditCards(saved ? JSON.parse(saved) : []);
      } catch {
        setCreditCards([]);
      }
    };

    // Load initial credit cards
    loadCreditCards();
    
    // Listen for storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'credit-cards') {
        loadCreditCards();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom events (for same-tab updates)
    const handleCreditCardsUpdate = () => loadCreditCards();
    window.addEventListener('creditCardsUpdated', handleCreditCardsUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('creditCardsUpdated', handleCreditCardsUpdate);
    };
  }, []);

  // Load Supabase expenses
  React.useEffect(() => {
    const loadSupabaseExpenses = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('expenses')
          .select('*')
          .eq('user_id', user.id);

        if (error) throw error;
        console.log('🔄 Loaded Supabase expenses:', data);
        setSupabaseExpenses(data || []);
      } catch (error) {
        console.error('Error loading Supabase expenses:', error);
      }
    };

    // Load initial expenses
    loadSupabaseExpenses();
    
    // Listen for expense updates
    const handleExpensesUpdate = () => loadSupabaseExpenses();
    window.addEventListener('expensesUpdated', handleExpensesUpdate);

    return () => {
      window.removeEventListener('expensesUpdated', handleExpensesUpdate);
    };
  }, []);

  // Load persisted transactions on mount
  React.useEffect(() => {
    console.log('📝 Loading persisted transactions:', persistedTransactions);
    if (persistedTransactions.length > 0) {
      dispatch({ type: 'LOAD_TRANSACTIONS', payload: persistedTransactions });
    }
  }, [persistedTransactions]);

  // Persist transactions when state changes
  React.useEffect(() => {
    setPersistedTransactions(state.transactions);
  }, [state.transactions, setPersistedTransactions]);

  const addTransaction = useCallback((transaction: Omit<Transaction, 'id' | 'createdAt'>) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString()
    };
    dispatch({ type: 'ADD_TRANSACTION', payload: newTransaction });
  }, []);

  const updateTransaction = useCallback((transaction: Transaction) => {
    dispatch({ type: 'UPDATE_TRANSACTION', payload: transaction });
  }, []);

  const deleteTransaction = useCallback((id: string) => {
    dispatch({ type: 'DELETE_TRANSACTION', payload: id });
  }, []);

  const setFilters = useCallback((filters: Partial<FilterState>) => {
    dispatch({ type: 'SET_FILTERS', payload: filters });
  }, []);

  const resetFilters = useCallback(() => {
    dispatch({ type: 'RESET_FILTERS' });
  }, []);

  const getFilteredTransactions = useCallback(() => {
    let filtered = state.transactions;

    // Filter by type
    if (state.filters.type !== 'all') {
      filtered = filtered.filter(t => t.type === state.filters.type);
    }

    // Filter by date range
    if (state.filters.dateRange) {
      filtered = filtered.filter(t => 
        t.date >= state.filters.dateRange!.start && 
        t.date <= state.filters.dateRange!.end
      );
    }

    // Filter by categories
    if (state.filters.categories.length > 0) {
      filtered = filtered.filter(t => 
        state.filters.categories.includes(t.category)
      );
    }

    // Filter by search term
    if (state.filters.searchTerm) {
      const term = state.filters.searchTerm.toLowerCase();
      filtered = filtered.filter(t => 
        t.description.toLowerCase().includes(term) ||
        t.category.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [state.transactions, state.filters]);

  const getTotalIncome = useCallback((filtered = false) => {
    const transactions = filtered ? getFilteredTransactions() : state.transactions;
    return transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [state.transactions, getFilteredTransactions]);

  const getTotalExpenses = useCallback((filtered = false) => {
    const transactions = filtered ? getFilteredTransactions() : state.transactions;
    return transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [state.transactions, getFilteredTransactions]);

  const getNetCashFlow = useCallback((filtered = false) => {
    return getTotalIncome(filtered) - getTotalExpenses(filtered);
  }, [getTotalIncome, getTotalExpenses]);

  const getTransactionsByDate = useCallback((date: string) => {
    return state.transactions.filter(t => t.date === date);
  }, [state.transactions]);

  const getCategories = useCallback(() => {
    const categories = Array.from(new Set(state.transactions.map(t => t.category)));
    return categories.sort();
  }, [state.transactions]);

  // New methods for enhanced dashboard data
  const getTotalDebt = useCallback(() => {
    return loans.reduce((sum: number, loan: Loan) => sum + loan.currentBalance, 0);
  }, [loans]);

  const getTotalMonthlyPayments = useCallback(() => {
    return loans.reduce((sum: number, loan: Loan) => sum + loan.monthlyPayment, 0);
  }, [loans]);

  const getTotalMonthlyExpensesFromSupabase = useCallback(() => {
    console.log('📊 Calculating monthly expenses from Supabase data:', supabaseExpenses);
    const total = supabaseExpenses
      .filter(expense => expense.is_active)
      .reduce((total, expense) => {
        const multiplier = expense.frequency === 'weekly' ? 4.33 
          : expense.frequency === 'monthly' ? 1 
          : expense.frequency === 'annually' ? 1/12 
          : 1;
        const amount = Number(expense.amount);
        const monthlyAmount = amount * multiplier;
        console.log(`  ${expense.name}: $${amount} (${expense.frequency}) → $${monthlyAmount.toFixed(2)} monthly`);
        return total + monthlyAmount;
      }, 0);
    console.log('💰 Total monthly expenses:', total);
    return total;
  }, [supabaseExpenses]);

  // Credit card methods
  const getTotalCreditLimit = useCallback(() => {
    return creditCards.reduce((sum, card) => sum + (card.creditLimit || 0), 0);
  }, [creditCards]);

  const getTotalCreditBalance = useCallback(() => {
    return creditCards.reduce((sum, card) => sum + (card.currentBalance || 0), 0);
  }, [creditCards]);

  const getCreditUtilization = useCallback(() => {
    const totalLimit = getTotalCreditLimit();
    const totalBalance = getTotalCreditBalance();
    return totalLimit > 0 ? (totalBalance / totalLimit) * 100 : 0;
  }, [getTotalCreditLimit, getTotalCreditBalance]);

  const contextValue: FinanceContextType = {
    state,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    setFilters,
    resetFilters,
    getFilteredTransactions,
    getTotalIncome,
    getTotalExpenses,
    getNetCashFlow,
    getTransactionsByDate,
    getCategories,
    getTotalDebt,
    getTotalMonthlyPayments,
    getTotalMonthlyExpensesFromSupabase,
    getTotalCreditLimit,
    getTotalCreditBalance,
    getCreditUtilization
  };

  return (
    <FinanceContext.Provider value={contextValue}>
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (context === undefined) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};