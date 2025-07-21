import React, { useEffect, useState } from 'react';
import { Plus, TrendingDown, Calendar, Edit, Trash2, Tag, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useFinance } from '@/contexts/FinanceContext';
import { Expense, ExpenseCategory, ExpenseType, ExpenseFrequency, CATEGORY_CONFIG } from '@/types/finance';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const Expenses = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { addTransaction } = useFinance();

  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    category: 'other' as ExpenseCategory,
    frequency: 'monthly' as ExpenseFrequency,
    description: ''
  });

  // Load expenses from Supabase on component mount
  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Convert to our local format
      const processedExpenses = data.map((expense: any) => ({
        id: expense.id,
        name: expense.name,
        amount: expense.amount,
        category: expense.category as ExpenseCategory,
        frequency: expense.frequency as ExpenseFrequency,
        description: expense.description || '',
        type: 'need' as ExpenseType, // Default since not in DB
        isRecurring: true, // Default since not in DB
        isActive: expense.is_active,
        tags: [], // Default since not in DB
        createdAt: new Date(expense.created_at),
        updatedAt: new Date(expense.updated_at)
      }));
      
      setExpenses(processedExpenses);
    } catch (error: any) {
      console.error('Error loading expenses:', error);
      
      let errorMessage = "Failed to load expense data";
      if (error?.message?.includes('permission')) {
        errorMessage = "You don't have permission to access this data. Please log in again.";
      } else if (error?.message?.includes('RLS')) {
        errorMessage = "Access denied. Please ensure you're logged in properly.";
      } else if (error?.code === '42501') {
        errorMessage = "Insufficient permissions. Please log in again.";
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.amount) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields"
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to add expenses",
          variant: "destructive"
        });
        return;
      }

      // Map to database format, filtering out unsupported categories
      const dbCategory = ['housing', 'transportation', 'food', 'utilities', 'entertainment', 'healthcare', 'shopping', 'other'].includes(formData.category) 
        ? formData.category 
        : 'other';
      
      const expenseData = {
        user_id: user.id,
        name: formData.name,
        amount: parseFloat(formData.amount),
        category: dbCategory as any,
        frequency: formData.frequency as any,
        description: formData.description,
        is_active: true
      };

      if (editingExpense) {
        const { error } = await supabase
          .from('expenses')
          .update(expenseData)
          .eq('id', editingExpense.id)
          .eq('user_id', user.id);

        if (error) throw error;

        toast({
          title: "Expense Updated",
          description: "Expense has been updated successfully"
        });
      } else {
        const { error } = await supabase
          .from('expenses')
          .insert(expenseData);

        if (error) throw error;

        // Add transaction to FinanceContext for dashboard
        addTransaction({
          type: 'expense',
          amount: parseFloat(formData.amount),
          category: formData.category,
          description: `${formData.name} - ${formData.frequency} expense`,
          date: new Date().toISOString().split('T')[0]
        });

        toast({
          title: "Expense Added",
          description: "New expense has been added successfully"
        });
      }

      // Reload expenses to get updated data
      await loadExpenses();
      resetForm();
    } catch (error: any) {
      console.error('Error saving expense:', error);
      
      let errorMessage = "Failed to save expense data";
      if (error?.message?.includes('permission') || error?.code === '42501') {
        errorMessage = "You don't have permission to save data. Please log in again.";
      } else if (error?.message?.includes('RLS')) {
        errorMessage = "Access denied. Please ensure you're logged in properly.";
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      amount: '',
      category: 'other',
      frequency: 'monthly',
      description: ''
    });
    setEditingExpense(null);
    setIsAddDialogOpen(false);
  };

  const handleEdit = (expense: Expense) => {
    setFormData({
      name: expense.name,
      amount: expense.amount.toString(),
      category: expense.category,
      frequency: expense.frequency,
      description: expense.description || ''
    });
    setEditingExpense(expense);
    setIsAddDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      await loadExpenses();
      toast({
        title: "Expense Deleted",
        description: "Expense has been deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast({
        title: "Error",
        description: "Failed to delete expense",
        variant: "destructive"
      });
    }
  };

  const getFrequencyColor = (frequency: ExpenseFrequency) => {
    switch (frequency) {
      case 'weekly': return 'bg-blue-100 text-blue-800';
      case 'monthly': return 'bg-purple-100 text-purple-800';
      case 'annually': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const totalMonthlyExpenses = expenses
    .filter(expense => expense.isActive)
    .reduce((total, expense) => {
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
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">
          <p>Loading expense data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/navigation">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Expenses</h1>
            <p className="text-muted-foreground">Track your spending and manage your budget</p>
          </div>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Expense
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingExpense ? 'Edit Expense' : 'Add New Expense'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Expense Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Rent, Groceries, Netflix"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
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
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(value: ExpenseCategory) => setFormData(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="frequency">Frequency</Label>
                <Select 
                  value={formData.frequency} 
                  onValueChange={(value: ExpenseFrequency) => setFormData(prev => ({ ...prev, frequency: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="annually">Annually</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Additional notes..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  {editingExpense ? 'Update Expense' : 'Add Expense'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Card */}
      <Card>
        <CardHeader className="flex flex-row items-center space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Monthly Expenses</CardTitle>
          <TrendingDown className="h-4 w-4 ml-auto text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            ${totalMonthlyExpenses.toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground">
            Based on {expenses.filter(exp => exp.isActive).length} active expense(s)
          </p>
        </CardContent>
      </Card>

      {/* Expense List */}
      <div className="grid gap-4">
        {expenses.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <TrendingDown className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No expenses yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Add your first expense to start tracking your spending
              </p>
              <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Expense
              </Button>
            </CardContent>
          </Card>
        ) : (
          expenses.map((expense) => (
            <Card key={expense.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="font-semibold">{expense.name}</h3>
                    <p className="text-2xl font-bold text-red-600">
                      ${expense.amount.toLocaleString()}
                    </p>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="secondary"
                        className={getFrequencyColor(expense.frequency)}
                      >
                        {expense.frequency}
                      </Badge>
                      <Badge variant="outline" style={{ color: CATEGORY_CONFIG[expense.category].color }}>
                        {CATEGORY_CONFIG[expense.category].label}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        Added {expense.createdAt.toLocaleDateString()}
                      </span>
                    </div>
                    {expense.description && (
                      <p className="text-sm text-muted-foreground">
                        {expense.description}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(expense)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(expense.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default Expenses;