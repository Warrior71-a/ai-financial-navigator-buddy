import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CreditCard, Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface CreditCard {
  id: string;
  name: string;
  bank: string;
  currentBalance: number;
  creditLimit: number;
  interestRate: number;
  dueDate: string;
  minimumPayment: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const CreditCards = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<CreditCard | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    bank: '',
    currentBalance: '',
    creditLimit: '',
    interestRate: '',
    dueDate: '',
    minimumPayment: ''
  });

  useEffect(() => {
    if (user?.id) {
      loadCreditCards();
    }
  }, [user?.id]);

  const loadCreditCards = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('credit_cards')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading credit cards:', error);
        toast({
          title: "Error",
          description: "Failed to load credit cards",
          variant: "destructive",
        });
        return;
      }

      const formattedCards: CreditCard[] = data.map(card => ({
        id: card.id,
        name: card.name,
        bank: card.bank,
        currentBalance: Number(card.current_balance),
        creditLimit: Number(card.credit_limit),
        interestRate: Number(card.interest_rate),
        dueDate: card.due_date,
        minimumPayment: Number(card.minimum_payment),
        isActive: card.is_active,
        createdAt: card.created_at,
        updatedAt: card.updated_at
      }));

      setCreditCards(formattedCards);
    } catch (error) {
      console.error('Error in loadCreditCards:', error);
      toast({
        title: "Error",
        description: "Failed to load credit cards",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      bank: '',
      currentBalance: '',
      creditLimit: '',
      interestRate: '',
      dueDate: '',
      minimumPayment: ''
    });
    setEditingCard(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    if (!formData.name || !formData.bank || !formData.creditLimit) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const cardData = {
        user_id: user.id,
        name: formData.name,
        bank: formData.bank,
        current_balance: Number(formData.currentBalance) || 0,
        credit_limit: Number(formData.creditLimit),
        interest_rate: Number(formData.interestRate) || 0,
        due_date: formData.dueDate || new Date().toISOString().split('T')[0],
        minimum_payment: Number(formData.minimumPayment) || 0,
        is_active: true
      };

      if (editingCard) {
        const { error } = await supabase
          .from('credit_cards')
          .update(cardData)
          .eq('id', editingCard.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Credit card updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('credit_cards')
          .insert([cardData]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Credit card added successfully",
        });
      }

      setIsDialogOpen(false);
      resetForm();
      loadCreditCards();
    } catch (error) {
      console.error('Error saving credit card:', error);
      toast({
        title: "Error",
        description: "Failed to save credit card",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (card: CreditCard) => {
    setEditingCard(card);
    setFormData({
      name: card.name,
      bank: card.bank,
      currentBalance: card.currentBalance.toString(),
      creditLimit: card.creditLimit.toString(),
      interestRate: card.interestRate.toString(),
      dueDate: card.dueDate,
      minimumPayment: card.minimumPayment.toString()
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('credit_cards')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Credit card deleted successfully",
      });
      loadCreditCards();
    } catch (error) {
      console.error('Error deleting credit card:', error);
      toast({
        title: "Error",
        description: "Failed to delete credit card",
        variant: "destructive",
      });
    }
  };

  const getUtilizationColor = (utilization: number) => {
    if (utilization <= 30) return 'bg-green-500';
    if (utilization <= 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const totalCreditLimit = creditCards.reduce((sum, card) => sum + card.creditLimit, 0);
  const totalBalance = creditCards.reduce((sum, card) => sum + card.currentBalance, 0);
  const totalUtilization = totalCreditLimit > 0 ? (totalBalance / totalCreditLimit) * 100 : 0;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <Link to="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Dashboard
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Credit Limit</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalCreditLimit.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalBalance.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Credit Utilization</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUtilization.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {totalUtilization <= 30 ? 'Good utilization' : totalUtilization <= 70 ? 'Fair utilization' : 'High utilization'}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Credit Cards</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Credit Card
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingCard ? 'Edit Credit Card' : 'Add New Credit Card'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Card Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g., Chase Freedom"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="bank">Bank *</Label>
                  <Input
                    id="bank"
                    value={formData.bank}
                    onChange={(e) => setFormData({...formData, bank: e.target.value})}
                    placeholder="e.g., Chase"
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="currentBalance">Current Balance</Label>
                  <Input
                    id="currentBalance"
                    type="number"
                    step="0.01"
                    value={formData.currentBalance}
                    onChange={(e) => setFormData({...formData, currentBalance: e.target.value})}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="creditLimit">Credit Limit *</Label>
                  <Input
                    id="creditLimit"
                    type="number"
                    step="0.01"
                    value={formData.creditLimit}
                    onChange={(e) => setFormData({...formData, creditLimit: e.target.value})}
                    placeholder="5000.00"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="interestRate">Interest Rate (%)</Label>
                  <Input
                    id="interestRate"
                    type="number"
                    step="0.01"
                    value={formData.interestRate}
                    onChange={(e) => setFormData({...formData, interestRate: e.target.value})}
                    placeholder="18.99"
                  />
                </div>
                <div>
                  <Label htmlFor="minimumPayment">Minimum Payment</Label>
                  <Input
                    id="minimumPayment"
                    type="number"
                    step="0.01"
                    value={formData.minimumPayment}
                    onChange={(e) => setFormData({...formData, minimumPayment: e.target.value})}
                    placeholder="25.00"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingCard ? 'Update' : 'Add'} Credit Card
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {creditCards.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <CreditCard className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Credit Cards Found</h3>
            <p className="text-muted-foreground mb-4">Add your first credit card to start tracking your credit utilization.</p>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Credit Card
                </Button>
              </DialogTrigger>
            </Dialog>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {creditCards.map((card) => {
            const utilization = card.creditLimit > 0 ? (card.currentBalance / card.creditLimit) * 100 : 0;
            return (
              <Card key={card.id} className="relative">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{card.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{card.bank}</p>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(card)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDelete(card.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Balance:</span>
                      <span className="font-semibold">${card.currentBalance.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Limit:</span>
                      <span className="font-semibold">${card.creditLimit.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Available:</span>
                      <span className="font-semibold text-green-600">
                        ${(card.creditLimit - card.currentBalance).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Utilization:</span>
                      <Badge variant="secondary" className={`text-white ${getUtilizationColor(utilization)}`}>
                        {utilization.toFixed(1)}%
                      </Badge>
                    </div>
                    {card.interestRate > 0 && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">APR:</span>
                        <span className="font-semibold">{card.interestRate}%</span>
                      </div>
                    )}
                    {card.minimumPayment > 0 && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Min Payment:</span>
                        <span className="font-semibold">${card.minimumPayment}</span>
                      </div>
                    )}
                    {card.dueDate && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Due Date:</span>
                        <span className="font-semibold">{new Date(card.dueDate).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CreditCards;