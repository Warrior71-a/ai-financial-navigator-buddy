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
    console.log('Financial AI Advisor function called');
    
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    console.log('API key available:', !!GEMINI_API_KEY);
    
    if (!GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY is not set');
      return new Response(JSON.stringify({ error: 'GEMINI_API_KEY is not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const requestBody = await req.json();
    console.log('Request body received:', !!requestBody.financialData);
    
    const { financialData } = requestBody;
    
    if (!financialData) {
      console.error('No financial data provided');
      return new Response(JSON.stringify({ error: 'Financial data is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(amount || 0);
    };

    const monthlyBalance = (financialData.totalIncome || 0) - (financialData.totalExpenses || 0);
    
    const prompt = `As a financial advisor, analyze this person's financial situation and provide specific debt payoff strategies:

Monthly Income: ${formatCurrency(financialData.totalIncome)}
Monthly Expenses: ${formatCurrency(financialData.totalExpenses)}
Monthly Balance: ${formatCurrency(monthlyBalance)}
Total Debt: ${formatCurrency(financialData.totalDebt)}
Monthly Debt Payments: ${formatCurrency(financialData.monthlyPayments)}
Emergency Fund: ${formatCurrency(financialData.emergencyFund)}
Credit Utilization: ${financialData.creditUtilization || 0}%

Please provide:
1. Best debt payoff strategy (avalanche vs snowball)
2. Budget optimization recommendations
3. Risk assessment and warnings
4. 3-5 specific next steps

Keep responses concise and actionable.`;

    console.log('Making request to Gemini API');
    
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

    console.log('Gemini API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      return new Response(JSON.stringify({ error: `Gemini API error: ${response.status} - ${errorText}` }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    console.log('Gemini API response received');
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      console.error('Invalid response structure from Gemini API');
      return new Response(JSON.stringify({ error: 'Invalid response from AI service' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const analysisText = data.candidates[0].content.parts[0].text;
    console.log('Analysis text length:', analysisText?.length);
    
    // Parse the response into structured advice
    const sections = analysisText.split(/\d\./);
    
    const advice = {
      debtStrategy: sections[1]?.trim() || "Focus on paying off high-interest debt first using the debt avalanche method.",
      budgetOptimization: sections[2]?.trim() || "Review monthly subscriptions and discretionary spending to find savings opportunities.",
      riskAssessment: sections[3]?.trim() || "Build an emergency fund covering 3-6 months of expenses to protect against unexpected costs.",
      nextSteps: sections[4]?.split('\n').filter(step => step.trim()).slice(0, 5) || [
        "Create a detailed debt payoff plan",
        "Track all monthly expenses", 
        "Set up automatic savings",
        "Review insurance coverage",
        "Consider increasing income sources"
      ]
    };

    console.log('Successfully processed AI advice');
    
    return new Response(JSON.stringify({ advice }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in financial-ai-advisor function:', error);
    return new Response(JSON.stringify({ 
      error: `Function error: ${error.message}`,
      details: error.stack 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});