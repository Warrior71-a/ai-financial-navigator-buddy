import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Target, Plus, Calendar, DollarSign } from "lucide-react";
import { FinancialGoal } from "@/types/finance";

const GoalTracking = () => {
  // Load financial goals from localStorage
  const [goals, setGoals] = useState<FinancialGoal[]>(() => {
    const saved = localStorage.getItem('financial-goals');
    return saved ? JSON.parse(saved) : [];
  });

  const calculateProgress = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-400';
      case 'medium': return 'text-yellow-400';
      case 'low': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  // Save goals to localStorage whenever goals change
  useEffect(() => {
    localStorage.setItem('financial-goals', JSON.stringify(goals));
  }, [goals]);

  const activeGoals = goals.filter(goal => !goal.isCompleted);
  const completedGoals = goals.filter(goal => goal.isCompleted);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link 
              to="/navigation" 
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="flex items-center space-x-3">
              <Target className="h-8 w-8 text-green-400" />
              <h1 className="text-3xl font-bold">Goal Tracking</h1>
            </div>
          </div>
          <Button className="bg-green-600 hover:bg-green-700">
            <Plus className="h-4 w-4 mr-2" />
            Add Goal
          </Button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-slate-800/90 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <Target className="h-8 w-8 text-blue-400" />
                <div>
                  <p className="text-slate-400 text-sm">Active Goals</p>
                  <p className="text-2xl font-bold">{activeGoals.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800/90 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <DollarSign className="h-8 w-8 text-green-400" />
                <div>
                  <p className="text-slate-400 text-sm">Total Target</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(activeGoals.reduce((sum, goal) => sum + goal.targetAmount, 0))}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800/90 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <Calendar className="h-8 w-8 text-purple-400" />
                <div>
                  <p className="text-slate-400 text-sm">Completed Goals</p>
                  <p className="text-2xl font-bold">{completedGoals.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Active Goals */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6">Active Goals</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {activeGoals.map((goal) => {
              const progress = calculateProgress(goal.currentAmount, goal.targetAmount);
              const remaining = goal.targetAmount - goal.currentAmount;
              
              return (
                <Card key={goal.id} className="bg-slate-800/90 border-slate-700">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl">{goal.name}</CardTitle>
                      <span className={`text-sm font-medium px-2 py-1 rounded-full bg-slate-700 ${getPriorityColor(goal.priority)}`}>
                        {goal.priority}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{progress.toFixed(1)}%</span>
                      </div>
                      <Progress value={progress} className="h-3" />
                      <div className="flex justify-between text-sm text-slate-400">
                        <span>{formatCurrency(goal.currentAmount)}</span>
                        <span>{formatCurrency(goal.targetAmount)}</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-slate-400">Remaining</p>
                        <p className="font-medium">{formatCurrency(remaining)}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Target Date</p>
                        <p className="font-medium">{formatDate(goal.targetDate)}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Monthly Contribution</p>
                        <p className="font-medium">{formatCurrency(goal.monthlyContribution)}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Months to Goal</p>
                        <p className="font-medium">
                          {goal.monthlyContribution > 0 
                            ? Math.ceil(remaining / goal.monthlyContribution)
                            : '∞'
                          }
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Completed Goals */}
        {completedGoals.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Completed Goals</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {completedGoals.map((goal) => (
                <Card key={goal.id} className="bg-green-900/20 border-green-700/50">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl text-green-400">{goal.name}</CardTitle>
                      <span className="text-sm font-medium px-2 py-1 rounded-full bg-green-700/30 text-green-400">
                        Completed
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Progress value={100} className="h-3" />
                    <div className="flex justify-between text-sm">
                      <span>Goal Amount: {formatCurrency(goal.targetAmount)}</span>
                      <span>Target: {formatDate(goal.targetDate)}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GoalTracking;