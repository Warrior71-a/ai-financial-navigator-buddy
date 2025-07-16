import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  AlertTriangle, 
  TrendingUp, 
  DollarSign, 
  Calendar,
  Bell,
  CheckCircle,
  X
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SmartAlert {
  id: string;
  type: 'warning' | 'info' | 'success' | 'critical';
  title: string;
  message: string;
  action?: string;
  priority: 'high' | 'medium' | 'low';
  category: 'budget' | 'debt' | 'savings' | 'bills';
  timestamp: Date;
  dismissed?: boolean;
}

interface SmartAlertsProps {
  monthlyIncome: number;
  monthlyExpenses: number;
  totalDebt: number;
  emergencyFund: number;
  creditUtilization: number;
}

export const SmartAlerts = ({ 
  monthlyIncome, 
  monthlyExpenses, 
  totalDebt, 
  emergencyFund,
  creditUtilization 
}: SmartAlertsProps) => {
  const [alerts, setAlerts] = useState<SmartAlert[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    generateSmartAlerts();
  }, [monthlyIncome, monthlyExpenses, totalDebt, emergencyFund, creditUtilization]);

  const generateSmartAlerts = () => {
    const newAlerts: SmartAlert[] = [];
    const monthlyBalance = monthlyIncome - monthlyExpenses;
    const emergencyGoal = monthlyExpenses * 6;

    // Budget Alerts
    if (monthlyBalance < 0) {
      newAlerts.push({
        id: 'negative-balance',
        type: 'critical',
        title: 'Budget Alert',
        message: `You're spending $${Math.abs(monthlyBalance).toFixed(0)} more than you earn each month`,
        action: 'Review expenses and create a budget plan',
        priority: 'high',
        category: 'budget',
        timestamp: new Date()
      });
    }

    if (monthlyBalance > 0 && monthlyBalance < monthlyIncome * 0.1) {
      newAlerts.push({
        id: 'low-savings',
        type: 'warning',
        title: 'Low Savings Rate',
        message: `You're only saving ${((monthlyBalance/monthlyIncome) * 100).toFixed(1)}% of income`,
        action: 'Aim for at least 20% savings rate',
        priority: 'medium',
        category: 'savings',
        timestamp: new Date()
      });
    }

    // Debt Alerts
    if (creditUtilization > 30) {
      newAlerts.push({
        id: 'high-credit-util',
        type: 'warning',
        title: 'Credit Utilization Alert',
        message: `Your credit utilization is ${creditUtilization}% (recommended: under 30%)`,
        action: 'Pay down credit cards to improve credit score',
        priority: 'medium',
        category: 'debt',
        timestamp: new Date()
      });
    }

    if (totalDebt > monthlyIncome * 3) {
      newAlerts.push({
        id: 'high-debt',
        type: 'critical',
        title: 'High Debt Alert',
        message: 'Your total debt exceeds 3x your monthly income',
        action: 'Consider debt consolidation or aggressive payoff strategy',
        priority: 'high',
        category: 'debt',
        timestamp: new Date()
      });
    }

    // Emergency Fund Alerts
    if (emergencyFund < monthlyExpenses) {
      newAlerts.push({
        id: 'no-emergency-fund',
        type: 'critical',
        title: 'Emergency Fund Alert',
        message: 'You have less than 1 month of expenses saved',
        action: 'Start building emergency fund immediately',
        priority: 'high',
        category: 'savings',
        timestamp: new Date()
      });
    } else if (emergencyFund < emergencyGoal) {
      newAlerts.push({
        id: 'low-emergency-fund',
        type: 'info',
        title: 'Emergency Fund Progress',
        message: `You have ${(emergencyFund/monthlyExpenses).toFixed(1)} months of expenses saved`,
        action: `Goal: ${(emergencyGoal/monthlyExpenses).toFixed(0)} months (${((emergencyFund/emergencyGoal) * 100).toFixed(0)}% complete)`,
        priority: 'low',
        category: 'savings',
        timestamp: new Date()
      });
    }

    // Positive Alerts
    if (monthlyBalance > monthlyIncome * 0.2) {
      newAlerts.push({
        id: 'good-savings',
        type: 'success',
        title: 'Excellent Savings Rate',
        message: `You're saving ${((monthlyBalance/monthlyIncome) * 100).toFixed(1)}% of your income!`,
        action: 'Consider investing the surplus for long-term growth',
        priority: 'low',
        category: 'savings',
        timestamp: new Date()
      });
    }

    if (creditUtilization < 10) {
      newAlerts.push({
        id: 'good-credit',
        type: 'success',
        title: 'Excellent Credit Management',
        message: `Your credit utilization is only ${creditUtilization}%`,
        action: 'Keep up the great work with credit management',
        priority: 'low',
        category: 'debt',
        timestamp: new Date()
      });
    }

    setAlerts(newAlerts);
  };

  const dismissAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, dismissed: true } : alert
    ));
    toast({
      title: "Alert dismissed",
      description: "Alert has been removed from your dashboard",
    });
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical': return <AlertTriangle className="h-4 w-4" />;
      case 'warning': return <AlertTriangle className="h-4 w-4" />;
      case 'success': return <CheckCircle className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const getAlertVariant = (type: string) => {
    switch (type) {
      case 'critical': return 'destructive';
      case 'warning': return 'destructive';
      case 'success': return 'default';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const activeAlerts = alerts.filter(alert => !alert.dismissed);
  const criticalAlerts = activeAlerts.filter(alert => alert.priority === 'high');

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Bell className="h-5 w-5 text-primary" />
              <span>Smart Alerts</span>
              {criticalAlerts.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {criticalAlerts.length} Critical
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              AI-powered financial alerts and recommendations
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {activeAlerts.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="font-medium text-lg mb-2">All Clear!</h3>
            <p className="text-muted-foreground">
              No financial alerts at this time. Keep up the great work!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeAlerts
              .sort((a, b) => {
                const priorityOrder = { high: 3, medium: 2, low: 1 };
                return priorityOrder[b.priority] - priorityOrder[a.priority];
              })
              .map((alert) => (
                <Alert key={alert.id} variant={getAlertVariant(alert.type)} className="relative">
                  <div className="flex items-start space-x-3">
                    {getAlertIcon(alert.type)}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium text-sm">{alert.title}</h4>
                          <Badge className={getPriorityColor(alert.priority)}>
                            {alert.priority}
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => dismissAlert(alert.id)}
                          className="h-6 w-6 p-0 hover:bg-transparent"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      <AlertDescription className="text-sm">
                        {alert.message}
                      </AlertDescription>
                      {alert.action && (
                        <div className="bg-muted/50 p-2 rounded text-xs text-muted-foreground">
                          <strong>Recommended action:</strong> {alert.action}
                        </div>
                      )}
                    </div>
                  </div>
                </Alert>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};