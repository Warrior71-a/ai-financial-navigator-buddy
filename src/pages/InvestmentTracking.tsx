import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useLocalStorageWithErrorRecovery } from '@/hooks/useLocalStorage';
import { useToast } from '@/hooks/use-toast';
import { investmentSchema } from '@/lib/validations';
import { FormFieldWrapper } from '@/components/ui/form-field-wrapper';
import { 
  ArrowLeft, 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  PieChart,
  Edit,
  Trash2
} from 'lucide-react';
import { Investment, InvestmentCategory, Portfolio, INVESTMENT_CATEGORY_CONFIG } from '@/types/finance';

const InvestmentTracking = () => {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState<Investment | null>(null);

  const { value: investments, setValue: setInvestments } = 
    useLocalStorageWithErrorRecovery<Investment[]>('investments', [], {
      validateData: (data): data is Investment[] => 
        Array.isArray(data) && data.every(item => 
          typeof item === 'object' && 
          typeof item.id === 'string' &&
          typeof item.symbol === 'string' &&
          typeof item.name === 'string' &&
          typeof item.shares === 'number' &&
          typeof item.purchasePrice === 'number' &&
          typeof item.currentPrice === 'number'
        )
    });

  const [formData, setFormData] = useState({
    symbol: '',
    name: '',
    shares: '',
    purchasePrice: '',
    currentPrice: '',
    category: '' as InvestmentCategory,
    platform: '',
    notes: ''
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const resetForm = () => {
    setFormData({
      symbol: '',
      name: '',
      shares: '',
      purchasePrice: '',
      currentPrice: '',
      category: '' as InvestmentCategory,
      platform: '',
      notes: ''
    });
    setErrors({});
  };

  const validateForm = () => {
    try {
      investmentSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error: any) {
      const newErrors: Record<string, string> = {};
      error.errors?.forEach((err: any) => {
        if (err.path?.[0]) {
          newErrors[err.path[0]] = err.message;
        }
      });
      setErrors(newErrors);
      return false;
    }
  };

  const calculatePortfolio = (): Portfolio => {
    const totalValue = investments.reduce((sum, inv) => sum + (inv.shares * inv.currentPrice), 0);
    const totalCost = investments.reduce((sum, inv) => sum + (inv.shares * inv.purchasePrice), 0);
    const totalGainLoss = totalValue - totalCost;
    const totalGainLossPercentage = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;

    return {
      totalValue,
      totalGainLoss,
      totalGainLossPercentage,
      dayChange: 0, // Would need real-time data
      dayChangePercentage: 0,
      investments
    };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const investmentData: Investment = {
      id: editingInvestment?.id || crypto.randomUUID(),
      symbol: formData.symbol.toUpperCase(),
      name: formData.name,
      shares: parseFloat(formData.shares),
      purchasePrice: parseFloat(formData.purchasePrice),
      currentPrice: parseFloat(formData.currentPrice),
      purchaseDate: editingInvestment?.purchaseDate || new Date(),
      category: formData.category as InvestmentCategory,
      platform: formData.platform,
      notes: formData.notes,
      isActive: true,
      createdAt: editingInvestment?.createdAt || new Date(),
      updatedAt: new Date()
    };

    if (editingInvestment) {
      setInvestments(investments.map(inv => 
        inv.id === editingInvestment.id ? investmentData : inv
      ));
      toast({ title: "Investment updated successfully" });
    } else {
      setInvestments([...investments, investmentData]);
      toast({ title: "Investment added successfully" });
    }

    resetForm();
    setIsAddDialogOpen(false);
    setEditingInvestment(null);
  };

  const handleEdit = (investment: Investment) => {
    setEditingInvestment(investment);
    updateField('symbol', investment.symbol);
    updateField('name', investment.name);
    updateField('shares', investment.shares.toString());
    updateField('purchasePrice', investment.purchasePrice.toString());
    updateField('currentPrice', investment.currentPrice.toString());
    updateField('category', investment.category);
    updateField('platform', investment.platform);
    updateField('notes', investment.notes || '');
    setIsAddDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setInvestments(investments.filter(inv => inv.id !== id));
    toast({ title: "Investment deleted successfully" });
  };

  const portfolio = calculatePortfolio();

  const getAssetAllocation = () => {
    const allocation: Record<InvestmentCategory, number> = {} as Record<InvestmentCategory, number>;
    
    investments.forEach(inv => {
      const value = inv.shares * inv.currentPrice;
      allocation[inv.category] = (allocation[inv.category] || 0) + value;
    });

    return Object.entries(allocation).map(([category, value]) => ({
      category: category as InvestmentCategory,
      value,
      percentage: portfolio.totalValue > 0 ? (value / portfolio.totalValue) * 100 : 0
    }));
  };

  const assetAllocation = getAssetAllocation();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link 
              to="/navigation" 
              className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Investment Tracking</h1>
              <p className="text-muted-foreground">Portfolio management and performance tracking</p>
            </div>
          </div>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingInvestment(null);
                resetForm();
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Investment
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingInvestment ? 'Edit Investment' : 'Add New Investment'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <FormFieldWrapper label="Symbol" error={errors.symbol}>
                  <Input
                    id="symbol"
                    value={formData.symbol}
                    onChange={(e) => updateField('symbol', e.target.value.toUpperCase())}
                    placeholder="AAPL"
                    className="uppercase"
                  />
                </FormFieldWrapper>

                <FormFieldWrapper label="Company Name" error={errors.name}>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    placeholder="Apple Inc."
                  />
                </FormFieldWrapper>

                <div className="grid grid-cols-2 gap-4">
                  <FormFieldWrapper label="Shares" error={errors.shares}>
                    <Input
                      id="shares"
                      type="number"
                      step="0.001"
                      value={formData.shares}
                      onChange={(e) => updateField('shares', e.target.value)}
                      placeholder="10"
                    />
                  </FormFieldWrapper>

                  <FormFieldWrapper label="Category" error={errors.category}>
                    <Select value={formData.category} onValueChange={(value) => updateField('category', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(INVESTMENT_CATEGORY_CONFIG).map(([key, config]) => (
                          <SelectItem key={key} value={key}>
                            {config.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormFieldWrapper>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormFieldWrapper label="Purchase Price" error={errors.purchasePrice}>
                    <Input
                      id="purchasePrice"
                      type="number"
                      step="0.01"
                      value={formData.purchasePrice}
                      onChange={(e) => updateField('purchasePrice', e.target.value)}
                      placeholder="150.00"
                    />
                  </FormFieldWrapper>

                  <FormFieldWrapper label="Current Price" error={errors.currentPrice}>
                    <Input
                      id="currentPrice"
                      type="number"
                      step="0.01"
                      value={formData.currentPrice}
                      onChange={(e) => updateField('currentPrice', e.target.value)}
                      placeholder="175.00"
                    />
                  </FormFieldWrapper>
                </div>

                <FormFieldWrapper label="Platform" error={errors.platform}>
                  <Input
                    id="platform"
                    value={formData.platform}
                    onChange={(e) => updateField('platform', e.target.value)}
                    placeholder="Robinhood, E*TRADE, etc."
                  />
                </FormFieldWrapper>

                <FormFieldWrapper label="Notes (Optional)" error={errors.notes}>
                  <Input
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => updateField('notes', e.target.value)}
                    placeholder="Additional notes..."
                  />
                </FormFieldWrapper>

                <Button type="submit" className="w-full">
                  {editingInvestment ? 'Update Investment' : 'Add Investment'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Portfolio Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${portfolio.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Gain/Loss</CardTitle>
              {portfolio.totalGainLoss >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${portfolio.totalGainLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                ${portfolio.totalGainLoss.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <p className={`text-xs ${portfolio.totalGainLossPercentage >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {portfolio.totalGainLossPercentage >= 0 ? '+' : ''}
                {portfolio.totalGainLossPercentage.toFixed(2)}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Holdings</CardTitle>
              <PieChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{investments.length}</div>
              <p className="text-xs text-muted-foreground">
                Active positions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Best Performer</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {investments.length > 0 ? (
                <div>
                  <div className="text-2xl font-bold">
                    {investments.reduce((best, inv) => {
                      const gainLoss = ((inv.currentPrice - inv.purchasePrice) / inv.purchasePrice) * 100;
                      const bestGainLoss = ((best.currentPrice - best.purchasePrice) / best.purchasePrice) * 100;
                      return gainLoss > bestGainLoss ? inv : best;
                    }).symbol}
                  </div>
                  <p className="text-xs text-green-500">
                    +{(((investments.reduce((best, inv) => {
                      const gainLoss = ((inv.currentPrice - inv.purchasePrice) / inv.purchasePrice) * 100;
                      const bestGainLoss = ((best.currentPrice - best.purchasePrice) / best.purchasePrice) * 100;
                      return gainLoss > bestGainLoss ? inv : best;
                    }).currentPrice - investments.reduce((best, inv) => {
                      const gainLoss = ((inv.currentPrice - inv.purchasePrice) / inv.purchasePrice) * 100;
                      const bestGainLoss = ((best.currentPrice - best.purchasePrice) / best.purchasePrice) * 100;
                      return gainLoss > bestGainLoss ? inv : best;
                    }).purchasePrice) / investments.reduce((best, inv) => {
                      const gainLoss = ((inv.currentPrice - inv.purchasePrice) / inv.purchasePrice) * 100;
                      const bestGainLoss = ((best.currentPrice - best.purchasePrice) / best.purchasePrice) * 100;
                      return gainLoss > bestGainLoss ? inv : best;
                    }).purchasePrice) * 100).toFixed(2)}%
                  </p>
                </div>
              ) : (
                <div className="text-2xl font-bold">-</div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Holdings List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Holdings</CardTitle>
              </CardHeader>
              <CardContent>
                {investments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No investments added yet. Click "Add Investment" to get started.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {investments.map((investment) => {
                      const currentValue = investment.shares * investment.currentPrice;
                      const totalCost = investment.shares * investment.purchasePrice;
                      const gainLoss = currentValue - totalCost;
                      const gainLossPercentage = (gainLoss / totalCost) * 100;
                      const categoryConfig = INVESTMENT_CATEGORY_CONFIG[investment.category];

                      return (
                        <div key={investment.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-4">
                            <div className="p-2 rounded-lg bg-secondary">
                              <div className="w-4 h-4" style={{ color: categoryConfig.color }}>
                                {/* Icon would go here */}
                              </div>
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold">{investment.symbol}</h3>
                                <Badge variant="outline">{categoryConfig.label}</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">{investment.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {investment.shares} shares @ ${investment.currentPrice}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">
                              ${currentValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </div>
                            <div className={`text-sm ${gainLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                              {gainLoss >= 0 ? '+' : ''}${gainLoss.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              ({gainLoss >= 0 ? '+' : ''}{gainLossPercentage.toFixed(2)}%)
                            </div>
                            <div className="flex gap-2 mt-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEdit(investment)}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDelete(investment.id)}
                              >
                                <Trash2 className="h-3 w-3" />
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

          {/* Asset Allocation */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Asset Allocation</CardTitle>
              </CardHeader>
              <CardContent>
                {assetAllocation.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Add investments to see allocation
                  </div>
                ) : (
                  <div className="space-y-4">
                    {assetAllocation.map((allocation) => {
                      const categoryConfig = INVESTMENT_CATEGORY_CONFIG[allocation.category];
                      return (
                        <div key={allocation.category}>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium">{categoryConfig.label}</span>
                            <span className="text-sm text-muted-foreground">
                              {allocation.percentage.toFixed(1)}%
                            </span>
                          </div>
                          <Progress value={allocation.percentage} className="h-2" />
                          <div className="text-xs text-muted-foreground mt-1">
                            ${allocation.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
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
      </div>
    </div>
  );
};

export default InvestmentTracking;