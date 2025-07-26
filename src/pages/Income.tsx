import React from 'react';
import { Plus, DollarSign, Edit, Trash2 } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { Income as IncomeType, IncomeFrequency } from '@/types/finance';

const Income = () => {
  const { addTransaction } = useFinance();
  const { data: incomes, loading, insertData, updateData, deleteData } = useSupabaseData({
    tableName: 'incomes',
    onDataChange: (data) => {
      window.dispatchEvent(new CustomEvent('supabaseIncomesUpdated', { detail: data }));
    }
  });

  const initialFormData = {
    source: '',
    amount: '',
    frequency: 'monthly' as IncomeFrequency,
    isActive: true
  };

  const handleSubmit = async (formData: typeof initialFormData, isEditing: boolean) => {
    const incomeData = {
      source: formData.source,
      amount: parseFloat(formData.amount),
      frequency: formData.frequency,
      is_active: formData.isActive
    };

    if (isEditing && editingItem && 'id' in editingItem) {
      await updateData((editingItem as any).id, incomeData);
    } else {
      await insertData(incomeData);
      
      addTransaction({
        type: 'income',
        amount: parseFloat(formData.amount),
        category: formData.source,
        description: `${formData.source} - ${formData.frequency} income`,
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

  const getFrequencyColor = (frequency: IncomeFrequency) => {
    const colors = {
      weekly: 'bg-blue-100 text-blue-800',
      monthly: 'bg-purple-100 text-purple-800',
      yearly: 'bg-red-100 text-red-800',
      'bi-weekly': 'bg-teal-100 text-teal-800',
      quarterly: 'bg-orange-100 text-orange-800',
      'one-time': 'bg-gray-100 text-gray-800'
    };
    return colors[frequency] || 'bg-gray-100 text-gray-800';
  };

  const totalMonthlyIncome = incomes
    .filter((income: any) => income.is_active)
    .reduce((total: number, income: any) => {
      const multiplier = income.frequency === 'weekly' ? 4.33 
        : income.frequency === 'monthly' ? 1 
        : income.frequency === 'yearly' ? 1/12 
        : income.frequency === 'quarterly' ? 1/3
        : income.frequency === 'bi-weekly' ? 26/12  // 26 bi-weekly periods per year ÷ 12 months
        : income.frequency === 'one-time' ? 0
        : 1;
      return total + (Number(income.amount) * multiplier);
    }, 0);

  if (loading) {
    return <LoadingSpinner message="Loading income data..." />;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <PageHeader
        title="Income Sources"
        description="Manage your income streams and track your earnings"
        icon={DollarSign}
        actions={
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2" onClick={resetForm}>
                <Plus className="h-4 w-4" />
                Add Income
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingItem ? 'Edit Income Source' : 'Add New Income Source'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={onSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="source">Income Source</Label>
                  <Input
                    id="source"
                    placeholder="e.g., Salary, Freelance, Investment"
                    value={formData.source}
                    onChange={(e) => updateFormData({ source: e.target.value })}
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
                  <Label htmlFor="frequency">Frequency</Label>
                  <Select value={formData.frequency} onValueChange={(value: IncomeFrequency) => updateFormData({ frequency: value })}>
                    <SelectTrigger>
                      <SelectValue />
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
                <Button type="submit" className="w-full">
                  {editingItem ? 'Update Income' : 'Add Income'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <DataCard
          title="Total Monthly Income"
          value={`$${totalMonthlyIncome.toFixed(2)}`}
          subtitle={`From ${incomes.filter((i: any) => i.is_active).length} active source(s)`}
          icon={DollarSign}
        />
        <DataCard
          title="Active Sources"
          value={incomes.filter((i: any) => i.is_active).length}
        />
        <DataCard
          title="Total Sources"
          value={incomes.length}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Income Sources</CardTitle>
        </CardHeader>
        <CardContent>
          {incomes.length === 0 ? (
            <div className="text-center py-8">
              <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No income sources yet</h3>
              <p className="text-muted-foreground">Add your first income source to start tracking your earnings</p>
            </div>
          ) : (
            <div className="space-y-4">
              {incomes.map((income: IncomeType) => (
                <div key={(income as any).id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <DollarSign className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-medium">{income.source}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className={getFrequencyColor(income.frequency)}>
                          {income.frequency}
                        </Badge>
                        {!(income as any).is_active && (
                          <Badge variant="secondary" className="bg-gray-100 text-gray-800">
                            Inactive
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-bold text-lg text-green-600">${income.amount.toFixed(2)}</div>
                      <div className="text-sm text-muted-foreground">
                        per {income.frequency.replace('-', ' ')}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit({
                          source: income.source,
                          amount: income.amount.toString(),
                          frequency: income.frequency,
                          isActive: (income as any).is_active
                        } as any)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteData((income as any).id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Income;