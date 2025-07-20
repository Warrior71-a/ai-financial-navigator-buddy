import React, { useState, useEffect } from 'react';
import { Plus, TrendingDown, Calendar, Edit, Trash2, Tag, ArrowLeft, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { FormFieldWrapper } from '@/components/ui/form-field-wrapper';
import { TableSkeleton, CardSkeleton } from '@/components/ui/loading-skeleton';
import { useLocalStorageWithErrorRecovery } from '@/hooks/useLocalStorage';
import { useFormSubmission } from '@/hooks/useLoadingState';
import { useFormValidation } from '@/hooks/useFormValidation';
import { expenseSchemaWithRefinements, type ExpenseFormData } from '@/lib/validations';
import { Expense, ExpenseCategory, ExpenseType, ExpenseFrequency, CATEGORY_CONFIG, STORAGE_KEYS } from '@/types/finance';
import { Link } from 'react-router-dom';

const ExpensesEnhanced = () => {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Enhanced localStorage with error recovery
  const {
    value: expenses,
    setValue: setExpenses,
    isLoading: storageLoading,
    error: storageError
  } = useLocalStorageWithErrorRecovery<Expense[]>(
    STORAGE_KEYS.EXPENSES,
    [],
    {
      onError: (error) => {
        toast({
          title: "Storage Error",
          description: "Failed to load expenses. Using default data.",
          variant: "destructive"
        });
      },
      validateData: (data): data is Expense[] => {
        return Array.isArray(data) && data.every(item => 
          typeof item === 'object' && 
          'id' in item && 
          'name' in item && 
          'amount' in item
        );
      }
    }
  );

  // Form submission with loading states
  const formSubmission = useFormSubmission();

  // Form validation
  const {
    data: formData,
    errors,
    isSubmitting,
    updateField,
    handleSubmit,
    reset: resetForm,
    getFieldProps
  } = useFormValidation<ExpenseFormData>({
    schema: expenseSchemaWithRefinements,
    initialData: {
      name: '',
      amount: 0,
      category: 'other' as ExpenseCategory,
      type: 'need' as ExpenseType,
      frequency: 'monthly' as ExpenseFrequency,
      isRecurring: true,
      tags: '',
      nextDueDate: new Date()
    },
    onSubmit: async (data) => {
      await formSubmission.submitForm(
        data,
        async (formData) => {
          const today = new Date();
          const expense: Expense = {
            id: editingExpense?.id || Date.now().toString(),
            name: formData.name,
            amount: formData.amount,
            category: formData.category as ExpenseCategory,
            type: formData.type,
            frequency: formData.frequency as ExpenseFrequency,
            description: '',
            isRecurring: formData.isRecurring,
            dueDate: formData.isRecurring ? today : undefined,
            nextDueDate: formData.isRecurring ? getNextDueDate(today, formData.frequency as ExpenseFrequency) : undefined,
            tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0),
            isActive: true,
            createdAt: editingExpense?.createdAt || today,
            updatedAt: today
          };

          if (editingExpense) {
            setExpenses(prev => prev.map(exp => exp.id === expense.id ? expense : exp));
          } else {
            setExpenses(prev => [...prev, expense]);
          }
        },
        {
          onSuccess: () => {
            toast({
              title: editingExpense ? "Expense Updated" : "Expense Added",
              description: `Your expense has been ${editingExpense ? 'updated' : 'added'} successfully`
            });
            closeDialog();
          },
          onError: (error) => {
            toast({
              title: "Error",
              description: error.message,
              variant: "destructive"
            });
          }
        }
      );
    }
  });

  const getNextDueDate = (currentDate: Date, frequency: ExpenseFrequency): Date => {
    const nextDate = new Date(currentDate);
    
    switch (frequency) {
      case 'daily':
        nextDate.setDate(nextDate.getDate() + 1);
        break;
      case 'weekly':
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case 'bi-weekly':
        nextDate.setDate(nextDate.getDate() + 14);
        break;
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      case 'quarterly':
        nextDate.setMonth(nextDate.getMonth() + 3);
        break;
      case 'annually':
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        break;
      default:
        nextDate.setDate(nextDate.getDate() + 30);
    }
    
    return nextDate;
  };

  const closeDialog = () => {
    setIsAddDialogOpen(false);
    setEditingExpense(null);
    resetForm();
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    updateField('name', expense.name);
    updateField('amount', expense.amount);
    updateField('category', expense.category);
    updateField('type', expense.type);
    updateField('frequency', expense.frequency);
    updateField('isRecurring', expense.isRecurring);
    updateField('tags', expense.tags?.join(', ') || '');
    updateField('nextDueDate', expense.nextDueDate || new Date());
    setIsAddDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setExpenses(prev => prev.filter(expense => expense.id !== id));
    toast({
      title: "Expense Deleted",
      description: "The expense has been removed successfully"
    });
  };

  // Calculate totals
  const totalMonthlyExpenses = expenses.reduce((total, expense) => {
    if (!expense.isActive) return total;
    
    switch (expense.frequency) {
      case 'weekly':
        return total + (expense.amount * 4.33);
      case 'bi-weekly':
        return total + (expense.amount * 2.17);
      case 'monthly':
        return total + expense.amount;
      case 'quarterly':
        return total + (expense.amount / 3);
      case 'annually':
        return total + (expense.amount / 12);
      default:
        return total + expense.amount;
    }
  }, 0);

  // Loading simulation
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading || storageLoading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-10 h-10 bg-muted rounded animate-pulse" />
            <div className="space-y-2">
              <div className="h-8 w-48 bg-muted rounded animate-pulse" />
              <div className="h-4 w-64 bg-muted rounded animate-pulse" />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="h-6 w-32 bg-muted rounded animate-pulse" />
              <div className="h-10 w-24 bg-muted rounded animate-pulse" />
            </div>
            <TableSkeleton rows={5} cols={6} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link to="/navigation">
            <Button variant="ghost" size="icon" disabled={isSubmitting}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Expenses</h1>
            <p className="text-muted-foreground">Track and manage your spending</p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Monthly</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                ${totalMonthlyExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Expenses</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {expenses.filter(e => e.isActive).length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Categories</CardTitle>
              <Tag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Set(expenses.map(e => e.category)).size}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Expenses List */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Expense List</CardTitle>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button disabled={isSubmitting}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Expense
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>
                      {editingExpense ? 'Edit Expense' : 'Add New Expense'}
                    </DialogTitle>
                  </DialogHeader>
                  
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <FormFieldWrapper
                      label="Expense Name"
                      error={errors.name}
                      required
                    >
                      <Input
                        value={formData.name || ''}
                        onChange={(e) => updateField('name', e.target.value)}
                        placeholder="Enter expense name"
                        disabled={isSubmitting}
                      />
                    </FormFieldWrapper>

                    <FormFieldWrapper
                      label="Amount"
                      error={errors.amount}
                      required
                    >
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.amount || ''}
                        onChange={(e) => updateField('amount', parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                        disabled={isSubmitting}
                      />
                    </FormFieldWrapper>

                    <FormFieldWrapper
                      label="Category"
                      error={errors.category}
                      required
                    >
                      <Select
                        value={formData.category}
                        onValueChange={(value) => updateField('category', value)}
                        disabled={isSubmitting}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
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
                    </FormFieldWrapper>

                    <FormFieldWrapper
                      label="Type"
                      error={errors.type}
                      required
                    >
                      <Select
                        value={formData.type}
                        onValueChange={(value) => updateField('type', value)}
                        disabled={isSubmitting}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="need">Need</SelectItem>
                          <SelectItem value="want">Want</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormFieldWrapper>

                    <FormFieldWrapper
                      label="Frequency"
                      error={errors.frequency}
                      required
                    >
                      <Select
                        value={formData.frequency}
                        onValueChange={(value) => updateField('frequency', value)}
                        disabled={isSubmitting}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="bi-weekly">Bi-weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="quarterly">Quarterly</SelectItem>
                          <SelectItem value="annually">Annually</SelectItem>
                          <SelectItem value="one-time">One-time</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormFieldWrapper>

                    <FormFieldWrapper
                      label="Recurring"
                      error={errors.isRecurring}
                    >
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={formData.isRecurring || false}
                          onCheckedChange={(checked) => updateField('isRecurring', checked)}
                          disabled={isSubmitting}
                        />
                        <span className="text-sm text-muted-foreground">
                          {formData.isRecurring ? 'Recurring expense' : 'One-time expense'}
                        </span>
                      </div>
                    </FormFieldWrapper>

                    <FormFieldWrapper
                      label="Tags"
                      error={errors.tags}
                      description="Separate multiple tags with commas"
                    >
                      <Input
                        value={formData.tags || ''}
                        onChange={(e) => updateField('tags', e.target.value)}
                        placeholder="groceries, household, utilities"
                        disabled={isSubmitting}
                      />
                    </FormFieldWrapper>

                    <div className="flex gap-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={closeDialog}
                        disabled={isSubmitting}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1"
                      >
                        {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        {editingExpense ? 'Update' : 'Add'} Expense
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {expenses.length === 0 ? (
              <div className="text-center py-8">
                <TrendingDown className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-muted-foreground mb-2">No expenses yet</h3>
                <p className="text-muted-foreground">Start by adding your first expense to begin tracking</p>
              </div>
            ) : (
              <div className="space-y-2">
                {expenses.map((expense) => {
                  const categoryConfig = CATEGORY_CONFIG[expense.category] || CATEGORY_CONFIG.other;
                  return (
                    <div
                      key={expense.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg bg-muted`}>
                          {React.createElement(categoryConfig.icon, { className: "h-4 w-4" })}
                        </div>
                        <div>
                          <h4 className="font-medium">{expense.name}</h4>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Badge variant="outline" className="text-xs">
                              {categoryConfig.label}
                            </Badge>
                            <Badge variant={expense.type === 'need' ? 'default' : 'secondary'}>
                              {expense.type}
                            </Badge>
                            <span>{expense.frequency}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="font-medium text-red-600">
                            ${expense.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </div>
                          {expense.nextDueDate && (
                            <div className="text-xs text-muted-foreground">
                              Next: {expense.nextDueDate.toLocaleDateString()}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(expense)}
                            disabled={isSubmitting}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(expense.id)}
                            disabled={isSubmitting}
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
    </div>
  );
};

export default ExpensesEnhanced;