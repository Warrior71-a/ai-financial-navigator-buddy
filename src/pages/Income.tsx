import React, { useEffect, useState } from 'react';
import { Plus, DollarSign, Calendar, Edit, Trash2, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useFinance } from '@/contexts/FinanceContext';
import { Income as IncomeType, IncomeFrequency } from '@/types/finance';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const Income = () => {
  const [incomes, setIncomes] = useState<IncomeType[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState<IncomeType | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { addTransaction } = useFinance();

  const [formData, setFormData] = useState({
    source: '',
    amount: '',
    frequency: 'monthly' as IncomeFrequency,
    isActive: true
  });

  // Load incomes from Supabase on component mount
  useEffect(() => {
    loadIncomes();
  }, []);

  const loadIncomes = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('incomes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Convert to our local format
      const processedIncomes = data.map((income: any) => ({
        id: income.id,
        source: income.source,
        amount: income.amount,
        frequency: income.frequency as IncomeFrequency,
        isActive: income.is_active,
        createdAt: new Date(income.created_at),
        updatedAt: new Date(income.updated_at)
      }));
      
      setIncomes(processedIncomes);
    } catch (error: any) {
      console.error('Error loading incomes:', error);
      
      let errorMessage = "Failed to load income data";
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
    
    if (!formData.source || !formData.amount || !formData.frequency) {
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
          description: "You must be logged in to add income",
          variant: "destructive"
        });
        return;
      }

      const incomeData = {
        user_id: user.id,
        source: formData.source,
        amount: parseFloat(formData.amount),
        frequency: formData.frequency as any,
        is_active: true
      };

      if (editingIncome) {
        const { error } = await supabase
          .from('incomes')
          .update(incomeData)
          .eq('id', editingIncome.id)
          .eq('user_id', user.id);

        if (error) throw error;

        toast({
          title: "Income Updated",
          description: "Income source has been updated successfully"
        });
      } else {
        const { error } = await supabase
          .from('incomes')
          .insert(incomeData);

        if (error) throw error;

        // Add transaction to FinanceContext for dashboard
        addTransaction({
          type: 'income',
          amount: parseFloat(formData.amount),
          category: formData.source,
          description: `${formData.source} - ${formData.frequency} income`,
          date: new Date().toISOString().split('T')[0]
        });

        toast({
          title: "Income Added",
          description: "New income source has been added successfully"
        });
      }

      // Reload incomes to get updated data
      await loadIncomes();
      resetForm();
    } catch (error: any) {
      console.error('Error saving income:', error);
      
      let errorMessage = "Failed to save income data";
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
      source: '',
      amount: '',
      frequency: 'monthly',
      isActive: true
    });
    setEditingIncome(null);
    setIsAddDialogOpen(false);
  };

  const handleEdit = (income: IncomeType) => {
    setFormData({
      source: income.source,
      amount: income.amount.toString(),
      frequency: income.frequency,
      isActive: income.isActive
    });
    setEditingIncome(income);
    setIsAddDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('incomes')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      await loadIncomes();
      toast({
        title: "Income Deleted",
        description: "Income source has been deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting income:', error);
      toast({
        title: "Error",
        description: "Failed to delete income",
        variant: "destructive"
      });
    }
  };

  const getFrequencyColor = (frequency: IncomeFrequency) => {
    switch (frequency) {
      case 'weekly': return 'bg-blue-100 text-blue-800';
      case 'monthly': return 'bg-purple-100 text-purple-800';
      case 'yearly': return 'bg-red-100 text-red-800';
      case 'bi-weekly': return 'bg-teal-100 text-teal-800';
      case 'quarterly': return 'bg-orange-100 text-orange-800';
      case 'one-time': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const totalMonthlyIncome = incomes
    .filter(income => income.isActive)
    .reduce((total, income) => {
      const multiplier = income.frequency === 'weekly' ? 4.33 
        : income.frequency === 'monthly' ? 1 
        : income.frequency === 'yearly' ? 1/12 
        : income.frequency === 'quarterly' ? 4
        : income.frequency === 'bi-weekly' ? 2.17
        : income.frequency === 'one-time' ? 0
        : 1;
      return total + (income.amount * multiplier);
    }, 0);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">
          <p>Loading income data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Income Sources</h1>
            <p className="text-muted-foreground">Manage your income streams and track your earnings</p>
          </div>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Income
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingIncome ? 'Edit Income Source' : 'Add New Income Source'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="source">Income Source</Label>
                <Input
                  id="source"
                  placeholder="e.g., Salary, Freelance, Investment"
                  value={formData.source}
                  onChange={(e) => setFormData(prev => ({ ...prev, source: e.target.value }))}
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
                <Label htmlFor="frequency">Frequency</Label>
                <Select 
                  value={formData.frequency} 
                  onValueChange={(value: IncomeFrequency) => setFormData(prev => ({ ...prev, frequency: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="bi-weekly">Bi-weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                    <SelectItem value="one-time">One-time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  {editingIncome ? 'Update Income' : 'Add Income'}
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
          <CardTitle className="text-sm font-medium">Total Monthly Income</CardTitle>
          <DollarSign className="h-4 w-4 ml-auto text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            ${totalMonthlyIncome.toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground">
            Based on {incomes.filter(inc => inc.isActive).length} active income source(s)
          </p>
        </CardContent>
      </Card>

      {/* Income List */}
      <div className="grid gap-4">
        {incomes.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No income sources yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Add your first income source to start tracking your earnings
              </p>
              <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Income Source
              </Button>
            </CardContent>
          </Card>
        ) : (
          incomes.map((income) => (
            <Card key={income.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="font-semibold">{income.source}</h3>
                    <p className="text-2xl font-bold text-green-600">
                      ${income.amount.toLocaleString()}
                    </p>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="secondary"
                        className={getFrequencyColor(income.frequency)}
                      >
                        {income.frequency}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        Added {income.createdAt.toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(income)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(income.id)}
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

export default Income;