import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, AlertCircle, PieChart } from "lucide-react";

interface SpendingCategory {
  name: string;
  amount: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
  budget: number;
}

interface SpendingAnalyticsProps {
  totalExpenses: number;
  monthlyIncome: number;
}

export const SpendingAnalytics = ({ totalExpenses, monthlyIncome }: SpendingAnalyticsProps) => {
  const [categories, setCategories] = useState<SpendingCategory[]>([]);
  const [insights, setInsights] = useState<string[]>([]);

  useEffect(() => {
    // Simulate spending data analysis
    const mockCategories: SpendingCategory[] = [
      {
        name: "Housing",
        amount: totalExpenses * 0.35,
        percentage: 35,
        trend: 'stable',
        budget: monthlyIncome * 0.30
      },
      {
        name: "Food & Dining",
        amount: totalExpenses * 0.18,
        percentage: 18,
        trend: 'up',
        budget: monthlyIncome * 0.15
      },
      {
        name: "Transportation",
        amount: totalExpenses * 0.15,
        percentage: 15,
        trend: 'down',
        budget: monthlyIncome * 0.15
      },
      {
        name: "Entertainment",
        amount: totalExpenses * 0.12,
        percentage: 12,
        trend: 'up',
        budget: monthlyIncome * 0.08
      },
      {
        name: "Utilities",
        amount: totalExpenses * 0.10,
        percentage: 10,
        trend: 'stable',
        budget: monthlyIncome * 0.10
      },
      {
        name: "Shopping",
        amount: totalExpenses * 0.10,
        percentage: 10,
        trend: 'up',
        budget: monthlyIncome * 0.05
      }
    ];

    setCategories(mockCategories);

    // Generate AI insights
    const aiInsights = [
      "Food spending is 20% above your budget - consider meal planning",
      "Entertainment costs increased 15% this month - review subscriptions",
      "You're saving 8% on transportation - great job!",
      "Housing costs are within healthy range (30% of income)"
    ];

    setInsights(aiInsights);
  }, [totalExpenses, monthlyIncome]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-red-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-green-500" />;
      default:
        return <div className="h-4 w-4 rounded-full bg-gray-400" />;
    }
  };

  const getBudgetStatus = (spent: number, budget: number) => {
    const percentage = (spent / budget) * 100;
    if (percentage > 100) return { color: 'text-red-600', status: 'Over Budget' };
    if (percentage > 80) return { color: 'text-orange-600', status: 'Near Budget' };
    return { color: 'text-green-600', status: 'On Track' };
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <PieChart className="h-5 w-5 text-primary" />
          <span>Spending Analytics</span>
        </CardTitle>
        <CardDescription>
          AI-powered analysis of your spending patterns and trends
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* AI Insights */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Smart Insights</h4>
          {insights.map((insight, index) => (
            <div key={index} className="flex items-start space-x-2 p-3 bg-muted/50 rounded-lg">
              <AlertCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <p className="text-sm text-muted-foreground">{insight}</p>
            </div>
          ))}
        </div>

        {/* Category Breakdown */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm">Category Breakdown</h4>
          {categories.map((category, index) => {
            const budgetStatus = getBudgetStatus(category.amount, category.budget);
            const spentPercentage = Math.min((category.amount / category.budget) * 100, 100);
            
            return (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">{category.name}</span>
                    {getTrendIcon(category.trend)}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className={budgetStatus.color}>
                      {budgetStatus.status}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {formatCurrency(category.amount)}
                    </span>
                  </div>
                </div>
                <div className="space-y-1">
                  <Progress value={spentPercentage} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{formatCurrency(category.amount)} spent</span>
                    <span>{formatCurrency(category.budget)} budgeted</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};