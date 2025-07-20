import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { FinanceProvider } from "@/contexts/FinanceContext";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
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
import Auth from "./pages/Auth";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <AuthProvider>
        <FinanceProvider>
          <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/income" element={<ProtectedRoute><Income /></ProtectedRoute>} />
            <Route path="/expenses" element={<ProtectedRoute><ExpensesEnhanced /></ProtectedRoute>} />
            <Route path="/credit-cards" element={<ProtectedRoute><CreditCards /></ProtectedRoute>} />
            <Route path="/loans" element={<ProtectedRoute><Loans /></ProtectedRoute>} />
            <Route path="/budget-planner" element={<ProtectedRoute><BudgetPlanner /></ProtectedRoute>} />
            <Route path="/financial-snapshot" element={<ProtectedRoute><FinancialSnapshot /></ProtectedRoute>} />
            <Route path="/goal-tracking" element={<ProtectedRoute><GoalTracking /></ProtectedRoute>} />
            <Route path="/cash-flow-calendar" element={<ProtectedRoute><CashFlowCalendar /></ProtectedRoute>} />
            <Route path="/investment-tracking" element={<ProtectedRoute><InvestmentTracking /></ProtectedRoute>} />
            <Route path="/user-profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
            <Route path="/navigation" element={<ProtectedRoute><Navigation /></ProtectedRoute>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
          </TooltipProvider>
        </FinanceProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
