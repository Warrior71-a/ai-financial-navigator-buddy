import React from 'react';
import { Plus, TrendingDown, Tag, Calendar, Edit, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { DataCard } from '@/components/DataCard';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { useFormHandler } from '@/hooks/useFormHandler';
import { useFinance } from '@/contexts/FinanceContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Expense, ExpenseCategory, ExpenseFrequency, CATEGORY_CONFIG } from '@/types/finance';

const ExpensesSimplified = () => {
  const { addTransaction } = useFinance();
  const { data: expenses, loading, insertData, updateData, deleteData } = useSupabaseData({
    tableName: 'expenses',
    onDataChange: (data) => {
      // Dispatch event for FinanceContext to pick up
      window.dispatchEvent(new CustomEvent('supabaseExpensesUpdated', { detail: data }));
    }
  });

  const initialFormData = {
    name: '',
    amount: '',
    category: 'other' as ExpenseCategory,
    frequency: 'monthly' as ExpenseFrequency,
    description: ''
  };

  const handleSubmit = async (formData: typeof initialFormData, isEditing: boolean) => {
    const expenseData = {
      name: formData.name,
      amount: parseFloat(formData.amount),
      category: formData.category,
      frequency: formData.frequency,
      description: formData.description,
      is_active: true
    };

    if (isEditing && editingItem && 'id' in editingItem) {
      await updateData((editingItem as any).id, expenseData);
    } else {
      await insertData(expenseData);
      
      // Add transaction to FinanceContext for dashboard
      addTransaction({
        type: 'expense',
        amount: parseFloat(formData.amount),
        category: formData.category,
        description: `${formData.name} - ${formData.frequency} expense`,
        date: new Date().toISOString().split('T')[0]
      });
    }
  };

  const {
    formData,
    editingItem,
    isDialogOpen,
    setIsDialogOpen,
    resetForm,
    handleEdit,
    handleSubmit: onSubmit,
    updateFormData
  } = useFormHandler({
    initialData: initialFormData,
    onSubmit: handleSubmit
  });

  const getFrequencyColor = (frequency: ExpenseFrequency) => {
    const colors = {
      weekly: 'bg-blue-100 text-blue-800',
      monthly: 'bg-purple-100 text-purple-800',
      annually: 'bg-green-100 text-green-800',
      quarterly: 'bg-orange-100 text-orange-800',
      'bi-weekly': 'bg-teal-100 text-teal-800',
      'semi-annually': 'bg-indigo-100 text-indigo-800',
      daily: 'bg-red-100 text-red-800'
    };
    return colors[frequency] || 'bg-gray-100 text-gray-800';
  };

  const totalMonthlyExpenses = expenses
    .filter((expense: Expense) => expense.isActive)
    .reduce((total: number, expense: Expense) => {
      const multiplier = expense.frequency === 'weekly' ? 4.33 
        : expense.frequency === 'monthly' ? 1 
        : expense.frequency === 'annually' ? 1/12 
        : expense.frequency === 'quarterly' ? 4
        : expense.frequency === 'bi-weekly' ? 2.17
        : expense.frequency === 'semi-annually' ? 2
        : expense.frequency === 'daily' ? 30.4
        : 1;
      return total + (expense.amount * multiplier);
    }, 0);

  if (loading) {
    return <LoadingSpinner message="Loading expense data..." />;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <PageHeader
        title="Expenses"
        description="Track your spending and manage your budget"
        icon={TrendingDown}
        actions={
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2" onClick={resetForm}>
                <Plus className="h-4 w-4" />
                Add Expense
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editingItem ? 'Edit Expense' : 'Add New Expense'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={onSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Expense Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Rent, Groceries, Netflix"
                    value={formData.name}
                    onChange={(e) => updateFormData({ name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => updateFormData({ amount: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={formData.category} onValueChange={(value: ExpenseCategory) => updateFormData({ category: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                             {React.createElement(config.icon, { className: "h-4 w-4" })}
                            {config.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="frequency">Frequency</Label>
                  <Select value={formData.frequency} onValueChange={(value: ExpenseFrequency) => updateFormData({ frequency: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="bi-weekly">Bi-weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="semi-annually">Semi-annually</SelectItem>
                      <SelectItem value="annually">Annually</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Additional notes about this expense..."
                    value={formData.description}
                    onChange={(e) => updateFormData({ description: e.target.value })}
                  />
                </div>
                <Button type="submit" className="w-full">
                  {editingItem ? 'Update Expense' : 'Add Expense'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <DataCard
          title="Total Monthly"
          value={`$${totalMonthlyExpenses.toFixed(2)}`}
          subtitle={`Based on ${expenses.filter((e: Expense) => e.isActive).length} active expense(s)`}
          icon={TrendingDown}
        />
        <DataCard
          title="Active Expenses"
          value={expenses.filter((e: Expense) => e.isActive).length}
          icon={Calendar}
        />
        <DataCard
          title="Categories"
          value={new Set(expenses.map((e: Expense) => e.category)).size}
          icon={Tag}
        />
      </div>

      {/* Expense List */}
      <Card>
        <CardHeader>
          <CardTitle>Expense List</CardTitle>
        </CardHeader>
        <CardContent>
          {expenses.length === 0 ? (
            <div className="text-center py-8">
              <TrendingDown className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No expenses yet</h3>
              <p className="text-muted-foreground">Start by adding your first expense to begin tracking</p>
            </div>
          ) : (
            <div className="space-y-4">
              {expenses.map((expense: Expense) => {
                const categoryConfig = CATEGORY_CONFIG[expense.category];
                const CategoryIcon = categoryConfig?.icon || Tag;
                
                return (
                  <div key={expense.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${categoryConfig?.color || 'bg-gray-100'}`}>
                        <CategoryIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-medium">{expense.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className={getFrequencyColor(expense.frequency)}>
                            {expense.frequency}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {categoryConfig?.label || expense.category}
                          </span>
                        </div>
                        {expense.description && (
                          <p className="text-sm text-muted-foreground mt-1">{expense.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="font-bold text-lg">${expense.amount.toFixed(2)}</div>
                        <div className="text-sm text-muted-foreground">
                          per {expense.frequency.replace('-', ' ')}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit({
                            name: expense.name,
                            amount: expense.amount.toString(),
                            category: expense.category,
                            frequency: expense.frequency,
                            description: expense.description || ''
                          } as any)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteData((expense as any).id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ExpensesSimplified;