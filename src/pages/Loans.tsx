import { useState } from "react";
import { Plus, Edit, Trash2, Building2, Car, User, GraduationCap, Briefcase, MoreHorizontal, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loan, LoanType } from "@/types/finance";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

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
  const [loans, setLoans] = useState<Loan[]>(() => {
    const saved = localStorage.getItem('loans');
    return saved ? JSON.parse(saved) : [];
  });

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLoan, setEditingLoan] = useState<Loan | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    lender: "",
    loanType: "" as LoanType,
    originalAmount: "",
    currentBalance: "",
    interestRate: "",
    monthlyPayment: "",
    term: "",
    remainingTerm: "",
  });

  const { toast } = useToast();

  const resetForm = () => {
    setFormData({
      name: "",
      lender: "",
      loanType: "" as LoanType,
      originalAmount: "",
      currentBalance: "",
      interestRate: "",
      monthlyPayment: "",
      term: "",
      remainingTerm: "",
    });
    setEditingLoan(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.lender || !formData.loanType || !formData.originalAmount || !formData.currentBalance || !formData.monthlyPayment) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const loanData: Loan = {
      id: editingLoan?.id || Date.now().toString(),
      name: formData.name,
      lender: formData.lender,
      loanType: formData.loanType,
      originalAmount: parseFloat(formData.originalAmount),
      currentBalance: parseFloat(formData.currentBalance),
      interestRate: parseFloat(formData.interestRate) || 0,
      monthlyPayment: parseFloat(formData.monthlyPayment),
      term: parseInt(formData.term) || 0,
      remainingTerm: parseInt(formData.remainingTerm) || 0,
      dueDate: editingLoan?.dueDate || new Date(),
      nextDueDate: editingLoan?.nextDueDate || new Date(),
      isActive: true,
      createdAt: editingLoan?.createdAt || new Date(),
      updatedAt: new Date(),
    };

    let updatedLoans;
    if (editingLoan) {
      updatedLoans = loans.map(loan => loan.id === editingLoan.id ? loanData : loan);
      setLoans(updatedLoans);
      toast({
        title: "Loan Updated",
        description: "Your loan has been updated successfully.",
      });
    } else {
      updatedLoans = [...loans, loanData];
      setLoans(updatedLoans);
      toast({
        title: "Loan Added",
        description: "Your new loan has been added successfully.",
      });
    }
    localStorage.setItem('loans', JSON.stringify(updatedLoans));
    
    // Trigger custom event for FinanceContext to update
    window.dispatchEvent(new Event('loansUpdated'));

    setIsDialogOpen(false);
    resetForm();
  };

  const handleEdit = (loan: Loan) => {
    setEditingLoan(loan);
    setFormData({
      name: loan.name,
      lender: loan.lender,
      loanType: loan.loanType,
      originalAmount: loan.originalAmount.toString(),
      currentBalance: loan.currentBalance.toString(),
      interestRate: loan.interestRate.toString(),
      monthlyPayment: loan.monthlyPayment.toString(),
      term: loan.term.toString(),
      remainingTerm: loan.remainingTerm.toString(),
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    const updatedLoans = loans.filter(loan => loan.id !== id);
    setLoans(updatedLoans);
    localStorage.setItem('loans', JSON.stringify(updatedLoans));
    
    // Trigger custom event for FinanceContext to update
    window.dispatchEvent(new Event('loansUpdated'));
    
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Loans</h1>
            <p className="text-muted-foreground">Manage your loans and track payoff progress</p>
          </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Add Loan
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingLoan ? "Edit Loan" : "Add New Loan"}</DialogTitle>
              <DialogDescription>
                {editingLoan ? "Update your loan information." : "Add a new loan to track."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Loan Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Home Mortgage"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lender">Lender *</Label>
                  <Input
                    id="lender"
                    value={formData.lender}
                    onChange={(e) => setFormData({ ...formData, lender: e.target.value })}
                    placeholder="e.g., Chase Bank"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="loanType">Loan Type *</Label>
                <Select value={formData.loanType} onValueChange={(value: LoanType) => setFormData({ ...formData, loanType: value })}>
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
                    value={formData.originalAmount}
                    onChange={(e) => setFormData({ ...formData, originalAmount: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currentBalance">Current Balance *</Label>
                  <Input
                    id="currentBalance"
                    type="number"
                    step="0.01"
                    value={formData.currentBalance}
                    onChange={(e) => setFormData({ ...formData, currentBalance: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="interestRate">Interest Rate (%)</Label>
                  <Input
                    id="interestRate"
                    type="number"
                    step="0.01"
                    value={formData.interestRate}
                    onChange={(e) => setFormData({ ...formData, interestRate: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="monthlyPayment">Monthly Payment *</Label>
                  <Input
                    id="monthlyPayment"
                    type="number"
                    step="0.01"
                    value={formData.monthlyPayment}
                    onChange={(e) => setFormData({ ...formData, monthlyPayment: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="term">Term (months)</Label>
                  <Input
                    id="term"
                    type="number"
                    value={formData.term}
                    onChange={(e) => setFormData({ ...formData, term: e.target.value })}
                    placeholder="360"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="remainingTerm">Remaining Term (months)</Label>
                  <Input
                    id="remainingTerm"
                    type="number"
                    value={formData.remainingTerm}
                    onChange={(e) => setFormData({ ...formData, remainingTerm: e.target.value })}
                    placeholder="285"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingLoan ? "Update Loan" : "Add Loan"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Debt</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalDebt)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalMonthlyPayments)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Loans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loans.filter(loan => loan.isActive).length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Loans List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loans.map((loan) => {
          const Icon = loanTypeIcons[loan.loanType];
          const progress = calculateProgress(loan.originalAmount, loan.currentBalance);
          
          return (
            <Card key={loan.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`p-2 rounded-lg ${loanTypeColors[loan.loanType]}`}>
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{loan.name}</CardTitle>
                      <CardDescription>{loan.lender}</CardDescription>
                    </div>
                  </div>
                  <Badge variant="secondary" className="capitalize">
                    {loan.loanType}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Payoff Progress</span>
                    <span>{progress.toFixed(1)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Current Balance</p>
                    <p className="font-semibold">{formatCurrency(loan.currentBalance)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Monthly Payment</p>
                    <p className="font-semibold">{formatCurrency(loan.monthlyPayment)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Interest Rate</p>
                    <p className="font-semibold">{loan.interestRate}%</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Remaining Term</p>
                    <p className="font-semibold">{loan.remainingTerm} months</p>
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(loan)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(loan.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {loans.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <p className="text-muted-foreground mb-4">No loans added yet</p>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Loan
                </Button>
              </DialogTrigger>
            </Dialog>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Loans;