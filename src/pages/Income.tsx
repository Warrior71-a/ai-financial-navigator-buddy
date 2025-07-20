import React, { useState, useEffect } from 'react';
import { Plus, DollarSign, Calendar, Edit, Trash2, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Income as IncomeType, IncomeFrequency } from '@/types/finance';
import { Link } from 'react-router-dom';

const Income = () => {
  const [incomes, setIncomes] = useState<IncomeType[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState<IncomeType | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    source: '',
    amount: '',
    frequency: 'monthly' as IncomeFrequency,
    isActive: true
  });

  // Load incomes from localStorage on component mount
  useEffect(() => {
    const savedIncomes = localStorage.getItem('financial-incomes');
    if (savedIncomes) {
      const parsedIncomes = JSON.parse(savedIncomes);
      // Convert date strings back to Date objects
      const incomesWithDates = parsedIncomes.map((income: any) => ({
        ...income,
        createdAt: new Date(income.createdAt),
        updatedAt: new Date(income.updatedAt)
      }));
      setIncomes(incomesWithDates);
    }
  }, []);

  // Save incomes to localStorage whenever incomes change
  useEffect(() => {
    localStorage.setItem('financial-incomes', JSON.stringify(incomes));
  }, [incomes]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.source || !formData.amount) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    const income: IncomeType = {
      id: editingIncome?.id || Date.now().toString(),
      source: formData.source,
      amount: parseFloat(formData.amount),
      frequency: formData.frequency,
      isActive: formData.isActive,
      createdAt: editingIncome?.createdAt || new Date(),
      updatedAt: new Date()
    };

    if (editingIncome) {
      setIncomes(prev => prev.map(inc => inc.id === income.id ? income : inc));
      toast({
        title: "Income Updated",
        description: "Your income source has been updated successfully"
      });
    } else {
      setIncomes(prev => [...prev, income]);
      toast({
        title: "Income Added",
        description: "New income source has been added successfully"
      });
    }

    resetForm();
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

  const handleDelete = (id: string) => {
    setIncomes(prev => prev.filter(inc => inc.id !== id));
    toast({
      title: "Income Deleted",
      description: "Income source has been removed successfully"
    });
  };

  const getFrequencyColor = (frequency: IncomeFrequency) => {
    switch (frequency) {
      case 'weekly': return 'bg-blue-100 text-blue-800';
      case 'bi-weekly': return 'bg-green-100 text-green-800';
      case 'monthly': return 'bg-purple-100 text-purple-800';
      case 'quarterly': return 'bg-orange-100 text-orange-800';
      case 'yearly': return 'bg-red-100 text-red-800';
      case 'one-time': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const totalMonthlyIncome = incomes
    .filter(income => income.isActive)
    .reduce((total, income) => {
      const multiplier = {
        weekly: 4.33,
        'bi-weekly': 2.17,
        monthly: 1,
        quarterly: 0.33,
        yearly: 0.083,
        'one-time': 0
      }[income.frequency];
      return total + (income.amount * multiplier);
    }, 0);

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
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="rounded"
                />
                <Label htmlFor="isActive">Active income source</Label>
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
            <Card key={income.id} className={!income.isActive ? 'opacity-60' : ''}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">{income.source}</h3>
                      <Badge className={getFrequencyColor(income.frequency)}>
                        {income.frequency}
                      </Badge>
                      {!income.isActive && (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        ${income.amount.toFixed(2)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Added {income.createdAt.toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(income)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(income.id)}
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

export default Income;
