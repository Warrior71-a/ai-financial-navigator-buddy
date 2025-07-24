import { z } from 'zod';
import type { ExpenseCategory, ExpenseFrequency, ExpenseType, IncomeFrequency, LoanType, GoalType } from '@/types/finance';
import { passwordSchema, emailSchema, sanitizeFinancialData } from '@/lib/security';

// Authentication Validation Schemas
export { passwordSchema, emailSchema } from '@/lib/security';

// Expense Validation Schema  
export const expenseSchema = z.object({
  name: z.string()
    .min(1, 'Expense name is required')
    .max(100, 'Expense name must be less than 100 characters')
    .transform(sanitizeFinancialData.description),
  amount: z.number()
    .min(0.01, 'Amount must be greater than 0')
    .max(1000000, 'Amount must be less than $1,000,000')
    .transform(sanitizeFinancialData.amount),
  category: z.string()
    .min(1, 'Category is required'),
  type: z.enum(['need', 'want'] as const, {
    errorMap: () => ({ message: 'Please select expense type' })
  }),
  frequency: z.string()
    .min(1, 'Frequency is required'),
  nextDueDate: z.date({
    required_error: 'Due date is required',
    invalid_type_error: 'Please enter a valid date'
  }),
  isRecurring: z.boolean(),
  tags: z.string().optional().transform((val) => val ? sanitizeFinancialData.description(val) : val)
});

// Income Validation Schema
export const incomeSchema = z.object({
  source: z.string()
    .min(1, 'Income source is required')
    .max(100, 'Income source must be less than 100 characters'),
  amount: z.number()
    .min(0.01, 'Amount must be greater than 0')
    .max(10000000, 'Amount must be less than $10,000,000'),
  frequency: z.string()
    .min(1, 'Frequency is required'),
  isActive: z.boolean()
});

// Credit Card Validation Schema
export const creditCardSchema = z.object({
  name: z.string()
    .min(1, 'Card name is required')
    .max(50, 'Card name must be less than 50 characters'),
  bank: z.string()
    .min(1, 'Bank name is required')
    .max(50, 'Bank name must be less than 50 characters'),
  currentBalance: z.number()
    .min(0, 'Balance cannot be negative')
    .max(1000000, 'Balance must be less than $1,000,000'),
  creditLimit: z.number()
    .min(1, 'Credit limit must be greater than 0')
    .max(1000000, 'Credit limit must be less than $1,000,000'),
  interestRate: z.number()
    .min(0, 'Interest rate cannot be negative')
    .max(100, 'Interest rate cannot exceed 100%'),
  minimumPayment: z.number()
    .min(0, 'Minimum payment cannot be negative'),
  dueDate: z.date({
    required_error: 'Due date is required',
    invalid_type_error: 'Please enter a valid date'
  }),
  cardType: z.string().min(1, 'Card type is required'),
  isActive: z.boolean()
});

// Loan Validation Schema
export const loanSchema = z.object({
  name: z.string()
    .min(1, 'Loan name is required')
    .max(100, 'Loan name must be less than 100 characters'),
  lender: z.string()
    .min(1, 'Lender name is required')
    .max(100, 'Lender name must be less than 100 characters'),
  loanType: z.string().min(1, 'Loan type is required'),
  originalAmount: z.number()
    .min(1, 'Original amount must be greater than 0')
    .max(10000000, 'Original amount must be less than $10,000,000'),
  currentBalance: z.number()
    .min(0, 'Current balance cannot be negative'),
  interestRate: z.number()
    .min(0, 'Interest rate cannot be negative')
    .max(100, 'Interest rate cannot exceed 100%'),
  monthlyPayment: z.number()
    .min(1, 'Monthly payment must be greater than 0'),
  term: z.number()
    .min(1, 'Term must be at least 1 month')
    .max(600, 'Term cannot exceed 600 months'),
  remainingTerm: z.number()
    .min(0, 'Remaining term cannot be negative'),
  isActive: z.boolean()
});

