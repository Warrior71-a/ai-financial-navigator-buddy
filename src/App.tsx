import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { FinanceProvider } from "@/contexts/FinanceContext";
import Index from "./pages/Index";
import Income from "./pages/Income";
import ExpensesEnhanced from "./pages/ExpensesEnhanced";
import CreditCards from "./pages/CreditCards";
import Loans from "./pages/Loans";
import BudgetPlanner from "./pages/BudgetPlanner";
import Navigation from "./pages/Navigation";
import FinancialSnapshot from "./pages/FinancialSnapshot";
import GoalTracking from "./pages/GoalTracking";
import CashFlowCalendar from "./pages/CashFlowCalendar";
import InvestmentTracking from "./pages/InvestmentTracking";
import UserProfile from "./pages/UserProfile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <FinanceProvider>
        <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/income" element={<Income />} />
          <Route path="/expenses" element={<ExpensesEnhanced />} />
          <Route path="/credit-cards" element={<CreditCards />} />
          <Route path="/loans" element={<Loans />} />
          <Route path="/budget-planner" element={<BudgetPlanner />} />
          <Route path="/financial-snapshot" element={<FinancialSnapshot />} />
          <Route path="/goal-tracking" element={<GoalTracking />} />
          <Route path="/cash-flow-calendar" element={<CashFlowCalendar />} />
          <Route path="/investment-tracking" element={<InvestmentTracking />} />
          <Route path="/user-profile" element={<UserProfile />} />
          <Route path="/navigation" element={<Navigation />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
        </TooltipProvider>
      </FinanceProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
