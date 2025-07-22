import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Trash2, Edit, Plus, CreditCard as CreditCardIcon, ArrowLeft } from "lucide-react";
import { CreditCard, STORAGE_KEYS } from "@/types/finance";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

const CreditCards = () => {
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<CreditCard | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState<{
    name: string;
    bank: string;
    currentBalance: string;
    creditLimit: string;
    interestRate: string;
    minimumPayment: string;
    dueDate: string;
    cardType: 'visa' | 'mastercard' | 'amex' | 'discover' | 'other';
    isActive: boolean;
  }>({
    name: "",
    bank: "",
    currentBalance: "",
    creditLimit: "",
    interestRate: "",
    minimumPayment: "",
    dueDate: "",
    cardType: "visa",
    isActive: true,
  });

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.CREDIT_CARDS);
    if (stored) {
      const cards = JSON.parse(stored).map((card: any) => ({
        ...card,
        dueDate: new Date(card.dueDate),
        nextDueDate: new Date(card.nextDueDate),
        createdAt: new Date(card.createdAt),
        updatedAt: new Date(card.updatedAt),
      }));
      setCreditCards(cards);
    }
  }, []);

  const saveToLocalStorage = (cards: CreditCard[]) => {
    localStorage.setItem(STORAGE_KEYS.CREDIT_CARDS, JSON.stringify(cards));
  };

  const resetForm = () => {
    setFormData({
      name: "",
      bank: "",
      currentBalance: "",
      creditLimit: "",
      interestRate: "",
      minimumPayment: "",
      dueDate: "",
      cardType: "visa",
      isActive: true,
    });
    setEditingCard(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.bank || !formData.creditLimit) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const cardData = {
      ...formData,
      currentBalance: parseFloat(formData.currentBalance) || 0,
      creditLimit: parseFloat(formData.creditLimit),
      interestRate: parseFloat(formData.interestRate) || 0,
      minimumPayment: parseFloat(formData.minimumPayment) || 0,
    };

    if (editingCard) {
      const updatedCards = creditCards.map(card =>
        card.id === editingCard.id ? { 
          ...cardData, 
          id: editingCard.id,
          dueDate: new Date(formData.dueDate || new Date()),
          nextDueDate: new Date(formData.dueDate || new Date()),
          createdAt: editingCard.createdAt,
          updatedAt: new Date(),
        } : card
      );
      setCreditCards(updatedCards);
      saveToLocalStorage(updatedCards);
      toast({
        title: "Success",
        description: "Credit card updated successfully",
      });
    } else {
      const newCard: CreditCard = {
        ...cardData,
        id: Date.now().toString(),
        dueDate: new Date(formData.dueDate || new Date()),
        nextDueDate: new Date(formData.dueDate || new Date()),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const updatedCards = [...creditCards, newCard];
      setCreditCards(updatedCards);
      saveToLocalStorage(updatedCards);
      toast({
        title: "Success",
        description: "Credit card added successfully",
      });
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const handleEdit = (card: CreditCard) => {
    setFormData({
      name: card.name,
      bank: card.bank,
      currentBalance: card.currentBalance.toString(),
      creditLimit: card.creditLimit.toString(),
      interestRate: card.interestRate.toString(),
      minimumPayment: card.minimumPayment.toString(),
      dueDate: card.dueDate.toISOString().split('T')[0],
      cardType: card.cardType,
      isActive: card.isActive,
    });
    setEditingCard(card);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    const updatedCards = creditCards.filter(card => card.id !== id);
    setCreditCards(updatedCards);
    saveToLocalStorage(updatedCards);
    toast({
      title: "Success",
      description: "Credit card deleted successfully",
    });
  };

  const getUtilizationColor = (utilization: number) => {
    if (utilization >= 90) return "destructive";
    if (utilization >= 70) return "secondary";
    return "default";
  };

  const totalCreditLimit = creditCards.reduce((sum, card) => sum + card.creditLimit, 0);
  const totalBalance = creditCards.reduce((sum, card) => sum + card.currentBalance, 0);
  const totalUtilization = totalCreditLimit > 0 ? (totalBalance / totalCreditLimit) * 100 : 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <Link to="/">
            <Button variant="ghost" size="sm" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Credit Cards</h1>
            <p className="text-muted-foreground">Manage your credit cards and track balances</p>
          </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Add Credit Card
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingCard ? "Edit Credit Card" : "Add New Credit Card"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Card Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Chase Sapphire"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bank">Bank *</Label>
                  <Input
                    id="bank"
                    value={formData.bank}
                    onChange={(e) => setFormData({ ...formData, bank: e.target.value })}
                    placeholder="e.g., Chase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currentBalance">Current Balance</Label>
                  <Input
                    id="currentBalance"
                    type="number"
                    step="0.01"
                    value={formData.currentBalance}
                    onChange={(e) => setFormData({ ...formData, currentBalance: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="creditLimit">Credit Limit *</Label>
                  <Input
                    id="creditLimit"
                    type="number"
                    step="0.01"
                    value={formData.creditLimit}
                    onChange={(e) => setFormData({ ...formData, creditLimit: e.target.value })}
                    placeholder="5000.00"
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
                    placeholder="18.99"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minimumPayment">Minimum Payment</Label>
                  <Input
                    id="minimumPayment"
                    type="number"
                    step="0.01"
                    value={formData.minimumPayment}
                    onChange={(e) => setFormData({ ...formData, minimumPayment: e.target.value })}
                    placeholder="35.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cardType">Card Type</Label>
                  <Select value={formData.cardType} onValueChange={(value: "visa" | "mastercard" | "amex" | "discover" | "other") => setFormData({ ...formData, cardType: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="visa">Visa</SelectItem>
                      <SelectItem value="mastercard">Mastercard</SelectItem>
                      <SelectItem value="amex">American Express</SelectItem>
                      <SelectItem value="discover">Discover</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
                <Label htmlFor="isActive">Active Card</Label>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingCard ? "Update" : "Add"} Credit Card
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Credit Limit</CardTitle>
            <CreditCardIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalCreditLimit.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
            <CreditCardIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalBalance.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Credit Utilization</CardTitle>
            <CreditCardIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUtilization.toFixed(1)}%</div>
            <Badge variant={getUtilizationColor(totalUtilization)} className="mt-1">
              {totalUtilization < 30 ? "Excellent" : totalUtilization < 70 ? "Good" : "High"}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Credit Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {creditCards.map((card) => {
          const utilization = card.creditLimit > 0 ? (card.currentBalance / card.creditLimit) * 100 : 0;
          
          return (
            <Card key={card.id} className={`${!card.isActive ? 'opacity-60' : ''}`}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{card.name}</CardTitle>
                    <CardDescription>{card.bank}</CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(card)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(card.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Balance:</span>
                    <span className="font-medium">${card.currentBalance.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Limit:</span>
                    <span className="font-medium">${card.creditLimit.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Utilization:</span>
                    <Badge variant={getUtilizationColor(utilization)} className="text-xs">
                      {utilization.toFixed(1)}%
                    </Badge>
                  </div>
                </div>

                {card.interestRate > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>APR:</span>
                    <span className="font-medium">{card.interestRate}%</span>
                  </div>
                )}

                {card.minimumPayment > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Min Payment:</span>
                    <span className="font-medium">${card.minimumPayment}</span>
                  </div>
                )}

                <div className="flex justify-between text-sm">
                  <span>Due Date:</span>
                  <span className="font-medium">{card.dueDate.toLocaleDateString()}</span>
                </div>

                <div className="flex justify-between items-center">
                  <Badge variant="secondary">
                    {card.cardType.toUpperCase()}
                  </Badge>
                  <Badge variant={card.isActive ? 'default' : 'outline'}>
                    {card.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {creditCards.length === 0 && (
        <Card className="text-center py-8">
          <CardContent>
            <CreditCardIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Credit Cards</h3>
            <p className="text-muted-foreground mb-4">
              Start by adding your first credit card to track balances and utilization.
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Credit Card
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CreditCards;