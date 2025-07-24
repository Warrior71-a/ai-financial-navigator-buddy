import React, { useEffect, useState } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { sessionManager } from '@/lib/security';
import { useAuth } from '@/contexts/AuthContext';

export const SessionTimeoutWarning: React.FC = () => {
  const [showWarning, setShowWarning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const { user, signOut } = useAuth();

  useEffect(() => {
    if (!user) return;

    const checkSession = () => {
      if (sessionManager.isSessionExpired()) {
        signOut();
        return;
      }

      const timeUntilWarning = sessionManager.getTimeUntilWarning();
      const timeUntilTimeout = sessionManager.getTimeUntilTimeout();

      if (timeUntilWarning <= 0 && timeUntilTimeout > 0) {
        setShowWarning(true);
        setTimeLeft(Math.ceil(timeUntilTimeout / 1000));
      } else {
        setShowWarning(false);
      }
    };

    // Check session every 30 seconds
    const interval = setInterval(checkSession, 30000);
    checkSession(); // Initial check

    return () => clearInterval(interval);
  }, [user, signOut]);

  useEffect(() => {
    if (!showWarning) return;

    // Update countdown every second
    const countdown = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          signOut();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdown);
  }, [showWarning, signOut]);

  const handleExtendSession = () => {
    sessionManager.setLastActivity();
    setShowWarning(false);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <AlertDialog open={showWarning} onOpenChange={setShowWarning}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Session Expiring Soon</AlertDialogTitle>
          <AlertDialogDescription>
            Your session will expire in {formatTime(timeLeft)} due to inactivity. 
            Would you like to extend your session?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="outline" onClick={() => signOut()}>
            Sign Out
          </Button>
          <AlertDialogAction onClick={handleExtendSession}>
            Extend Session
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};