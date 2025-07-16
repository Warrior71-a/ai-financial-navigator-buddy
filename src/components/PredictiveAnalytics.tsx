import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, Calendar, Target, AlertTriangle } from "lucide-react";

interface ForecastData {
  month: string;
  balance: number;
  debtRemaining: number;
  emergencyFund: number;
}

interface PredictiveAnalyticsProps {
  monthlyIncome: number;
  monthlyExpenses: number;
  totalDebt: number;
  debtPayments: number;
  emergencyFund: number;
}

export const PredictiveAnalytics = ({ 
  monthlyIncome, 
  monthlyExpenses, 
  totalDebt, 
  debtPayments,
  emergencyFund 
}: PredictiveAnalyticsProps) => {
  const [forecastData, setForecastData] = useState<ForecastData[]>([]);
  const [predictions, setPredictions] = useState<{
    debtFreeDate: string;
    emergencyGoalDate: string;
    financialStability: string;
    riskLevel: 'low' | 'medium' | 'high';
  } | null>(null);

  useEffect(() => {
    generateForecast();
  }, [monthlyIncome, monthlyExpenses, totalDebt, debtPayments, emergencyFund]);

  const generateForecast = () => {
    const monthlyBalance = monthlyIncome - monthlyExpenses;
    const months = ['Current', 'Month 1', 'Month 2', 'Month 3', 'Month 6', 'Month 12', 'Month 24'];
    
    const forecast: ForecastData[] = months.map((month, index) => {
      const monthsAhead = index;
      const projectedBalance = emergencyFund + (monthlyBalance * monthsAhead);
      const projectedDebt = Math.max(0, totalDebt - (debtPayments * monthsAhead));
      const projectedEmergencyFund = Math.min(
        emergencyFund + (monthlyBalance * 0.3 * monthsAhead), 
        monthlyExpenses * 6
      );

      return {
        month,
        balance: projectedBalance,
        debtRemaining: projectedDebt,
        emergencyFund: projectedEmergencyFund
      };
    });

    setForecastData(forecast);

    // Calculate predictions
    const monthsToDebtFree = totalDebt > 0 ? Math.ceil(totalDebt / debtPayments) : 0;
    const emergencyGoal = monthlyExpenses * 6;
    const monthsToEmergencyGoal = emergencyGoal > emergencyFund 
      ? Math.ceil((emergencyGoal - emergencyFund) / (monthlyBalance * 0.3)) 
      : 0;

    const riskLevel = monthlyBalance < 0 ? 'high' : 
                     monthlyBalance < monthlyExpenses * 0.2 ? 'medium' : 'low';

    setPredictions({
      debtFreeDate: monthsToDebtFree > 0 ? `${monthsToDebtFree} months` : 'Already debt-free',
      emergencyGoalDate: monthsToEmergencyGoal > 0 ? `${monthsToEmergencyGoal} months` : 'Goal achieved',
      financialStability: riskLevel === 'low' ? 'Excellent' : 
                         riskLevel === 'medium' ? 'Good' : 'Needs attention',
      riskLevel
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      case 'medium': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <span>Predictive Analytics</span>
        </CardTitle>
        <CardDescription>
          AI-powered forecasts of your financial future
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {predictions && (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Target className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-sm">Debt-Free Goal</span>
              </div>
              <p className="text-2xl font-bold text-primary">{predictions.debtFreeDate}</p>
              <p className="text-xs text-muted-foreground">
                Based on current payment rate
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-green-600" />
                <span className="font-medium text-sm">Emergency Fund Goal</span>
              </div>
              <p className="text-2xl font-bold text-primary">{predictions.emergencyGoalDate}</p>
              <p className="text-xs text-muted-foreground">
                To reach 6-month expense buffer
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <span className="font-medium text-sm">Financial Stability</span>
              </div>
              <Badge className={getRiskColor(predictions.riskLevel)}>
                {predictions.financialStability}
              </Badge>
            </div>
          </div>
        )}

        {/* Forecast Chart */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm">24-Month Financial Projection</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={forecastData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `$${(value/1000).toFixed(0)}k`} />
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), '']}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="balance" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  name="Net Worth"
                />
                <Line 
                  type="monotone" 
                  dataKey="debtRemaining" 
                  stroke="#ef4444" 
                  strokeWidth={2}
                  name="Remaining Debt"
                />
                <Line 
                  type="monotone" 
                  dataKey="emergencyFund" 
                  stroke="#22c55e" 
                  strokeWidth={2}
                  name="Emergency Fund"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="font-medium text-sm">AI Recommendations</h4>
          <div className="grid gap-2">
            {predictions?.riskLevel === 'high' && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">
                  ⚠️ <strong>Action needed:</strong> Your expenses exceed income. Consider reducing costs or increasing income.
                </p>
              </div>
            )}
            {predictions?.riskLevel === 'medium' && (
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-sm text-orange-800">
                  💡 <strong>Optimize:</strong> Increase your savings rate by 10% to improve financial stability.
                </p>
              </div>
            )}
            {predictions?.riskLevel === 'low' && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  ✅ <strong>Great job:</strong> Your financial trajectory is healthy. Consider investing surplus funds.
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};