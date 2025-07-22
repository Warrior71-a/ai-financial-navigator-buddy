import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Loader2, TrendingUp, AlertTriangle, Target, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface FinancialData {
  totalIncome: number;
  totalExpenses: number;
  totalDebt: number;
  monthlyPayments: number;
  emergencyFund: number;
  creditUtilization: number;
}

interface AIAdvice {
  debtStrategy: string;
  budgetOptimization: string;
  riskAssessment: string;
  nextSteps: string[];
}

interface FinancialAIAdvisorProps {
  financialData: FinancialData;
}

export const FinancialAIAdvisor = ({ financialData }: FinancialAIAdvisorProps) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [advice, setAdvice] = useState<AIAdvice | null>(null);
  const { toast } = useToast();

  const analyzeFinances = async () => {
    setIsAnalyzing(true);

    try {
      const { data, error } = await supabase.functions.invoke('financial-ai-advisor', {
        body: { financialData }
      });

      if (error) {
        throw new Error(error.message || 'Failed to get AI analysis');
      }

      if (data?.advice) {
        setAdvice(data.advice);
        toast({
          title: "Analysis Complete",
          description: "Your personalized financial advice is ready!",
        });
      } else {
        throw new Error('No advice received from AI');
      }

    } catch (error) {
      toast({
        title: "Analysis Failed", 
        description: error instanceof Error ? error.message : "Failed to analyze finances. Please try again.",
        variant: "destructive",
      });
      console.error('AI Analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Brain className="h-5 w-5 text-primary" />
          <span>AI Financial Advisor</span>
        </CardTitle>
        <CardDescription className="flex items-center space-x-2">
          <Shield className="h-4 w-4 text-green-600" />
          <span>Get personalized debt payoff strategies and financial advice powered by Gemini AI</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!advice && (
          <div className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg border">
              <p className="text-sm text-muted-foreground mb-2">
                <strong>Secure AI Analysis:</strong> Your financial data is processed securely through our backend. 
                No sensitive information is stored or shared.
              </p>
              <p className="text-xs text-muted-foreground">
                Powered by Google's Gemini AI for professional financial insights.
              </p>
            </div>
            
            <Button 
              onClick={analyzeFinances} 
              disabled={isAnalyzing}
              className="w-full"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing Your Finances...
                </>
              ) : (
                <>
                  <Brain className="mr-2 h-4 w-4" />
                  Get AI Financial Advice
                </>
              )}
            </Button>
          </div>
        )}

        {advice && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <Badge variant="secondary" className="flex items-center space-x-1">
                <Brain className="h-3 w-3" />
                <span>AI Analysis Complete</span>
              </Badge>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setAdvice(null)}
              >
                New Analysis
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center space-x-2">
                    <Target className="h-4 w-4 text-green-600" />
                    <span>Debt Strategy</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{advice.debtStrategy}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                    <span>Budget Optimization</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{advice.budgetOptimization}</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <span>Risk Assessment</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{advice.riskAssessment}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Next Steps</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {advice.nextSteps.map((step, index) => (
                    <li key={index} className="flex items-start space-x-2 text-sm">
                      <span className="font-medium text-primary">{index + 1}.</span>
                      <span className="text-muted-foreground">{step}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
};