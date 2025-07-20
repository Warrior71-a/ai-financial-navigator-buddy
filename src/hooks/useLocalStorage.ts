import { useState, useEffect, useCallback } from 'react';

type SetValue<T> = T | ((val: T) => T);

interface UseLocalStorageOptions {
  syncAcrossTabs?: boolean;
  serialize?: (value: any) => string;
  deserialize?: (value: string) => any;
}

const defaultOptions: UseLocalStorageOptions = {
  syncAcrossTabs: true,
  serialize: JSON.stringify,
  deserialize: JSON.parse
};

export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  options: UseLocalStorageOptions = {}
): [T, (value: SetValue<T>) => void, () => void] {
  const opts = { ...defaultOptions, ...options };
  
  // Get from local storage then parse stored json or return initialValue
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? opts.deserialize!(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Return a wrapped version of useState's setter function that persists the new value to localStorage
  const setValue = useCallback(
    (value: SetValue<T>) => {
      try {
        // Allow value to be a function so we have the same API as useState
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        
        // Save state
        setStoredValue(valueToStore);
        
        // Save to local storage
        if (valueToStore === undefined) {
          window.localStorage.removeItem(key);
        } else {
          window.localStorage.setItem(key, opts.serialize!(valueToStore));
        }
        
        // Dispatch custom event for cross-tab synchronization
        if (opts.syncAcrossTabs) {
          window.dispatchEvent(
            new CustomEvent('localStorageChange', {
              detail: { key, value: valueToStore }
            })
          );
        }
      } catch (error) {
        console.error(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, storedValue, opts]
  );

  // Remove from localStorage
  const removeValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
      
      if (opts.syncAcrossTabs) {
        window.dispatchEvent(
          new CustomEvent('localStorageChange', {
            detail: { key, value: undefined }
          })
        );
      }
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue, opts]);

  // Listen for changes in localStorage (for cross-tab synchronization)
  useEffect(() => {
    if (!opts.syncAcrossTabs) return;

    const handleStorageChange = (e: CustomEvent) => {
      if (e.detail.key === key) {
        setStoredValue(e.detail.value ?? initialValue);
      }
    };

    // Also listen for the standard storage event (for changes from other tabs)
    const handleNativeStorageChange = (e: StorageEvent) => {
      if (e.key === key) {
        try {
          const newValue = e.newValue ? opts.deserialize!(e.newValue) : initialValue;
          setStoredValue(newValue);
        } catch (error) {
          console.error(`Error parsing localStorage change for key "${key}":`, error);
        }
      }
    };

    window.addEventListener('localStorageChange', handleStorageChange as EventListener);
    window.addEventListener('storage', handleNativeStorageChange);

    return () => {
      window.removeEventListener('localStorageChange', handleStorageChange as EventListener);
      window.removeEventListener('storage', handleNativeStorageChange);
    };
  }, [key, initialValue, opts]);

  return [storedValue, setValue, removeValue];
}

// Enhanced hook for complex data with automatic error recovery
export function useLocalStorageWithErrorRecovery<T>(
  key: string,
  initialValue: T,
  options: UseLocalStorageOptions & {
    onError?: (error: Error, key: string) => void;
    validateData?: (data: any) => data is T;
  } = {}
) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const customOptions: UseLocalStorageOptions = {
    ...options,
    deserialize: (value: string) => {
      try {
        const parsed = JSON.parse(value);
        
        // Validate data structure if validator provided
        if (options.validateData && !options.validateData(parsed)) {
          throw new Error(`Invalid data structure for key "${key}"`);
        }
        
        return parsed;
      } catch (parseError) {
        const error = parseError instanceof Error ? parseError : new Error('Parse error');
        setError(error);
        
        if (options.onError) {
          options.onError(error, key);
        }
        
        // Return initial value on parse error
        return initialValue;
      }
    }
  };

  const [value, setValue, removeValue] = useLocalStorage(key, initialValue, customOptions);

  useEffect(() => {
    setIsLoading(false);
  }, []);

  const safeSetValue = useCallback((newValue: SetValue<T>) => {
    try {
      setValue(newValue);
      setError(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      
      if (options.onError) {
        options.onError(error, key);
      }
    }
  }, [setValue, key, options]);

  return {
    value,
    setValue: safeSetValue,
    removeValue,
    isLoading,
    error,
    clearError: () => setError(null)
  };
}