import { z } from 'zod';

// Enhanced password validation schema with security requirements
export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters long')
  .max(128, 'Password must be less than 128 characters')
  .refine((password) => {
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    return hasUppercase && hasLowercase && hasNumbers && hasSpecialChar;
  }, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
  });

// Enhanced email validation
export const emailSchema = z.string()
  .email('Please enter a valid email address')
  .min(1, 'Email is required')
  .max(254, 'Email must be less than 254 characters')
  .refine((email) => {
    // Additional email validation beyond basic format
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return emailRegex.test(email);
  }, {
    message: 'Please enter a valid email address'
  });

// Password strength calculation
export const calculatePasswordStrength = (password: string): {
  score: number;
  feedback: string[];
  strength: 'weak' | 'fair' | 'good' | 'strong';
} => {
  const feedback: string[] = [];
  let score = 0;

  // Length check
  if (password.length >= 8) score += 1;
  else feedback.push('Use at least 8 characters');

  if (password.length >= 12) score += 1;

  // Character variety checks
  if (/[a-z]/.test(password)) score += 1;
  else feedback.push('Add lowercase letters');

  if (/[A-Z]/.test(password)) score += 1;
  else feedback.push('Add uppercase letters');

  if (/\d/.test(password)) score += 1;
  else feedback.push('Add numbers');

  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;
  else feedback.push('Add special characters');

  // Common patterns to avoid
  if (!/(.)\1{2,}/.test(password)) score += 1;
  else feedback.push('Avoid repeated characters');

  const strength = score < 3 ? 'weak' : score < 5 ? 'fair' : score < 7 ? 'good' : 'strong';

  return { score, feedback, strength };
};

// Rate limiting utility
class RateLimiter {
  private attempts: Map<string, { count: number; resetTime: number }> = new Map();

  isAllowed(identifier: string, maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000): boolean {
    const now = Date.now();
    const record = this.attempts.get(identifier);

    if (!record || now > record.resetTime) {
      this.attempts.set(identifier, { count: 1, resetTime: now + windowMs });
      return true;
    }

    if (record.count >= maxAttempts) {
      return false;
    }

    record.count++;
    return true;
  }

  getRemainingTime(identifier: string): number {
    const record = this.attempts.get(identifier);
    if (!record) return 0;
    
    const remaining = record.resetTime - Date.now();
    return Math.max(0, remaining);
  }

  reset(identifier: string): void {
    this.attempts.delete(identifier);
  }
}

export const authRateLimiter = new RateLimiter();

// Data sanitization utilities
export const sanitizeFinancialData = {
  amount: (value: string | number): number => {
    const num = typeof value === 'string' ? parseFloat(value.replace(/[^\d.-]/g, '')) : value;
    return isNaN(num) ? 0 : Math.max(0, num);
  },
  
  description: (value: string): string => {
    return value
      .trim()
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
      .replace(/[<>]/g, '') // Remove angle brackets
      .substring(0, 500); // Limit length
  },

  cardNumber: (value: string): string => {
    return value.replace(/\D/g, '').substring(0, 19); // Only digits, max 19 chars
  }
};

// Simple encryption utilities for localStorage (basic obfuscation)
const ENCRYPTION_KEY = 'finance-app-key'; // In production, this should be more secure

export const storageEncryption = {
  encrypt: (data: string): string => {
    try {
      // Simple XOR encryption for basic obfuscation
      return btoa(data.split('').map((char, i) => 
        String.fromCharCode(char.charCodeAt(0) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length))
      ).join(''));
    } catch {
      return data; // Fallback to unencrypted if encryption fails
    }
  },

  decrypt: (encryptedData: string): string => {
    try {
      const decoded = atob(encryptedData);
      return decoded.split('').map((char, i) => 
        String.fromCharCode(char.charCodeAt(0) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length))
      ).join('');
    } catch {
      return encryptedData; // Fallback to treating as unencrypted
    }
  }
};

// CSRF token utilities
export const csrfProtection = {
  generateToken: (): string => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  },

  setToken: (token: string): void => {
    sessionStorage.setItem('csrf-token', token);
  },

  getToken: (): string | null => {
    return sessionStorage.getItem('csrf-token');
  },

  validateToken: (token: string): boolean => {
    const storedToken = sessionStorage.getItem('csrf-token');
    return storedToken === token;
  }
};

// Session timeout management
export const sessionManager = {
  TIMEOUT_DURATION: 30 * 60 * 1000, // 30 minutes
  WARNING_DURATION: 5 * 60 * 1000,  // 5 minutes before timeout
  
  setLastActivity: (): void => {
    localStorage.setItem('lastActivity', Date.now().toString());
  },

  getLastActivity: (): number => {
    const stored = localStorage.getItem('lastActivity');
    return stored ? parseInt(stored, 10) : Date.now();
  },

  isSessionExpired: (): boolean => {
    const lastActivity = sessionManager.getLastActivity();
    return Date.now() - lastActivity > sessionManager.TIMEOUT_DURATION;
  },

  getTimeUntilWarning: (): number => {
    const lastActivity = sessionManager.getLastActivity();
    const timeElapsed = Date.now() - lastActivity;
    const timeUntilWarning = sessionManager.TIMEOUT_DURATION - sessionManager.WARNING_DURATION - timeElapsed;
    return Math.max(0, timeUntilWarning);
  },

  getTimeUntilTimeout: (): number => {
    const lastActivity = sessionManager.getLastActivity();
    const timeElapsed = Date.now() - lastActivity;
    const timeUntilTimeout = sessionManager.TIMEOUT_DURATION - timeElapsed;
    return Math.max(0, timeUntilTimeout);
  }
};

// Clean up authentication state
export const cleanupAuthState = (): void => {
  // Remove standard auth tokens
  localStorage.removeItem('supabase.auth.token');
  
  // Remove all Supabase auth keys from localStorage
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
      localStorage.removeItem(key);
    }
  });
  
  // Remove from sessionStorage if in use
  Object.keys(sessionStorage || {}).forEach((key) => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
      sessionStorage.removeItem(key);
    }
  });
  
  // Clear CSRF token
  sessionStorage.removeItem('csrf-token');
};