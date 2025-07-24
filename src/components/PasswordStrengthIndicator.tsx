import React from 'react';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { calculatePasswordStrength } from '@/lib/security';

interface PasswordStrengthIndicatorProps {
  password: string;
  className?: string;
}

export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({
  password,
  className = ''
}) => {
  const { score, feedback, strength } = calculatePasswordStrength(password);
  
  if (!password) return null;

  const getStrengthColor = () => {
    switch (strength) {
      case 'weak': return 'hsl(var(--destructive))';
      case 'fair': return 'hsl(var(--warning))';
      case 'good': return 'hsl(var(--success))';
      case 'strong': return 'hsl(var(--primary))';
      default: return 'hsl(var(--muted))';
    }
  };

  const getStrengthText = () => {
    switch (strength) {
      case 'weak': return 'Weak';
      case 'fair': return 'Fair';
      case 'good': return 'Good';
      case 'strong': return 'Strong';
      default: return '';
    }
  };

  const getIcon = () => {
    switch (strength) {
      case 'weak': return <XCircle className="h-4 w-4 text-destructive" />;
      case 'fair': return <AlertCircle className="h-4 w-4 text-warning" />;
      case 'good': return <CheckCircle className="h-4 w-4 text-success" />;
      case 'strong': return <CheckCircle className="h-4 w-4 text-primary" />;
      default: return null;
    }
  };

  const progressValue = (score / 7) * 100;

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Password strength</span>
        <div className="flex items-center gap-1">
          {getIcon()}
          <span className="text-sm font-medium" style={{ color: getStrengthColor() }}>
            {getStrengthText()}
          </span>
        </div>
      </div>
      
      <Progress 
        value={progressValue} 
        className="h-2"
        style={{
          '--progress-foreground': getStrengthColor()
        } as React.CSSProperties}
      />
      
      {feedback.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Suggestions:</p>
          <ul className="text-xs text-muted-foreground space-y-0.5">
            {feedback.slice(0, 3).map((item, index) => (
              <li key={index} className="flex items-center gap-1">
                <span className="w-1 h-1 bg-muted-foreground rounded-full flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};