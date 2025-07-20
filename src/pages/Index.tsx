import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, TrendingUp, TrendingDown, CreditCard, Building2, DollarSign, PiggyBank, AlertTriangle, Share2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { FinancialAIAdvisor } from "@/components/FinancialAIAdvisor";
import { SpendingAnalytics } from "@/components/SpendingAnalytics";
import { PredictiveAnalytics } from "@/components/PredictiveAnalytics";
import { SmartAlerts } from "@/components/SmartAlerts";
import { FinancialHealthScore } from "@/components/FinancialHealthScore";

const Index = () => {
  // Mock data - in a real app this would come from your data store
  const [financialData] = useState({
    totalIncome: 8500,
    totalExpenses: 6200,
    totalDebt: 297500,
    totalCreditLimit: 25000,
    creditUtilization: 32,
    netWorth: 15300,
    monthlyPayments: 2065,
    emergencyFund: 12000,
    emergencyFundGoal: 18000,
  });

  const recentTransactions = [
    { id: 1, type: "income", description: "Salary - Tech Corp", amount: 5000, date: "2024-07-01" },
    { id: 2, type: "expense", description: "Rent Payment", amount: -1800, date: "2024-07-01" },
    { id: 3, type: "expense", description: "Groceries", amount: -320, date: "2024-06-30" },
    { id: 4, type: "expense", description: "Utilities", amount: -180, date: "2024-06-29" },
  ];

  const quickActions = [
    { title: "Add Income", icon: TrendingUp, color: "bg-green-500", link: "/income" },
    { title: "Add Expense", icon: TrendingDown, color: "bg-red-500", link: "/expenses" },
    { title: "Manage Cards", icon: CreditCard, color: "bg-blue-500", link: "/credit-cards" },
    { title: "Track Loans", icon: Building2, color: "bg-purple-500", link: "/loans" },
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const emergencyFundProgress = (financialData.emergencyFund / financialData.emergencyFundGoal) * 100;
  const monthlyBalance = financialData.totalIncome - financialData.totalExpenses;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Financial Dashboard</h1>
              <p className="text-muted-foreground">Overview of your financial health</p>
            </div>
            <div className="flex items-center space-x-2">
              <Link to="/financial-snapshot">
                <Button variant="outline" size="sm" className="flex items-center space-x-2">
                  <Share2 className="h-4 w-4" />
                  <span>Share Snapshot</span>
                </Button>
              </Link>
              <Badge variant={monthlyBalance > 0 ? "default" : "destructive"}>
                {monthlyBalance > 0 ? "Surplus" : "Deficit"}: {formatCurrency(Math.abs(monthlyBalance))}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6 space-y-6">
        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Income</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(financialData.totalIncome)}</div>
              <p className="text-xs text-muted-foreground">
                Active income sources
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Expenses</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{formatCurrency(financialData.totalExpenses)}</div>
              <p className="text-xs text-muted-foreground">
                Total monthly spending
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Debt</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{formatCurrency(financialData.totalDebt)}</div>
              <p className="text-xs text-muted-foreground">
                Monthly payments: {formatCurrency(financialData.monthlyPayments)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Worth</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{formatCurrency(financialData.netWorth)}</div>
              <p className="text-xs text-muted-foreground">
                Assets minus liabilities
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Progress Tracking */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <PiggyBank className="h-5 w-5" />
                <span>Emergency Fund</span>
              </CardTitle>
              <CardDescription>
                {formatCurrency(financialData.emergencyFund)} of {formatCurrency(financialData.emergencyFundGoal)} goal
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Progress value={emergencyFundProgress} className="h-3" />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{emergencyFundProgress.toFixed(1)}% complete</span>
                <span>{formatCurrency(financialData.emergencyFundGoal - financialData.emergencyFund)} remaining</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CreditCard className="h-5 w-5" />
                <span>Credit Utilization</span>
              </CardTitle>
              <CardDescription>
                Using {financialData.creditUtilization}% of available credit
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Progress 
                value={financialData.creditUtilization} 
                className="h-3"
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{financialData.creditUtilization < 30 ? "Good" : "High"} utilization</span>
                <span>{formatCurrency(financialData.totalCreditLimit)} limit</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common financial tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {quickActions.map((action) => (
                <Link key={action.title} to={action.link}>
                  <Button 
                    variant="outline" 
                    className="w-full h-20 flex flex-col items-center justify-center space-y-2 hover:bg-muted/50"
                  >
                    <div className={`p-2 rounded-lg ${action.color}`}>
                      <action.icon className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-sm font-medium">{action.title}</span>
                  </Button>
                </Link>
              ))}
            </div>
            <div className="mt-4 text-center">
              <Link to="/navigation">
                <Button variant="outline" className="w-full md:w-auto">
                  Browse All Features
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest financial transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${
                      transaction.type === 'income' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                    }`}>
                      {transaction.type === 'income' ? (
                        <TrendingUp className="h-4 w-4" />
                      ) : (
                        <TrendingDown className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{transaction.description}</p>
                      <p className="text-sm text-muted-foreground">{transaction.date}</p>
                    </div>
                  </div>
                  <div className={`font-semibold ${
                    transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.amount > 0 ? '+' : ''}{formatCurrency(transaction.amount)}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 text-center">
              <Button variant="outline">View All Transactions</Button>
            </div>
          </CardContent>
        </Card>

        {/* AI & Analytics Section */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Financial Health Score */}
          <FinancialHealthScore 
            monthlyIncome={financialData.totalIncome}
            monthlyExpenses={financialData.totalExpenses}
            totalDebt={financialData.totalDebt}
            emergencyFund={financialData.emergencyFund}
            creditUtilization={financialData.creditUtilization}
            debtPayments={financialData.monthlyPayments}
          />

          {/* Smart Alerts */}
          <SmartAlerts 
            monthlyIncome={financialData.totalIncome}
            monthlyExpenses={financialData.totalExpenses}
            totalDebt={financialData.totalDebt}
            emergencyFund={financialData.emergencyFund}
            creditUtilization={financialData.creditUtilization}
          />

          {/* Spending Analytics */}
          <SpendingAnalytics 
            totalExpenses={financialData.totalExpenses}
            monthlyIncome={financialData.totalIncome}
          />

          {/* Predictive Analytics */}
          <PredictiveAnalytics 
            monthlyIncome={financialData.totalIncome}
            monthlyExpenses={financialData.totalExpenses}
            totalDebt={financialData.totalDebt}
            debtPayments={financialData.monthlyPayments}
            emergencyFund={financialData.emergencyFund}
          />
        </div>

        {/* AI Financial Advisor */}
        <FinancialAIAdvisor financialData={financialData} />

        {/* Financial Health Tips */}
        <Card>
          <CardHeader>
            <CardTitle>Financial Health Tips</CardTitle>
            <CardDescription>Recommendations based on your data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {financialData.creditUtilization > 30 && (
                <div className="flex items-start space-x-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-orange-800">High Credit Utilization</p>
                    <p className="text-sm text-orange-700">Consider paying down credit card balances to improve your credit score.</p>
                  </div>
                </div>
              )}
              
              {emergencyFundProgress < 100 && (
                <div className="flex items-start space-x-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <PiggyBank className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-800">Build Emergency Fund</p>
                    <p className="text-sm text-blue-700">Aim to save {formatCurrency(financialData.emergencyFundGoal - financialData.emergencyFund)} more for a complete emergency fund.</p>
                  </div>
                </div>
              )}

              {monthlyBalance > 1000 && (
                <div className="flex items-start space-x-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-800">Great Surplus!</p>
                    <p className="text-sm text-green-700">You have {formatCurrency(monthlyBalance)} surplus. Consider investing or boosting your emergency fund.</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;