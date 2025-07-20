import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { ModeToggle } from "@/components/mode-toggle";
import { 
  Home, 
  Calculator, 
  TrendingUp, 
  TrendingDown, 
  CreditCard, 
  Banknote, 
  Camera,
  Target,
  Calendar,
  ArrowLeft,
  PieChart
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
    },
    {
      title: "Goal Tracking",
      description: "Track progress toward financial goals",
      icon: Target,
      path: "/goal-tracking",
      color: "text-indigo-400",
      borderColor: "border-l-indigo-500"
    },
    {
      title: "Cash Flow Calendar",
      description: "Daily cash flow visualization",
      icon: Calendar,
      path: "/cash-flow-calendar",
      color: "text-teal-400",
      borderColor: "border-l-teal-500"
    },
    {
      title: "Investment Tracking",
      description: "Portfolio management and performance tracking",
      icon: PieChart,
      path: "/investment-tracking",
      color: "text-violet-400",
      borderColor: "border-l-violet-500"
    }
  ];

  return (
    <div className="page-container">
      <div className="page-content max-w-4xl">
        {/* Header */}
        <div className="page-header">
          <Link to="/" className="back-button">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <ModeToggle />
        </div>

        {/* Title */}
        <div className="text-center mb-12">
          <div className="flex flex-col items-center mb-6">
            <img 
              src="https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=120&h=120&fit=crop&crop=face" 
              alt="Profile" 
              className="w-20 h-20 rounded-full object-cover border-4 border-border mb-4"
            />
            <h1 className="page-title text-4xl">Navigation</h1>
          </div>
          <p className="page-subtitle text-lg">Choose a feature to get started</p>
        </div>

        {/* Navigation Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {navigationItems.map((item) => (
            <Link key={item.path} to={item.path} className="block group">
              <Card className={`finance-card border-l-4 ${item.borderColor} border-r-0 border-t-0 border-b-0`}>
                <CardContent className="finance-card-content">
                  <div className="flex items-start space-x-4">
                    <div className={`p-3 rounded-lg bg-muted/50 ${item.color}`}>
                      <item.icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className={`font-bold text-lg mb-2 ${item.color} group-hover:text-foreground transition-colors`}>
                        {item.title}
                      </h3>
                      <p className="text-muted-foreground text-sm group-hover:text-foreground/80 transition-colors">
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
          <p className="page-subtitle text-sm">
            All your financial tools in one place
          </p>
        </div>
      </div>
    </div>
  );
};

export default Navigation;