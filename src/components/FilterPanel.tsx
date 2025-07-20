import React from 'react';
import { Calendar, Search, Filter, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useFinance } from '@/contexts/FinanceContext';
import { format } from 'date-fns';

interface FilterPanelProps {
  compact?: boolean;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({ compact = false }) => {
  const { state, setFilters, resetFilters, getCategories } = useFinance();
  const { filters } = state;
  const categories = getCategories();

  const handleDateRangeChange = (start: Date | undefined, end: Date | undefined) => {
    if (start && end) {
      setFilters({
        dateRange: {
          start: format(start, 'yyyy-MM-dd'),
          end: format(end, 'yyyy-MM-dd')
        }
      });
    } else {
      setFilters({ dateRange: null });
    }
  };

  const handleCategoryToggle = (category: string, checked: boolean) => {
    const newCategories = checked
      ? [...filters.categories, category]
      : filters.categories.filter(c => c !== category);
    
    setFilters({ categories: newCategories });
  };

  const hasActiveFilters = 
    filters.dateRange || 
    filters.categories.length > 0 || 
    filters.searchTerm || 
    filters.type !== 'all';

  if (compact) {
    return (
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search transactions..."
            value={filters.searchTerm}
            onChange={(e) => setFilters({ searchTerm: e.target.value })}
            className="pl-10 w-64"
          />
        </div>
        
        <Select value={filters.type} onValueChange={(value) => setFilters({ type: value as any })}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="income">Income</SelectItem>
            <SelectItem value="expense">Expense</SelectItem>
          </SelectContent>
        </Select>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <Calendar className="h-4 w-4 mr-2" />
              {filters.dateRange ? 'Date Range' : 'Any Date'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <div className="p-3">
              <div className="text-sm font-medium mb-2">Select Date Range</div>
              <CalendarComponent
                mode="range"
                selected={{
                  from: filters.dateRange ? new Date(filters.dateRange.start) : undefined,
                  to: filters.dateRange ? new Date(filters.dateRange.end) : undefined
                }}
                onSelect={(range) => {
                  handleDateRangeChange(range?.from, range?.to);
                }}
              />
              {filters.dateRange && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setFilters({ dateRange: null })}
                  className="w-full mt-2"
                >
                  Clear Date Range
                </Button>
              )}
            </div>
          </PopoverContent>
        </Popover>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={resetFilters}>
            <X className="h-4 w-4 mr-1" />
            Clear All
          </Button>
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <h3 className="font-medium">Filters</h3>
          </div>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              <X className="h-4 w-4 mr-1" />
              Clear All
            </Button>
          )}
        </div>

        <div className="space-y-4">
          {/* Search */}
          <div>
            <label className="text-sm font-medium mb-2 block">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search transactions..."
                value={filters.searchTerm}
                onChange={(e) => setFilters({ searchTerm: e.target.value })}
                className="pl-10"
              />
            </div>
          </div>

          {/* Type Filter */}
          <div>
            <label className="text-sm font-medium mb-2 block">Type</label>
            <Select value={filters.type} onValueChange={(value) => setFilters({ type: value as any })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="income">Income Only</SelectItem>
                <SelectItem value="expense">Expenses Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Range */}
          <div>
            <label className="text-sm font-medium mb-2 block">Date Range</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="h-4 w-4 mr-2" />
                  {filters.dateRange 
                    ? `${filters.dateRange.start} to ${filters.dateRange.end}`
                    : 'Select date range'
                  }
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <div className="p-3">
                  <CalendarComponent
                    mode="range"
                    selected={{
                      from: filters.dateRange ? new Date(filters.dateRange.start) : undefined,
                      to: filters.dateRange ? new Date(filters.dateRange.end) : undefined
                    }}
                    onSelect={(range) => {
                      handleDateRangeChange(range?.from, range?.to);
                    }}
                  />
                  {filters.dateRange && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setFilters({ dateRange: null })}
                      className="w-full mt-2"
                    >
                      Clear Date Range
                    </Button>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Categories */}
          {categories.length > 0 && (
            <div>
              <label className="text-sm font-medium mb-2 block">Categories</label>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {categories.map((category) => (
                  <div key={category} className="flex items-center space-x-2">
                    <Checkbox
                      id={category}
                      checked={filters.categories.includes(category)}
                      onCheckedChange={(checked) => 
                        handleCategoryToggle(category, checked as boolean)
                      }
                    />
                    <label htmlFor={category} className="text-sm">
                      {category}
                    </label>
                  </div>
                ))}
              </div>
              {filters.categories.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {filters.categories.map((category) => (
                    <Badge 
                      key={category} 
                      variant="secondary" 
                      className="text-xs"
                    >
                      {category}
                      <button
                        onClick={() => handleCategoryToggle(category, false)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};