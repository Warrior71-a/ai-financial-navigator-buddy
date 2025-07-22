import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not set');
    }

    const { financialData } = await req.json();

    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(amount);
    };

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

Keep responses concise and actionable. Format as JSON with keys: debtStrategy, budgetOptimization, riskAssessment, nextSteps (array).`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
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
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const analysisText = data.candidates[0].content.parts[0].text;
    
    // Try to parse as JSON first, fallback to text parsing
    let advice;
    try {
      advice = JSON.parse(analysisText);
    } catch {
      // Parse the response into structured advice
      const sections = analysisText.split(/\d\./);
      
      advice = {
        debtStrategy: sections[1]?.trim() || "Focus on high-interest debt first",
        budgetOptimization: sections[2]?.trim() || "Review monthly subscriptions and discretionary spending",
        riskAssessment: sections[3]?.trim() || "Build emergency fund to 3-6 months expenses",
        nextSteps: sections[4]?.split('\n').filter(step => step.trim()).slice(0, 5) || ["Create a debt payoff plan", "Track expenses monthly"]
      };
    }

    return new Response(JSON.stringify({ advice }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in financial-ai-advisor function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});