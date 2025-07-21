import { useState } from 'react';
import { ArrowLeft, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FilterPanel } from '@/components/FilterPanel';
import { useFinance } from '@/contexts/FinanceContext';
import { cn } from '@/lib/utils';
import { format, isSameDay, startOfMonth, endOfMonth } from 'date-fns';

interface DailyCashFlow {
  date: Date;
  income: number;
  expenses: number;
  netFlow: number;
  transactions: Array<{
    description: string;
    amount: number;
    type: 'income' | 'expense';
  }>;
}

// Sample cash flow data
const generateSampleData = (): DailyCashFlow[] => {
  const data: DailyCashFlow[] = [];
  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  
  // Generate sample data for the current month
  for (let date = new Date(monthStart); date <= monthEnd; date.setDate(date.getDate() + 1)) {
    const currentDate = new Date(date);
    const dayOfWeek = currentDate.getDay();
    
    // Simulate different cash flow patterns
    let income = 0;
    let expenses = Math.random() * 150 + 20; // Random daily expenses
    
    // Payday simulation (every other Friday)
    if (dayOfWeek === 5 && Math.random() > 0.5) {
      income = 2500 + Math.random() * 500;
    }
    
    // Weekend spending spike
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      expenses += Math.random() * 200;
    }
    
    // Random large expenses
    if (Math.random() > 0.85) {
      expenses += Math.random() * 800 + 200;
    }
    
    // Random additional income
    if (Math.random() > 0.9) {
      income += Math.random() * 300 + 100;
    }
    
    const transactions = [];
    if (income > 0) {
      transactions.push({
        description: income > 1000 ? 'Salary Payment' : 'Side Income',
        amount: income,
        type: 'income' as const
      });
    }
    
    transactions.push({
      description: expenses > 300 ? 'Large Purchase' : 'Daily Expenses',
      amount: -expenses,
      type: 'expense' as const
    });
    
    data.push({
      date: currentDate,
      income: Math.round(income),
      expenses: Math.round(expenses),
      netFlow: Math.round(income - expenses),
      transactions
    });
  }
  
  return data;
};

export default function CashFlowCalendar() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const { getTransactionsByDate, getTotalIncome, getTotalExpenses, getFilteredTransactions } = useFinance();
  
  // Use real data from context instead of sample data
  const [useSampleData] = useState(false); // Using real data now
  const [cashFlowData] = useState<DailyCashFlow[]>([]);
  
  const getCashFlowForDate = (date: Date): DailyCashFlow | undefined => {
    if (useSampleData) {
      return cashFlowData.find(data => isSameDay(data.date, date));
    }
    
    // Use real transaction data
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayTransactions = getTransactionsByDate(dateStr);
    
    if (dayTransactions.length === 0) return undefined;
    
    const income = dayTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = dayTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    return {
      date,
      income,
      expenses,
      netFlow: income - expenses,
      transactions: dayTransactions.map(t => ({
        description: t.description,
        amount: t.type === 'income' ? t.amount : -t.amount,
        type: t.type
      }))
    };
  };
  
  const getSelectedDayData = (): DailyCashFlow | undefined => {
    return selectedDate ? getCashFlowForDate(selectedDate) : undefined;
  };
  
  const getDayClassName = (date: Date): string => {
    const dayData = getCashFlowForDate(date);
    if (!dayData) return '';
    
    const { netFlow } = dayData;
    
    if (Math.abs(netFlow) > 500) {
      return netFlow > 0 ? 'bg-emerald-500/20 text-emerald-700 font-semibold border-emerald-500' : 'bg-red-500/20 text-red-700 font-semibold border-red-500';
    } else if (netFlow > 100) {
      return 'bg-emerald-500/10 text-emerald-600';
    } else if (netFlow < -100) {
      return 'bg-red-500/10 text-red-600';
    }
    
    return '';
  };
  
  const selectedDayData = getSelectedDayData();
  
  const totalMonthlyIncome = getTotalIncome();
  const totalMonthlyExpenses = getTotalExpenses();
    
  const totalNetFlow = totalMonthlyIncome - totalMonthlyExpenses;

  return (
    <div className="page-container">
      <div className="page-content max-w-7xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link to="/navigation">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Cash Flow Calendar</h1>
            <p className="text-muted-foreground">Track your daily income and expenses</p>
          </div>
        </div>

        {/* Monthly Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Income</CardTitle>
              <TrendingUp className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">
                ${totalMonthlyIncome.toLocaleString()}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Expenses</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                ${totalMonthlyExpenses.toLocaleString()}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Cash Flow</CardTitle>
              <DollarSign className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className={cn(
                "text-2xl font-bold",
                totalNetFlow >= 0 ? "text-emerald-600" : "text-red-600"
              )}>
                {totalNetFlow >= 0 ? '+' : ''}${totalNetFlow.toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <FilterPanel compact />
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Daily Cash Flow</CardTitle>
              <div className="flex gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-emerald-500/20 border border-emerald-500 rounded"></div>
                  <span>Positive Flow</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500/20 border border-red-500 rounded"></div>
                  <span>Negative Flow</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-primary/20 border border-primary rounded"></div>
                  <span>Significant Amount</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="w-full"
                modifiers={{
                  cashFlow: (date) => {
                    const dayData = getCashFlowForDate(date);
                    return dayData !== undefined;
                  }
                }}
                modifiersClassNames={{
                  cashFlow: 'relative'
                }}
                components={{
                  Day: ({ date, displayMonth }) => {
                    const dayData = getCashFlowForDate(date);
                    const dayClassName = getDayClassName(date);
                    
                    return (
                      <button
                        onClick={() => setSelectedDate(date)}
                        className={cn(
                          "h-9 w-9 p-0 font-normal relative hover:bg-accent hover:text-accent-foreground rounded-md",
                          dayClassName,
                          selectedDate && isSameDay(date, selectedDate) && "bg-primary text-primary-foreground"
                        )}
                      >
                        {format(date, 'd')}
                        {dayData && (
                          <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
                            <div className={cn(
                              "text-xs px-1 rounded",
                              dayData.netFlow >= 0 ? "text-emerald-700" : "text-red-700"
                            )}>
                              {dayData.netFlow >= 0 ? '+' : ''}${Math.abs(dayData.netFlow)}
                            </div>
                          </div>
                        )}
                      </button>
                    );
                  }
                }}
              />
            </CardContent>
          </Card>

          {/* Selected Day Details */}
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'Select a Date'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedDayData ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Income</p>
                      <p className="text-lg font-semibold text-emerald-600">
                        ${selectedDayData.income.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Expenses</p>
                      <p className="text-lg font-semibold text-red-600">
                        ${selectedDayData.expenses.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Net Flow</p>
                    <p className={cn(
                      "text-xl font-bold",
                      selectedDayData.netFlow >= 0 ? "text-emerald-600" : "text-red-600"
                    )}>
                      {selectedDayData.netFlow >= 0 ? '+' : ''}${selectedDayData.netFlow.toLocaleString()}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Transactions</p>
                    <div className="space-y-2">
                      {selectedDayData.transactions.map((transaction, index) => (
                        <div key={index} className="flex justify-between items-center p-2 bg-muted rounded">
                          <span className="text-sm">{transaction.description}</span>
                          <Badge variant={transaction.type === 'income' ? 'default' : 'destructive'}>
                            {transaction.amount >= 0 ? '+' : ''}${Math.abs(transaction.amount).toLocaleString()}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  Select a date to view cash flow details
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}