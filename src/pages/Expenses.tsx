import React, { useState, useEffect } from 'react';
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

const Expenses = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const { toast } = useToast();
  const { addTransaction } = useFinance();

  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    category: 'other' as ExpenseCategory,
    type: 'need' as ExpenseType,
    frequency: 'monthly' as ExpenseFrequency,
    description: '',
    isRecurring: true,
    isActive: true,
    tags: ''
  });

  // Load expenses from localStorage on component mount
  useEffect(() => {
    const savedExpenses = localStorage.getItem('financial-expenses');
    if (savedExpenses) {
      const parsed = JSON.parse(savedExpenses);
      // Convert date strings back to Date objects
      const expensesWithDates = parsed.map((expense: any) => ({
        ...expense,
        createdAt: new Date(expense.createdAt),
        updatedAt: new Date(expense.updatedAt),
        dueDate: expense.dueDate ? new Date(expense.dueDate) : undefined,
        nextDueDate: expense.nextDueDate ? new Date(expense.nextDueDate) : undefined
      }));
      setExpenses(expensesWithDates);
    }
  }, []);

  // Save expenses to localStorage whenever expenses change
  useEffect(() => {
    localStorage.setItem('financial-expenses', JSON.stringify(expenses));
  }, [expenses]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.amount) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    const today = new Date();
    const expense: Expense = {
      id: editingExpense?.id || Date.now().toString(),
      name: formData.name,
      amount: parseFloat(formData.amount),
      category: formData.category,
      type: formData.type,
      frequency: formData.frequency,
      description: formData.description,
      isRecurring: formData.isRecurring,
      dueDate: formData.isRecurring ? today : undefined,
      nextDueDate: formData.isRecurring ? getNextDueDate(today, formData.frequency) : undefined,
      tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0),
      isActive: formData.isActive,
      createdAt: editingExpense?.createdAt || today,
      updatedAt: today
    };

    if (editingExpense) {
      setExpenses(prev => prev.map(exp => exp.id === expense.id ? expense : exp));
      toast({
        title: "Expense Updated",
        description: "Your expense has been updated successfully"
      });
    } else {
      setExpenses(prev => [...prev, expense]);
      // Add transaction to FinanceContext for dashboard
      addTransaction({
        type: 'expense',
        amount: expense.amount,
        category: expense.category,
        description: `${expense.name} - ${expense.frequency} expense`,
        date: new Date().toISOString().split('T')[0]
      });
      toast({
        title: "Expense Added",
        description: "New expense has been added successfully"
      });
    }

    resetForm();
  };

  const getNextDueDate = (currentDate: Date, frequency: ExpenseFrequency): Date => {
    const next = new Date(currentDate);
    switch (frequency) {
      case 'daily':
        next.setDate(next.getDate() + 1);
        break;
      case 'weekly':
        next.setDate(next.getDate() + 7);
        break;
      case 'bi-weekly':
        next.setDate(next.getDate() + 14);
        break;
      case 'monthly':
        next.setMonth(next.getMonth() + 1);
        break;
      case 'quarterly':
        next.setMonth(next.getMonth() + 3);
        break;
      case 'semi-annually':
        next.setMonth(next.getMonth() + 6);
        break;
      case 'annually':
        next.setFullYear(next.getFullYear() + 1);
        break;
      default:
        return next;
    }
    return next;
  };

  const resetForm = () => {
    setFormData({
      name: '',
      amount: '',
      category: 'other',
      type: 'need',
      frequency: 'monthly',
      description: '',
      isRecurring: true,
      isActive: true,
      tags: ''
    });
    setEditingExpense(null);
    setIsAddDialogOpen(false);
  };

  const handleEdit = (expense: Expense) => {
    setFormData({
      name: expense.name,
      amount: expense.amount.toString(),
      category: expense.category,
      type: expense.type,
      frequency: expense.frequency,
      description: expense.description || '',
      isRecurring: expense.isRecurring,
      isActive: expense.isActive,
      tags: expense.tags.join(', ')
    });
    setEditingExpense(expense);
    setIsAddDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setExpenses(prev => prev.filter(exp => exp.id !== id));
    toast({
      title: "Expense Deleted",
      description: "Expense has been removed successfully"
    });
  };

  const getFrequencyColor = (frequency: ExpenseFrequency) => {
    switch (frequency) {
      case 'daily': return 'bg-red-100 text-red-800';
      case 'weekly': return 'bg-blue-100 text-blue-800';
      case 'bi-weekly': return 'bg-cyan-100 text-cyan-800';
      case 'monthly': return 'bg-purple-100 text-purple-800';
      case 'quarterly': return 'bg-orange-100 text-orange-800';
      case 'semi-annually': return 'bg-yellow-100 text-yellow-800';
      case 'annually': return 'bg-green-100 text-green-800';
      case 'one-time': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: ExpenseType) => {
    return type === 'need' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800';
  };

  const totalMonthlyExpenses = expenses
    .filter(expense => expense.isActive)
    .reduce((total, expense) => {
      if (!expense.isRecurring) return total;
      const multiplier = {
        daily: 30,
        weekly: 4.33,
        'bi-weekly': 2.17,
        monthly: 1,
        quarterly: 0.33,
        'semi-annually': 0.17,
        annually: 0.083,
        'one-time': 0
      }[expense.frequency];
      return total + (expense.amount * multiplier);
    }, 0);

  const expensesByCategory = expenses
    .filter(expense => expense.isActive)
    .reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {} as Record<ExpenseCategory, number>);

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
              <div className="grid grid-cols-2 gap-4">
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
                  <Label htmlFor="type">Type</Label>
                  <Select 
                    value={formData.type} 
                    onValueChange={(value: ExpenseType) => setFormData(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="need">Need</SelectItem>
                      <SelectItem value="want">Want</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="bi-weekly">Bi-weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="semi-annually">Semi-annually</SelectItem>
                    <SelectItem value="annually">Annually</SelectItem>
                    <SelectItem value="one-time">One-time</SelectItem>
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
              <div>
                <Label htmlFor="tags">Tags (Optional)</Label>
                <Input
                  id="tags"
                  placeholder="e.g., essential, subscription, variable"
                  value={formData.tags}
                  onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                />
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isRecurring"
                    checked={formData.isRecurring}
                    onChange={(e) => setFormData(prev => ({ ...prev, isRecurring: e.target.checked }))}
                    className="rounded"
                  />
                  <Label htmlFor="isRecurring">Recurring</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="rounded"
                  />
                  <Label htmlFor="isActive">Active</Label>
                </div>
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
            Based on {expenses.filter(exp => exp.isActive && exp.isRecurring).length} active recurring expense(s)
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
            <Card key={expense.id} className={!expense.isActive ? 'opacity-60' : ''}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">{expense.name}</h3>
                      <Badge className={getFrequencyColor(expense.frequency)}>
                        {expense.frequency}
                      </Badge>
                      <Badge className={getTypeColor(expense.type)}>
                        {expense.type}
                      </Badge>
                      <Badge variant="outline" style={{ color: CATEGORY_CONFIG[expense.category].color }}>
                        {CATEGORY_CONFIG[expense.category].label}
                      </Badge>
                      {!expense.isActive && (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <TrendingDown className="h-4 w-4" />
                        ${expense.amount.toFixed(2)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Added {expense.createdAt.toLocaleDateString()}
                      </span>
                      {expense.tags.length > 0 && (
                        <span className="flex items-center gap-1">
                          <Tag className="h-4 w-4" />
                          {expense.tags.join(', ')}
                        </span>
                      )}
                    </div>
                    {expense.description && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {expense.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(expense)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(expense.id)}
                    >
                      <Trash2 className="h-4 w-4" />
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