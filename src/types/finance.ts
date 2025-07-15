// Core financial data types for the personal finance dashboard

export type IncomeFrequency = 'weekly' | 'bi-weekly' | 'monthly' | 'quarterly' | 'yearly' | 'one-time';

export interface Income {
  id: string;
  source: string;
  amount: number;
  frequency: IncomeFrequency;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  name: string;
  email: string;
  monthlyIncome: number;
  currency: 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD';
  createdAt: Date;
  updatedAt: Date;
}

export interface Expense {
  id: string;
  name: string;
  amount: number;
  category: ExpenseCategory;
  type: ExpenseType;
  frequency: ExpenseFrequency;
  description?: string;
  isRecurring: boolean;
  dueDate?: Date;
  nextDueDate?: Date;
  tags: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreditCard {
  id: string;
  name: string;
  bank: string;
  currentBalance: number;
  creditLimit: number;
  interestRate: number; // APR as percentage
  minimumPayment: number;
  dueDate: Date;
  nextDueDate: Date;
  lastPaymentAmount?: number;
  lastPaymentDate?: Date;
  cardType: 'visa' | 'mastercard' | 'amex' | 'discover' | 'other';
  isActive: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Loan {
  id: string;
  name: string;
  lender: string;
  loanType: LoanType;
  originalAmount: number;
  currentBalance: number;
  interestRate: number; // APR as percentage
  monthlyPayment: number;
  term: number; // in months
  remainingTerm: number; // in months
  dueDate: Date;
  nextDueDate: Date;
  lastPaymentAmount?: number;
  lastPaymentDate?: Date;
  isActive: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Budget {
  id: string;
  name: string;
  category: ExpenseCategory;
  monthlyLimit: number;
  currentSpent: number;
  alertThreshold: number; // percentage (e.g., 80 = alert at 80%)
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface FinancialGoal {
  id: string;
  name: string;
  type: GoalType;
  targetAmount: number;
  currentAmount: number;
  targetDate: Date;
  monthlyContribution: number;
  priority: 'low' | 'medium' | 'high';
  description?: string;
  isCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Transaction {
  id: string;
  amount: number;
  description: string;
  category: ExpenseCategory;
  type: 'income' | 'expense' | 'transfer';
  accountId?: string; // credit card or loan ID
  date: Date;
  tags: string[];
  isRecurring: boolean;
  recurringExpenseId?: string;
  createdAt: Date;
}

// Enums and Types
export type ExpenseCategory = 
  | 'housing'
  | 'transportation'
  | 'food'
  | 'utilities'
  | 'healthcare'
  | 'entertainment'
  | 'shopping'
  | 'education'
  | 'insurance'
  | 'savings'
  | 'debt'
  | 'other';

export type ExpenseType = 'need' | 'want';

export type ExpenseFrequency = 
  | 'daily'
  | 'weekly'
  | 'bi-weekly'
  | 'monthly'
  | 'quarterly'
  | 'semi-annually'
  | 'annually'
  | 'one-time';

export type LoanType = 
  | 'mortgage'
  | 'auto'
  | 'personal'
  | 'student'
  | 'home-equity'
  | 'business'
  | 'other';

export type GoalType = 
  | 'emergency-fund'
  | 'debt-payoff'
  | 'home-purchase'
  | 'vacation'
  | 'retirement'
  | 'education'
  | 'investment'
  | 'other';

// Dashboard and Analysis Types
export interface FinancialSummary {
  totalMonthlyIncome: number;
  totalMonthlyExpenses: number;
  totalCreditCardDebt: number;
  totalLoanDebt: number;
  totalDebt: number;
  monthlyDebtPayments: number;
  availableCreditLimit: number;
  netWorth: number;
  monthlySavings: number;
  savingsRate: number; // percentage
  debtToIncomeRatio: number; // percentage
  creditUtilization: number; // percentage
  lastUpdated: Date;
}

export interface ExpenseBreakdown {
  category: ExpenseCategory;
  amount: number;
  percentage: number;
  type: ExpenseType;
}

export interface DebtPayoffStrategy {
  strategy: 'avalanche' | 'snowball';
  totalPayoffTime: number; // in months
  totalInterest: number;
  monthlyPayment: number;
  payoffOrder: DebtPayoffItem[];
}

export interface DebtPayoffItem {
  id: string;
  name: string;
  type: 'credit-card' | 'loan';
  balance: number;
  minimumPayment: number;
  interestRate: number;
  order: number;
  estimatedPayoffMonths: number;
}

// Local Storage Keys
export const STORAGE_KEYS = {
  USER: 'finance_user',
  EXPENSES: 'finance_expenses',
  CREDIT_CARDS: 'finance_credit_cards',
  LOANS: 'finance_loans',
  BUDGETS: 'finance_budgets',
  GOALS: 'finance_goals',
  TRANSACTIONS: 'finance_transactions',
} as const;

// Category Icons and Colors
export const CATEGORY_CONFIG: Record<ExpenseCategory, { icon: string; color: string; label: string }> = {
  housing: { icon: 'Home', color: 'hsl(var(--primary))', label: 'Housing' },
  transportation: { icon: 'Car', color: 'hsl(220 70% 50%)', label: 'Transportation' },
  food: { icon: 'UtensilsCrossed', color: 'hsl(40 90% 50%)', label: 'Food' },
  utilities: { icon: 'Zap', color: 'hsl(60 90% 50%)', label: 'Utilities' },
  healthcare: { icon: 'Heart', color: 'hsl(0 70% 50%)', label: 'Healthcare' },
  entertainment: { icon: 'Gamepad2', color: 'hsl(280 70% 50%)', label: 'Entertainment' },
  shopping: { icon: 'ShoppingBag', color: 'hsl(320 70% 50%)', label: 'Shopping' },
  education: { icon: 'GraduationCap', color: 'hsl(200 70% 50%)', label: 'Education' },
  insurance: { icon: 'Shield', color: 'hsl(180 70% 50%)', label: 'Insurance' },
  savings: { icon: 'PiggyBank', color: 'hsl(120 70% 50%)', label: 'Savings' },
  debt: { icon: 'CreditCard', color: 'hsl(10 70% 50%)', label: 'Debt' },
  other: { icon: 'MoreHorizontal', color: 'hsl(var(--muted-foreground))', label: 'Other' },
};