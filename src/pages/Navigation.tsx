import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Home, 
  Calculator, 
  TrendingUp, 
  TrendingDown, 
  CreditCard, 
  Banknote, 
  Camera,
  ArrowLeft 
} from "lucide-react";

const Navigation = () => {
  const navigationItems = [
    {
      title: "Dashboard",
      description: "Overview of your financial data",
      icon: Home,
      path: "/",
      color: "text-blue-400",
      borderColor: "border-l-blue-500"
    },
    {
      title: "Budget Planner", 
      description: "Plan and track your budget",
      icon: Calculator,
      path: "/budget-planner",
      color: "text-green-400",
      borderColor: "border-l-green-500"
    },
    {
      title: "Income",
      description: "Manage your income sources",
      icon: TrendingUp,
      path: "/income", 
      color: "text-emerald-400",
      borderColor: "border-l-emerald-500"
    },
    {
      title: "Expenses",
      description: "Track your spending",
      icon: TrendingDown,
      path: "/expenses",
      color: "text-red-400", 
      borderColor: "border-l-red-500"
    },
    {
      title: "Credit Cards",
      description: "Monitor credit card usage",
      icon: CreditCard,
      path: "/credit-cards",
      color: "text-purple-400",
      borderColor: "border-l-purple-500"
    },
    {
      title: "Loans",
      description: "Track loan payments",
      icon: Banknote,
      path: "/loans",
      color: "text-orange-400",
      borderColor: "border-l-orange-500"
    },
    {
      title: "Financial Snapshot",
      description: "Quick overview & QR sharing",
      icon: Camera,
      path: "/financial-snapshot",
      color: "text-cyan-400",
      borderColor: "border-l-cyan-500"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link 
            to="/" 
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </div>

        {/* Title */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Navigation</h1>
          <p className="text-slate-400 text-lg">Choose a feature to get started</p>
        </div>

        {/* Navigation Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {navigationItems.map((item) => (
            <Link key={item.path} to={item.path} className="block group">
              <Card className={`bg-slate-800/90 border-l-4 ${item.borderColor} border-r-0 border-t-0 border-b-0 rounded-lg hover:bg-slate-700/90 transition-all duration-200 group-hover:scale-105`}>
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className={`p-3 rounded-lg bg-slate-700/50 ${item.color}`}>
                      <item.icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className={`font-bold text-lg mb-2 ${item.color} group-hover:text-white transition-colors`}>
                        {item.title}
                      </h3>
                      <p className="text-slate-400 text-sm group-hover:text-slate-300 transition-colors">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-16 text-center">
          <p className="text-slate-500 text-sm">
            All your financial tools in one place
          </p>
        </div>
      </div>
    </div>
  );
};

export default Navigation;