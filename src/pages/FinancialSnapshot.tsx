import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, ArrowLeft, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { Link } from "react-router-dom";
import QRCode from "qrcode";
import { useFinance } from "@/contexts/FinanceContext";
import { useAuth } from "@/contexts/AuthContext";

const FinancialSnapshot = () => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const { getTotalIncome, getTotalExpenses } = useFinance();
  const { user } = useAuth();

  // Get current year data
  const currentYear = new Date().getFullYear();
  
  // Calculate financial data from context - real data instead of mock
  const financialData = useMemo(() => {
    const totalIncome = getTotalIncome();
    const totalExpenses = getTotalExpenses();
    
    return {
      totalIncome,
      totalExpenses,
      netSavings: totalIncome - totalExpenses
    };
  }, [getTotalIncome, getTotalExpenses]);

  useEffect(() => {
    // Generate QR code for the current page URL
    const currentUrl = window.location.origin + "/financial-snapshot";
    QRCode.toDataURL(currentUrl, {
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    })
      .then(url => setQrCodeUrl(url))
      .catch(err => console.error('Error generating QR code:', err));
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <div className="container mx-auto px-4 py-8 max-w-md">
        {/* Header with back button */}
        <div className="flex items-center justify-between mb-8">
          <Link 
            to="/" 
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </div>

        {/* Profile Section */}
        <div className="text-center mb-8">
          <Link to="/user-profile" className="inline-block">
            <div className="relative mx-auto w-24 h-24 mb-4 group cursor-pointer">
              <Avatar className="w-24 h-24 border-2 border-cyan-400 group-hover:border-cyan-300 transition-colors">
                <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face" />
                <AvatarFallback className="bg-slate-700/50 text-cyan-400 text-xl">
                  JD
                </AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 rounded-full border-2 border-cyan-400 animate-pulse group-hover:border-cyan-300"></div>
            </div>
          </Link>
          
          <h1 className="text-2xl font-bold text-white mb-2">Financial Snapshot</h1>
          <p className="text-sm text-slate-400">User: {user?.email || 'Guest'}</p>
        </div>

        {/* Annual Overview */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-cyan-400 mb-6 text-center">Annual Overview</h2>
          
          <div className="space-y-4">
            {/* Total Income */}
            <Card className="bg-slate-800/90 border-l-4 border-l-green-500 border-r-0 border-t-0 border-b-0 rounded-lg">
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-slate-400 text-sm font-medium">Total Income</p>
                    <p className="text-green-400 font-bold text-2xl">
                      {formatCurrency(financialData.totalIncome)}
                    </p>
                  </div>
                  <TrendingUp className="h-6 w-6 text-green-400" />
                </div>
              </CardContent>
            </Card>

            {/* Total Expenses */}
            <Card className="bg-slate-800/90 border-l-4 border-l-red-500 border-r-0 border-t-0 border-b-0 rounded-lg">
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-slate-400 text-sm font-medium">Total Expenses</p>
                    <p className="text-red-400 font-bold text-2xl">
                      {formatCurrency(financialData.totalExpenses)}
                    </p>
                  </div>
                  <TrendingDown className="h-6 w-6 text-red-400" />
                </div>
              </CardContent>
            </Card>

            {/* Net Savings */}
            <Card className="bg-slate-800/90 border-l-4 border-l-cyan-500 border-r-0 border-t-0 border-b-0 rounded-lg">
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-slate-400 text-sm font-medium">Net Savings</p>
                    <p className="text-cyan-400 font-bold text-2xl">
                      {formatCurrency(financialData.netSavings)}
                    </p>
                  </div>
                  <DollarSign className="h-6 w-6 text-cyan-400" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* QR Code Section */}
        <div className="text-center">
          <p className="text-sm text-slate-400 mb-4">Scan to access your full budget</p>
          
          {qrCodeUrl && (
            <div className="inline-block p-4 bg-white rounded-lg">
              <img 
                src={qrCodeUrl} 
                alt="QR Code to Financial Snapshot" 
                className="w-32 h-32"
              />
            </div>
          )}
        </div>

        {/* Footer link to budget planner */}
        <div className="mt-8 text-center">
          <Link 
            to="/budget-planner"
            className="text-cyan-400 hover:text-cyan-300 underline text-sm"
          >
            View Full Budget Planner
          </Link>
        </div>
      </div>
    </div>
  );
};

export default FinancialSnapshot;