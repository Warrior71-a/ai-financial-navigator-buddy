import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Brain, Key, Loader2, TrendingUp, AlertTriangle, Target } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  const [apiKey, setApiKey] = useState(localStorage.getItem('gemini-api-key') || '');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [advice, setAdvice] = useState<AIAdvice | null>(null);
  const { toast } = useToast();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const analyzeFinances = async () => {
    if (!apiKey.trim()) {
      toast({
        title: "API Key Required",
        description: "Please enter your Gemini API key to get financial analysis.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    localStorage.setItem('gemini-api-key', apiKey);

    try {
      const monthlyBalance = financialData.totalIncome - financialData.totalExpenses;
      
      const prompt = `As a financial advisor, analyze this person's financial situation and provide specific debt payoff strategies:

Monthly Income: ${formatCurrency(financialData.totalIncome)}
Monthly Expenses: ${formatCurrency(financialData.totalExpenses)}
Monthly Balance: ${formatCurrency(monthlyBalance)}
Total Debt: ${formatCurrency(financialData.totalDebt)}
Monthly Debt Payments: ${formatCurrency(financialData.monthlyPayments)}
Emergency Fund: ${formatCurrency(financialData.emergencyFund)}
Credit Utilization: ${financialData.creditUtilization}%

Please provide:
1. Best debt payoff strategy (avalanche vs snowball)
2. Budget optimization recommendations
3. Risk assessment and warnings
4. 3-5 specific next steps

Keep responses concise and actionable.`;

      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' + apiKey, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI analysis');
      }

      const data = await response.json();
      const analysisText = data.candidates[0].content.parts[0].text;
      
      // Parse the response into structured advice
      const sections = analysisText.split(/\d\./);
      
      setAdvice({
        debtStrategy: sections[1]?.trim() || "Focus on high-interest debt first",
        budgetOptimization: sections[2]?.trim() || "Review monthly subscriptions and discretionary spending",
        riskAssessment: sections[3]?.trim() || "Build emergency fund to 3-6 months expenses",
        nextSteps: sections[4]?.split('\n').filter(step => step.trim()).slice(0, 5) || ["Create a debt payoff plan", "Track expenses monthly"]
      });

      toast({
        title: "Analysis Complete",
        description: "Your personalized financial advice is ready!",
      });

    } catch (error) {
      toast({
        title: "Analysis Failed",
        description: "Failed to analyze finances. Check your API key and try again.",
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
        <CardDescription>
          Get personalized debt payoff strategies and financial advice powered by Gemini AI
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!advice && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="api-key" className="flex items-center space-x-2">
                <Key className="h-4 w-4" />
                <span>Gemini API Key</span>
              </Label>
              <Input
                id="api-key"
                type="password"
                placeholder="Enter your Gemini API key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Get your free API key from{' '}
                <a 
                  href="https://makersuite.google.com/app/apikey" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Google AI Studio
                </a>
              </p>
            </div>
            
            <Button 
              onClick={analyzeFinances} 
              disabled={isAnalyzing || !apiKey.trim()}
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
                  Analyze My Finances
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