// Budget Validation Schema
export const budgetSchema = z.object({
  name: z.string()
    .min(1, 'Budget name is required')
    .max(100, 'Budget name must be less than 100 characters'),
  category: z.string().min(1, 'Category is required'),
  monthlyLimit: z.number()
    .min(1, 'Monthly limit must be greater than 0')
    .max(1000000, 'Monthly limit must be less than $1,000,000'),
  isActive: z.boolean()
});

// Financial Goal Validation Schema
export const financialGoalSchema = z.object({
  name: z.string()
    .min(1, 'Goal name is required')
    .max(100, 'Goal name must be less than 100 characters'),
  type: z.string().min(1, 'Goal type is required'),
  targetAmount: z.number()
    .min(1, 'Target amount must be greater than 0')
    .max(10000000, 'Target amount must be less than $10,000,000'),
  currentAmount: z.number()
    .min(0, 'Current amount cannot be negative'),
  targetDate: z.date({
    required_error: 'Target date is required',
    invalid_type_error: 'Please enter a valid date'
  }),
  monthlyContribution: z.number()
    .min(0, 'Monthly contribution cannot be negative')
    .max(1000000, 'Monthly contribution must be less than $1,000,000'),
  priority: z.enum(['low', 'medium', 'high'] as const, {
    errorMap: () => ({ message: 'Please select priority level' })
  }),
  isCompleted: z.boolean()
});

// Investment Validation Schema
export const investmentSchema = z.object({
  symbol: z.string().min(1, 'Symbol is required').max(10, 'Symbol must be less than 10 characters'),
  name: z.string().min(1, 'Company name is required').max(100, 'Name must be less than 100 characters'),
  shares: z.string().min(1, 'Shares is required').refine(
    (val) => !isNaN(Number(val)) && Number(val) > 0,
    'Shares must be a positive number'
  ),
  purchasePrice: z.string().min(1, 'Purchase price is required').refine(
    (val) => !isNaN(Number(val)) && Number(val) > 0,
    'Purchase price must be a positive number'
  ),
  currentPrice: z.string().min(1, 'Current price is required').refine(
    (val) => !isNaN(Number(val)) && Number(val) > 0,
    'Current price must be a positive number'
  ),
  category: z.string().min(1, 'Category is required'),
  platform: z.string().min(1, 'Platform is required').max(50, 'Platform must be less than 50 characters'),
  notes: z.string().max(500, 'Notes must be less than 500 characters').optional()
});

// Type exports for form data
export type ExpenseFormData = z.infer<typeof expenseSchema>;
export type IncomeFormData = z.infer<typeof incomeSchema>;
export type CreditCardFormData = z.infer<typeof creditCardSchema>;
export type LoanFormData = z.infer<typeof loanSchema>;
export type BudgetFormData = z.infer<typeof budgetSchema>;
export type FinancialGoalFormData = z.infer<typeof financialGoalSchema>;
export type InvestmentFormData = z.infer<typeof investmentSchema>;

// Custom validation refinements
export const expenseSchemaWithRefinements = expenseSchema.refine(
  (data) => {
    if (data.frequency === 'one-time' && data.isRecurring) {
      return false;
    }
    return true;
  },
  {
    message: "One-time expenses cannot be recurring",
    path: ['isRecurring']
  }
);

export const creditCardSchemaWithRefinements = creditCardSchema.refine(
  (data) => data.currentBalance <= data.creditLimit,
  {
    message: "Current balance cannot exceed credit limit",
    path: ['currentBalance']
  }
);

export const loanSchemaWithRefinements = loanSchema.refine(
  (data) => data.currentBalance <= data.originalAmount,
  {
    message: "Current balance cannot exceed original amount",
    path: ['currentBalance']
  }
).refine(
  (data) => data.remainingTerm <= data.term,
  {
    message: "Remaining term cannot exceed total term",
    path: ['remainingTerm']
  }
);

export const financialGoalSchemaWithRefinements = financialGoalSchema.refine(
  (data) => data.currentAmount <= data.targetAmount,
  {
    message: "Current amount cannot exceed target amount",
    path: ['currentAmount']
  }
).refine(
  (data) => data.targetDate > new Date(),
  {
    message: "Target date must be in the future",
    path: ['targetDate']
  }
);