import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TrendingUp, TrendingDown, DollarSign, Plus, Trash2, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

interface BudgetCategory {
  id: string;
  name: string;
  type: 'income' | 'expense';
  monthlyValues: number[];
}

interface BudgetData {
  [year: number]: BudgetCategory[];
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const BudgetPlanner = () => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [budgetData, setBudgetData] = useState<BudgetData>({});
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  // Generate year options (current year +/- 5 years)
  const yearOptions = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

  // Load data from localStorage
  useEffect(() => {
    const savedData = localStorage.getItem('budget-planner-data');
    if (savedData) {
      setBudgetData(JSON.parse(savedData));
    }
  }, []);

  // Save data to localStorage
  useEffect(() => {
    localStorage.setItem('budget-planner-data', JSON.stringify(budgetData));
  }, [budgetData]);

  // Get categories for selected year
  const getCurrentCategories = (): BudgetCategory[] => {
    return budgetData[selectedYear] || [];
  };

  // Add new category
  const addCategory = (type: 'income' | 'expense') => {
    const newCategory: BudgetCategory = {
      id: `${type}-${Date.now()}`,
      name: `New ${type}`,
      type,
      monthlyValues: new Array(12).fill(0)
    };

    setBudgetData(prev => ({
      ...prev,
      [selectedYear]: [...(prev[selectedYear] || []), newCategory]
    }));
  };

  // Delete category
  const deleteCategory = (categoryId: string) => {
    setBudgetData(prev => ({
      ...prev,
      [selectedYear]: (prev[selectedYear] || []).filter(cat => cat.id !== categoryId)
    }));
  };

  // Update category name
  const updateCategoryName = (categoryId: string, newName: string) => {
    setBudgetData(prev => ({
      ...prev,
      [selectedYear]: (prev[selectedYear] || []).map(cat =>
        cat.id === categoryId ? { ...cat, name: newName } : cat
      )
    }));
  };

  // Update monthly value
  const updateMonthlyValue = (categoryId: string, monthIndex: number, value: number) => {
    setBudgetData(prev => ({
      ...prev,
      [selectedYear]: (prev[selectedYear] || []).map(cat =>
        cat.id === categoryId
          ? {
              ...cat,
              monthlyValues: cat.monthlyValues.map((val, idx) =>
                idx === monthIndex ? value : val
              )
            }
          : cat
      )
    }));
  };

  const categories = getCurrentCategories();
  const incomeCategories = categories.filter(cat => cat.type === 'income');
  const expenseCategories = categories.filter(cat => cat.type === 'expense');

  // Calculate totals
  const monthlyIncomeTotals = MONTHS.map((_, monthIndex) =>
    incomeCategories.reduce((sum, cat) => sum + (cat.monthlyValues[monthIndex] || 0), 0)
  );

  const monthlyExpenseTotals = MONTHS.map((_, monthIndex) =>
    expenseCategories.reduce((sum, cat) => sum + (cat.monthlyValues[monthIndex] || 0), 0)
  );

  const monthlyNetTotals = monthlyIncomeTotals.map((income, index) => income - monthlyExpenseTotals[index]);

