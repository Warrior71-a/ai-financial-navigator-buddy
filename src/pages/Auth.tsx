import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Loader2, DollarSign } from 'lucide-react';
import { PasswordStrengthIndicator } from '@/components/PasswordStrengthIndicator';
import { emailSchema, passwordSchema } from '@/lib/validations';
import { authRateLimiter, cleanupAuthState, csrfProtection, sessionManager } from '@/lib/security';
import { supabase } from '@/integrations/supabase/client';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const { signIn, signUp, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Redirect authenticated users
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  // Generate CSRF token on mount
  useEffect(() => {
    const token = csrfProtection.generateToken();
    csrfProtection.setToken(token);
  }, []);

  const validateInputs = (): boolean => {
    let isValid = true;
    
    // Email validation
    try {
      emailSchema.parse(email);
      setEmailError('');
    } catch (error: any) {
      setEmailError(error.errors?.[0]?.message || 'Invalid email');
      isValid = false;
    }
    
    // Password validation
    try {
      passwordSchema.parse(password);
      setPasswordError('');
    } catch (error: any) {
      setPasswordError(error.errors?.[0]?.message || 'Invalid password');
      isValid = false;
    }
    
    return isValid;
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate inputs
    if (!validateInputs()) {
      return;
    }

    // Check rate limiting
    const userIdentifier = email;
    if (!authRateLimiter.isAllowed(userIdentifier)) {
      const remainingTime = Math.ceil(authRateLimiter.getRemainingTime(userIdentifier) / 1000 / 60);
      toast({
        title: "Too many attempts",
        description: `Please try again in ${remainingTime} minutes.`,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Clean up existing state before signing in
      cleanupAuthState();
      
      // Attempt global sign out to ensure clean state
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        // Continue even if this fails
      }

      const { error } = await signIn(email, password);
      
      if (error) {
        toast({
          title: "Sign in failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        // Reset rate limiter on successful login
        authRateLimiter.reset(userIdentifier);
        
        // Set session activity
        sessionManager.setLastActivity();
        
        toast({
          title: "Welcome back!",
          description: "You have successfully signed in.",
        });
        
        // Force page reload for clean state
        window.location.href = '/';
      }
    } catch (error) {
      toast({
        title: "An error occurred",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate inputs
    if (!validateInputs()) {
      return;
    }

    // Check rate limiting
    const userIdentifier = email;
    if (!authRateLimiter.isAllowed(userIdentifier)) {
      const remainingTime = Math.ceil(authRateLimiter.getRemainingTime(userIdentifier) / 1000 / 60);
      toast({
        title: "Too many attempts",
        description: `Please try again in ${remainingTime} minutes.`,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Clean up existing state before signing up
      cleanupAuthState();
      
      const { error } = await signUp(email, password);
      
      if (error) {
        if (error.message.includes('User already registered')) {
          toast({
            title: "Account exists",
            description: "An account with this email already exists. Please sign in instead.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Sign up failed",
            description: error.message,
            variant: "destructive",
          });
        }
      } else {
        // Reset rate limiter on successful signup
        authRateLimiter.reset(userIdentifier);
        
        toast({
          title: "Account created!",
          description: "Please check your email to verify your account.",
        });
      }
    } catch (error) {
      toast({
        title: "An error occurred",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center mb-8">
          <DollarSign className="h-8 w-8 text-primary mr-2" />
          <h1 className="text-2xl font-bold text-foreground">FinanceWingman</h1>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Welcome</CardTitle>
            <CardDescription>
              Sign in to your account or create a new one to get started with your financial journey.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setEmailError('');
                      }}
                      required
                      className={emailError ? 'border-destructive' : ''}
                    />
                    {emailError && (
                      <p className="text-sm text-destructive">{emailError}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <Input
                      id="signin-password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setPasswordError('');
                      }}
                      required
                      className={passwordError ? 'border-destructive' : ''}
                    />
                    {passwordError && (
                      <p className="text-sm text-destructive">{passwordError}</p>
                    )}
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Sign In
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setEmailError('');
                      }}
                      required
                      className={emailError ? 'border-destructive' : ''}
                    />
                    {emailError && (
                      <p className="text-sm text-destructive">{emailError}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="Create a strong password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setPasswordError('');
                      }}
                      required
                      className={passwordError ? 'border-destructive' : ''}
                    />
                    {passwordError && (
                      <p className="text-sm text-destructive">{passwordError}</p>
                    )}
                    <PasswordStrengthIndicator password={password} />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Account
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;