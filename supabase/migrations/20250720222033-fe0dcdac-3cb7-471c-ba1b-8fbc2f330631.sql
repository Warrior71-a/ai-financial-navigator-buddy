-- Add bi-weekly to the income_frequency enum
ALTER TYPE income_frequency ADD VALUE 'bi-weekly';

-- Add quarterly to the income_frequency enum  
ALTER TYPE income_frequency ADD VALUE 'quarterly';

-- Add one-time to the income_frequency enum
ALTER TYPE income_frequency ADD VALUE 'one-time';