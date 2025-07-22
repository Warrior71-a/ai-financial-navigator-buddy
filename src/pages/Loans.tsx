import React from 'react';
import { Plus, Building2, Car, User, GraduationCap, Briefcase, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { DataCard } from '@/components/DataCard';
import { useFormHandler } from '@/hooks/useFormHandler';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loan, LoanType } from '@/types/finance';
import { useToast } from '@/hooks/use-toast';

const loanTypeIcons = {
  mortgage: Building2,
  auto: Car,
  personal: User,
  student: GraduationCap,
  business: Briefcase,
  other: MoreHorizontal,
};

const loanTypeColors = {
  mortgage: "bg-blue-500",
  auto: "bg-green-500",
  personal: "bg-purple-500",
  student: "bg-orange-500",
  business: "bg-red-500",
  other: "bg-gray-500",
};

const Loans = () => {
  const [loans, setLoans] = React.useState<Loan[]>(() => {
    const saved = localStorage.getItem('loans');
    return saved ? JSON.parse(saved) : [];
  });
  const { toast } = useToast();

  const initialFormData = {
    name: "",
    lender: "",
    loanType: "" as LoanType,
    originalAmount: "",
    currentBalance: "",
    interestRate: "",
    monthlyPayment: "",
    term: "",
    remainingTerm: "",
    dueDate: "",
    nextDueDate: "",
  };

  const handleSubmit = async (formData: typeof initialFormData, isEditing: boolean) => {
    if (!formData.loanType) {
      toast({
        title: "Error",
        description: "Please select a loan type",
        variant: "destructive"
      });
      return;
    }

    const loanData: Loan = {
      id: isEditing && editingItem ? (editingItem as any).id : crypto.randomUUID(),
      name: formData.name,
      lender: formData.lender,
      loanType: formData.loanType,
      originalAmount: parseFloat(formData.originalAmount),
      currentBalance: parseFloat(formData.currentBalance),
      interestRate: parseFloat(formData.interestRate),
      monthlyPayment: parseFloat(formData.monthlyPayment),
      term: parseInt(formData.term),
      remainingTerm: parseInt(formData.remainingTerm),
      dueDate: new Date(),
      nextDueDate: new Date(),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    let updatedLoans;
    if (isEditing && editingItem) {
      updatedLoans = loans.map(loan => 
        loan.id === (editingItem as any).id ? loanData : loan
      );
      toast({
        title: "Loan Updated",
        description: "The loan has been updated successfully.",
      });
    } else {
      updatedLoans = [...loans, loanData];
      toast({
        title: "Loan Added",
        description: "The new loan has been added successfully.",
      });
    }

    setLoans(updatedLoans);
    localStorage.setItem('loans', JSON.stringify(updatedLoans));
    
    // Dispatch event for FinanceContext
    window.dispatchEvent(new CustomEvent('loansUpdated', { detail: updatedLoans }));
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

  const handleDelete = (id: string) => {
    const updatedLoans = loans.filter(loan => loan.id !== id);
    setLoans(updatedLoans);
    localStorage.setItem('loans', JSON.stringify(updatedLoans));
    window.dispatchEvent(new CustomEvent('loansUpdated', { detail: updatedLoans }));
    
    toast({
      title: "Loan Deleted",
      description: "The loan has been removed successfully.",
    });
  };

  const calculateProgress = (original: number, current: number) => {
    return ((original - current) / original) * 100;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const totalDebt = loans.reduce((sum, loan) => sum + loan.currentBalance, 0);
  const totalMonthlyPayments = loans.reduce((sum, loan) => sum + loan.monthlyPayment, 0);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <PageHeader
        title="Loans"
        description="Manage your loans and track payoff progress"
        icon={Building2}
        actions={
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="mr-2 h-4 w-4" />
                Add Loan
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{editingItem ? "Edit Loan" : "Add New Loan"}</DialogTitle>
                <DialogDescription>
                  {editingItem ? "Update your loan information." : "Add a new loan to track."}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={onSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Loan Name *</Label>
                    <Input
                      id="name"
                      placeholder="e.g., Home Mortgage"
                      value={formData.name}
                      onChange={(e) => updateFormData({ name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lender">Lender *</Label>
                    <Input
                      id="lender"
                      placeholder="e.g., Bank of America"
                      value={formData.lender}
                      onChange={(e) => updateFormData({ lender: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="loanType">Loan Type *</Label>
                  <Select value={formData.loanType} onValueChange={(value: LoanType) => updateFormData({ loanType: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select loan type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mortgage">Mortgage</SelectItem>
                      <SelectItem value="auto">Auto Loan</SelectItem>
                      <SelectItem value="personal">Personal Loan</SelectItem>
                      <SelectItem value="student">Student Loan</SelectItem>
                      <SelectItem value="business">Business Loan</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="originalAmount">Original Amount *</Label>
                    <Input
                      id="originalAmount"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.originalAmount}
                      onChange={(e) => updateFormData({ originalAmount: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currentBalance">Current Balance *</Label>
                    <Input
                      id="currentBalance"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.currentBalance}
                      onChange={(e) => updateFormData({ currentBalance: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="interestRate">Interest Rate (%) *</Label>
                    <Input
                      id="interestRate"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.interestRate}
                      onChange={(e) => updateFormData({ interestRate: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="monthlyPayment">Monthly Payment *</Label>
                    <Input
                      id="monthlyPayment"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.monthlyPayment}
                      onChange={(e) => updateFormData({ monthlyPayment: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="term">Term (months) *</Label>
                    <Input
                      id="term"
                      type="number"
                      placeholder="360"
                      value={formData.term}
                      onChange={(e) => updateFormData({ term: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="remainingTerm">Remaining Term (months) *</Label>
                    <Input
                      id="remainingTerm"
                      type="number"
                      placeholder="300"
                      value={formData.remainingTerm}
                      onChange={(e) => updateFormData({ remainingTerm: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full">
                  {editingItem ? "Update Loan" : "Add Loan"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <DataCard
          title="Total Debt"
          value={formatCurrency(totalDebt)}
          icon={Building2}
        />
        <DataCard
          title="Monthly Payments"
          value={formatCurrency(totalMonthlyPayments)}
        />
        <DataCard
          title="Active Loans"
          value={loans.length}
        />
      </div>

      <div className="grid gap-6">
        {loans.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No loans tracked yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Start by adding your first loan to track your debt and payoff progress.
              </p>
            </CardContent>
          </Card>
        ) : (
          loans.map((loan) => {
            const IconComponent = loanTypeIcons[loan.loanType];
            const progress = calculateProgress(loan.originalAmount, loan.currentBalance);

            return (
              <Card key={loan.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${loanTypeColors[loan.loanType]} text-white`}>
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{loan.name}</CardTitle>
                        <CardDescription>{loan.lender}</CardDescription>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleEdit({
                          name: loan.name,
                          lender: loan.lender,
                          loanType: loan.loanType,
                          originalAmount: loan.originalAmount.toString(),
                          currentBalance: loan.currentBalance.toString(),
                          interestRate: loan.interestRate.toString(),
                          monthlyPayment: loan.monthlyPayment.toString(),
                          term: loan.term.toString(),
                          remainingTerm: loan.remainingTerm.toString(),
                        } as any)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleDelete(loan.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Current Balance</p>
                      <p className="text-lg font-semibold text-red-600">{formatCurrency(loan.currentBalance)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Monthly Payment</p>
                      <p className="text-lg font-semibold">{formatCurrency(loan.monthlyPayment)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Interest Rate</p>
                      <p className="text-lg font-semibold">{loan.interestRate}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Remaining Term</p>
                      <p className="text-lg font-semibold">{loan.remainingTerm} months</p>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-muted-foreground">Payoff Progress</span>
                      <span className="text-sm font-medium">{progress.toFixed(1)}% paid off</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <Badge variant="outline" className="capitalize">
                      {loan.loanType.replace('-', ' ')}
                    </Badge>
                    <span>Original: {formatCurrency(loan.originalAmount)}</span>
                    <span>Paid: {formatCurrency(loan.originalAmount - loan.currentBalance)}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Loans;