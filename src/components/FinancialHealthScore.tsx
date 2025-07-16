import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Shield, DollarSign, PiggyBank, CreditCard } from "lucide-react";

interface HealthMetric {
  name: string;
  score: number;
  weight: number;
  status: 'excellent' | 'good' | 'fair' | 'poor';
  description: string;
  icon: React.ReactNode;
}

interface FinancialHealthScoreProps {
  monthlyIncome: number;
  monthlyExpenses: number;
  totalDebt: number;
  emergencyFund: number;
  creditUtilization: number;
  debtPayments: number;
}

export const FinancialHealthScore = ({ 
  monthlyIncome, 
  monthlyExpenses, 
  totalDebt, 
  emergencyFund,
  creditUtilization,
  debtPayments 
}: FinancialHealthScoreProps) => {
  const [healthScore, setHealthScore] = useState(0);
  const [metrics, setMetrics] = useState<HealthMetric[]>([]);
  const [trend, setTrend] = useState<'improving' | 'declining' | 'stable'>('stable');

  useEffect(() => {
    calculateHealthScore();
  }, [monthlyIncome, monthlyExpenses, totalDebt, emergencyFund, creditUtilization, debtPayments]);

  const calculateHealthScore = () => {
    const monthlyBalance = monthlyIncome - monthlyExpenses;
    const savingsRate = monthlyIncome > 0 ? (monthlyBalance / monthlyIncome) * 100 : 0;
    const emergencyMonths = monthlyExpenses > 0 ? emergencyFund / monthlyExpenses : 0;
    const debtToIncomeRatio = monthlyIncome > 0 ? (totalDebt / (monthlyIncome * 12)) * 100 : 0;

    // Calculate individual metric scores
    const budgetScore = calculateBudgetScore(savingsRate);
    const emergencyScore = calculateEmergencyScore(emergencyMonths);
    const debtScore = calculateDebtScore(debtToIncomeRatio, creditUtilization);
    const cashflowScore = calculateCashflowScore(monthlyBalance, monthlyIncome);

    const calculatedMetrics: HealthMetric[] = [
      {
        name: 'Budget Management',
        score: budgetScore,
        weight: 0.25,
        status: getScoreStatus(budgetScore),
        description: `${savingsRate.toFixed(1)}% savings rate`,
        icon: <DollarSign className="h-4 w-4" />
      },
      {
        name: 'Emergency Preparedness',
        score: emergencyScore,
        weight: 0.25,
        status: getScoreStatus(emergencyScore),
        description: `${emergencyMonths.toFixed(1)} months covered`,
        icon: <Shield className="h-4 w-4" />
      },
      {
        name: 'Debt Management',
        score: debtScore,
        weight: 0.3,
        status: getScoreStatus(debtScore),
        description: `${debtToIncomeRatio.toFixed(1)}% debt-to-income`,
        icon: <CreditCard className="h-4 w-4" />
      },
      {
        name: 'Cash Flow',
        score: cashflowScore,
        weight: 0.2,
        status: getScoreStatus(cashflowScore),
        description: monthlyBalance >= 0 ? 'Positive cash flow' : 'Negative cash flow',
        icon: <TrendingUp className="h-4 w-4" />
      }
    ];

    setMetrics(calculatedMetrics);

    // Calculate weighted overall score
    const weightedScore = calculatedMetrics.reduce((total, metric) => {
      return total + (metric.score * metric.weight);
    }, 0);

    setHealthScore(Math.round(weightedScore));

    // Simulate trend (in real app, this would compare to previous periods)
    const randomTrend = Math.random();
    if (randomTrend > 0.6) setTrend('improving');
    else if (randomTrend < 0.3) setTrend('declining');
    else setTrend('stable');
  };

  const calculateBudgetScore = (savingsRate: number): number => {
    if (savingsRate >= 20) return 100;
    if (savingsRate >= 15) return 85;
    if (savingsRate >= 10) return 70;
    if (savingsRate >= 5) return 55;
    if (savingsRate >= 0) return 40;
    return 20;
  };

  const calculateEmergencyScore = (months: number): number => {
    if (months >= 6) return 100;
    if (months >= 3) return 75;
    if (months >= 1) return 50;
    if (months >= 0.5) return 30;
    return 10;
  };

  const calculateDebtScore = (debtToIncome: number, creditUtil: number): number => {
    let score = 100;
    
    // Penalize high debt-to-income ratio
    if (debtToIncome > 40) score -= 40;
    else if (debtToIncome > 30) score -= 25;
    else if (debtToIncome > 20) score -= 15;
    
    // Penalize high credit utilization
    if (creditUtil > 50) score -= 30;
    else if (creditUtil > 30) score -= 20;
    else if (creditUtil > 10) score -= 10;
    
    return Math.max(0, score);
  };

  const calculateCashflowScore = (monthlyBalance: number, monthlyIncome: number): number => {
    if (monthlyBalance <= 0) return 20;
    
    const balanceRatio = (monthlyBalance / monthlyIncome) * 100;
    if (balanceRatio >= 20) return 100;
    if (balanceRatio >= 15) return 85;
    if (balanceRatio >= 10) return 70;
    if (balanceRatio >= 5) return 55;
    return 40;
  };

  const getScoreStatus = (score: number): 'excellent' | 'good' | 'fair' | 'poor' => {
    if (score >= 85) return 'excellent';
    if (score >= 70) return 'good';
    if (score >= 50) return 'fair';
    return 'poor';
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-blue-600';
    if (score >= 50) return 'text-orange-600';
    return 'text-red-600';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'bg-green-100 text-green-800 border-green-200';
      case 'good': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'fair': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'poor': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'improving': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'declining': return <TrendingUp className="h-4 w-4 text-red-600 rotate-180" />;
      default: return <div className="h-4 w-4 rounded-full bg-gray-400" />;
    }
  };

  const getOverallStatus = (score: number) => {
    if (score >= 85) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 50) return 'Fair';
    return 'Needs Improvement';
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <PiggyBank className="h-5 w-5 text-primary" />
          <span>Financial Health Score</span>
        </CardTitle>
        <CardDescription>
          Comprehensive analysis of your financial wellness
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Score */}
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="text-6xl font-bold">
              <span className={getScoreColor(healthScore)}>{healthScore}</span>
              <span className="text-2xl text-muted-foreground">/100</span>
            </div>
            <div className="flex items-center justify-center space-x-2 mt-2">
              <Badge className={getStatusColor(getScoreStatus(healthScore))}>
                {getOverallStatus(healthScore)}
              </Badge>
              {getTrendIcon()}
            </div>
          </div>
          <Progress value={healthScore} className="h-3" />
        </div>

        {/* Individual Metrics */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm">Component Scores</h4>
          {metrics.map((metric, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {metric.icon}
                  <span className="text-sm font-medium">{metric.name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={getStatusColor(metric.status)}>
                    {metric.status}
                  </Badge>
                  <span className={`text-sm font-medium ${getScoreColor(metric.score)}`}>
                    {metric.score}
                  </span>
                </div>
              </div>
              <div className="space-y-1">
                <Progress value={metric.score} className="h-2" />
                <p className="text-xs text-muted-foreground">{metric.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Recommendations */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Improvement Recommendations</h4>
          <div className="space-y-2">
            {metrics
              .filter(metric => metric.score < 70)
              .map((metric, index) => (
                <div key={index} className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center space-x-2 mb-1">
                    {metric.icon}
                    <span className="text-sm font-medium">{metric.name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {getRecommendation(metric.name, metric.score)}
                  </p>
                </div>
              ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  function getRecommendation(metricName: string, score: number): string {
    switch (metricName) {
      case 'Budget Management':
        return score < 50 ? 'Focus on reducing expenses and increasing income to improve savings rate' : 'Aim to save at least 15-20% of your income monthly';
      case 'Emergency Preparedness':
        return score < 50 ? 'Start building an emergency fund with at least $1,000' : 'Work towards saving 6 months of expenses';
      case 'Debt Management':
        return score < 50 ? 'Consider debt consolidation and aggressive payoff strategy' : 'Keep credit utilization below 30% and pay down high-interest debt';
      case 'Cash Flow':
        return 'Review monthly expenses and look for areas to cut costs';
      default:
        return 'Continue monitoring and improving this area';
    }
  }
};