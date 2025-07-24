
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
  getTotalMonthlyIncomeFromSupabase: () => number;
  // Credit card methods
  getTotalCreditLimit: () => number;
  getTotalCreditBalance: () => number;
  getCreditUtilization: () => number;
  // Realtime data
  supabaseExpenses: any[];
  supabaseIncomes: any[];
  loans: Loan[];
  creditCards: any[];
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(financeReducer, initialState);
  const [supabaseExpenses, setSupabaseExpenses] = React.useState<any[]>([]);
  const [supabaseIncomes, setSupabaseIncomes] = React.useState<any[]>([]);
  const [creditCards, setCreditCards] = React.useState<any[]>([]);
  const [loans, setLoans] = React.useState<Loan[]>([]);
  
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

  // Load data from localStorage and set up realtime listeners
  React.useEffect(() => {
    const loadAllData = async () => {
      console.log('Loading all data from localStorage and Supabase...');
      
      // Load loans
      try {
        const savedLoans = localStorage.getItem('loans');
        const loansData = savedLoans ? JSON.parse(savedLoans) : [];
        console.log('Loaded loans:', loansData);
        setLoans(loansData);
      } catch (error) {
        console.error('Error loading loans:', error);
        setLoans([]);
      }

      // Load credit cards from Supabase
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: cardsData, error: cardsError } = await supabase
            .from('credit_cards')
            .select('*')
            .eq('user_id', user.id)
            .eq('is_active', true);

          if (cardsError) {
            console.error('Error loading credit cards:', cardsError);
          } else {
            const formattedCards = cardsData.map(card => ({
              id: card.id,
              name: card.name,
              bank: card.bank,
              currentBalance: Number(card.current_balance),
              creditLimit: Number(card.credit_limit),
              interestRate: Number(card.interest_rate),
              dueDate: card.due_date,
              minimumPayment: Number(card.minimum_payment),
              isActive: card.is_active,
              createdAt: card.created_at,
              updatedAt: card.updated_at
            }));
            console.log('Loaded credit cards from Supabase:', formattedCards);
            setCreditCards(formattedCards);
          }
        }
      } catch (error) {
        console.error('Error loading credit cards:', error);
        setCreditCards([]);
      }

      // Load Supabase data
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          console.log('Loading Supabase data for user:', user.id);
          
          // Load expenses
          const { data: expensesData, error: expensesError } = await supabase
            .from('expenses')
            .select('*')
            .eq('user_id', user.id);

          if (expensesError) {
            console.error('Error loading expenses:', expensesError);
          } else {
            console.log('Loaded expenses from Supabase:', expensesData);
            setSupabaseExpenses(expensesData || []);
          }

          // Load incomes
          const { data: incomesData, error: incomesError } = await supabase
            .from('incomes')
            .select('*')
            .eq('user_id', user.id);

          if (incomesError) {
            console.error('Error loading incomes:', incomesError);
          } else {
            console.log('Loaded incomes from Supabase:', incomesData);
            setSupabaseIncomes(incomesData || []);
          }
        }
      } catch (error) {
        console.error('Error loading Supabase data:', error);
      }
    };

    loadAllData();
  }, []);

  // Set up realtime listeners for Supabase tables
  React.useEffect(() => {
    const channel = supabase
      .channel('finance_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'expenses'
        },
        (payload) => {
          console.log('Expenses realtime update:', payload);
          // Reload expenses data
          supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) {
              supabase
                .from('expenses')
                .select('*')
                .eq('user_id', user.id)
                .then(({ data, error }) => {
                  if (!error) {
                    setSupabaseExpenses(data || []);
                  }
                });
            }
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'incomes'
        },
        (payload) => {
          console.log('Incomes realtime update:', payload);
          // Reload incomes data
          supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) {
              supabase
                .from('incomes')
                .select('*')
                .eq('user_id', user.id)
                .then(({ data, error }) => {
                  if (!error) {
                    setSupabaseIncomes(data || []);
                  }
                });
            }
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'credit_cards'
        },
        (payload) => {
          console.log('Credit cards realtime update:', payload);
          // Reload credit cards data
          supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) {
              supabase
                .from('credit_cards')
                .select('*')
                .eq('user_id', user.id)
                .eq('is_active', true)
                .then(({ data, error }) => {
                  if (!error) {
                    const formattedCards = data.map(card => ({
                      id: card.id,
                      name: card.name,
                      bank: card.bank,
                      currentBalance: Number(card.current_balance),
                      creditLimit: Number(card.credit_limit),
                      interestRate: Number(card.interest_rate),
                      dueDate: card.due_date,
                      minimumPayment: Number(card.minimum_payment),
                      isActive: card.is_active,
                      createdAt: card.created_at,
                      updatedAt: card.updated_at
                    }));
                    setCreditCards(formattedCards);
                  }
                });
            }
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Listen for localStorage changes
  React.useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'loans') {
        try {
          const newLoans = e.newValue ? JSON.parse(e.newValue) : [];
          console.log('Loans updated via storage event:', newLoans);
          setLoans(newLoans);
        } catch (error) {
          console.error('Error parsing loans from storage:', error);
        }
      } else if (e.key === 'credit-cards') {
        try {
          const newCards = e.newValue ? JSON.parse(e.newValue) : [];
          console.log('Credit cards updated via storage event:', newCards);
          setCreditCards(newCards);
        } catch (error) {
          console.error('Error parsing credit cards from storage:', error);
        }
      }
    };

    const handleCustomEvents = (e: CustomEvent) => {
      console.log('Custom event received:', e.type, e.detail);
      if (e.type === 'loansUpdated') {
        try {
          const savedLoans = localStorage.getItem('loans');
          const loansData = savedLoans ? JSON.parse(savedLoans) : [];
          setLoans(loansData);
        } catch (error) {
          console.error('Error loading loans on custom event:', error);
        }
      } else if (e.type === 'creditCardsUpdated') {
        try {
          const savedCards = localStorage.getItem('credit-cards');
          const cardsData = savedCards ? JSON.parse(savedCards) : [];
          setCreditCards(cardsData);
        } catch (error) {
          console.error('Error loading credit cards on custom event:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('loansUpdated', handleCustomEvents as EventListener);
    window.addEventListener('creditCardsUpdated', handleCustomEvents as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('loansUpdated', handleCustomEvents as EventListener);
      window.removeEventListener('creditCardsUpdated', handleCustomEvents as EventListener);
    };
  }, []);

  // Load persisted transactions on mount
  React.useEffect(() => {
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

  // Enhanced methods for dashboard data
  const getTotalDebt = useCallback(() => {
    return loans.reduce((sum: number, loan: Loan) => sum + loan.currentBalance, 0);
  }, [loans]);

  const getTotalMonthlyPayments = useCallback(() => {
    return loans.reduce((sum: number, loan: Loan) => sum + loan.monthlyPayment, 0);
  }, [loans]);

  const getTotalMonthlyExpensesFromSupabase = useCallback(() => {
    return supabaseExpenses
      .filter(expense => expense.is_active)
      .reduce((total, expense) => {
        const multiplier = expense.frequency === 'weekly' ? 4.33 
          : expense.frequency === 'monthly' ? 1 
          : expense.frequency === 'annually' ? 1/12 
          : 1;
        return total + (Number(expense.amount) * multiplier);
      }, 0);
  }, [supabaseExpenses]);

  const getTotalMonthlyIncomeFromSupabase = useCallback(() => {
    return supabaseIncomes
      .filter(income => income.is_active)
      .reduce((total, income) => {
        const multiplier = income.frequency === 'weekly' ? 4.33 
          : income.frequency === 'monthly' ? 1 
          : income.frequency === 'yearly' ? 1/12 
          : income.frequency === 'quarterly' ? 4
          : income.frequency === 'bi-weekly' ? 2.17
          : income.frequency === 'one-time' ? 0
          : 1;
        return total + (Number(income.amount) * multiplier);
      }, 0);
  }, [supabaseIncomes]);

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
    getTotalMonthlyIncomeFromSupabase,
    getTotalCreditLimit,
    getTotalCreditBalance,
    getCreditUtilization,
    supabaseExpenses,
    supabaseIncomes,
    loans,
    creditCards
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