  const totalAnnualIncome = monthlyIncomeTotals.reduce((sum, val) => sum + val, 0);
  const totalAnnualExpenses = monthlyExpenseTotals.reduce((sum, val) => sum + val, 0);
  const netSavings = totalAnnualIncome - totalAnnualExpenses;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const CategoryRow = ({ category }: { category: BudgetCategory }) => {
    const yearTotal = category.monthlyValues.reduce((sum, val) => sum + val, 0);

    return (
      <TableRow
        key={category.id}
        onMouseEnter={() => setHoveredRow(category.id)}
        onMouseLeave={() => setHoveredRow(null)}
        className="group"
      >
        <TableCell className="sticky left-0 bg-background border-r font-medium min-w-[200px]">
          <div className="flex items-center justify-between">
            <Input
              value={category.name}
              onChange={(e) => updateCategoryName(category.id, e.target.value)}
              className="border-none p-0 h-auto bg-transparent font-medium"
            />
            {hoveredRow === category.id && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteCategory(category.id)}
                className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </TableCell>
        {MONTHS.map((_, monthIndex) => (
          <TableCell key={monthIndex} className="p-1">
            <Input
              type="number"
              value={category.monthlyValues[monthIndex] || ''}
              onChange={(e) => updateMonthlyValue(category.id, monthIndex, parseFloat(e.target.value) || 0)}
              className="w-full text-center border-none bg-transparent"
              placeholder="0"
            />
          </TableCell>
        ))}
        <TableCell className="font-semibold text-right">
          {formatCurrency(yearTotal)}
        </TableCell>
      </TableRow>
    );
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-full mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link to="/navigation">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Budget Planner</h1>
            <p className="text-muted-foreground">
              Plan and track your annual budget by organizing income and expenses across 12 months. 
              Monitor your financial goals and make informed decisions about your spending.
            </p>
          </div>
        </div>

        {/* Year Selector */}
        <div className="flex items-center gap-4">
          <label htmlFor="year-select" className="text-sm font-medium">Budget Year:</label>
          <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {yearOptions.map(year => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-green-900 to-green-800 border-green-700 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-100 opacity-90">Total Income</p>
                  <p className="text-3xl font-bold text-white">
                    {formatCurrency(totalAnnualIncome)}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-300" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-900 to-red-800 border-red-700 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-100 opacity-90">Total Expenses</p>
                  <p className="text-3xl font-bold text-white">
                    {formatCurrency(totalAnnualExpenses)}
                  </p>
                </div>
                <TrendingDown className="h-8 w-8 text-red-300" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-cyan-900 to-cyan-800 border-cyan-700 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-cyan-100 opacity-90">Net Savings</p>
                  <p className={`text-3xl font-bold ${netSavings >= 0 ? 'text-white' : 'text-red-300'}`}>
                    {formatCurrency(netSavings)}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-cyan-300" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Budget Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Monthly Budget Breakdown</CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addCategory('income')}
                  className="text-green-700 border-green-200 hover:bg-green-50"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Income
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addCategory('expense')}
                  className="text-red-700 border-red-200 hover:bg-red-50"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Expense
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky left-0 bg-background border-r min-w-[200px]">Category</TableHead>
                    {MONTHS.map(month => (
                      <TableHead key={month} className="text-center min-w-[100px]">{month}</TableHead>
                    ))}
                    <TableHead className="text-center min-w-[120px]">Year Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Income Section */}
                  <TableRow className="bg-green-50/50">
                    <TableCell className="sticky left-0 bg-green-50/50 border-r font-bold text-green-700" colSpan={14}>
                      INCOME
                    </TableCell>
                  </TableRow>
                  {incomeCategories.map(category => (
                    <CategoryRow key={category.id} category={category} />
                  ))}
                  
                  {/* Total Income Row */}
                  <TableRow className="bg-green-100/50 font-semibold">
                    <TableCell className="sticky left-0 bg-green-100/50 border-r text-green-700">Total Income</TableCell>
                    {monthlyIncomeTotals.map((total, index) => (
                      <TableCell key={index} className="text-center text-green-700">
                        {formatCurrency(total)}
                      </TableCell>
                    ))}
                    <TableCell className="text-center text-green-700">
                      {formatCurrency(totalAnnualIncome)}
                    </TableCell>
                  </TableRow>

                  {/* Expenses Section */}
                  <TableRow className="bg-red-50/50">
                    <TableCell className="sticky left-0 bg-red-50/50 border-r font-bold text-red-700" colSpan={14}>
                      EXPENSES
                    </TableCell>
                  </TableRow>
                  {expenseCategories.map(category => (
                    <CategoryRow key={category.id} category={category} />
                  ))}

                  {/* Total Expenses Row */}
                  <TableRow className="bg-red-100/50 font-semibold">
                    <TableCell className="sticky left-0 bg-red-100/50 border-r text-red-700">Total Expenses</TableCell>
                    {monthlyExpenseTotals.map((total, index) => (
                      <TableCell key={index} className="text-center text-red-700">
                        {formatCurrency(total)}
                      </TableCell>
                    ))}
                    <TableCell className="text-center text-red-700">
                      {formatCurrency(totalAnnualExpenses)}
                    </TableCell>
                  </TableRow>

                  {/* Summary Section */}
                  <TableRow className="bg-cyan-50/50">
                    <TableCell className="sticky left-0 bg-cyan-50/50 border-r font-bold text-cyan-700" colSpan={14}>
                      SUMMARY
                    </TableCell>
                  </TableRow>

                  {/* Net Row */}
                  <TableRow className="bg-cyan-100/50 font-semibold">
                    <TableCell className="sticky left-0 bg-cyan-100/50 border-r text-cyan-700">Net</TableCell>
                    {monthlyNetTotals.map((net, index) => (
                      <TableCell key={index} className={cn(
                        "text-center font-semibold",
                        net >= 0 ? "text-cyan-700" : "text-red-700"
                      )}>
                        {formatCurrency(net)}
                      </TableCell>
                    ))}
                    <TableCell className={cn(
                      "text-center font-semibold",
                      netSavings >= 0 ? "text-cyan-700" : "text-red-700"
                    )}>
                      {formatCurrency(netSavings)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BudgetPlanner;