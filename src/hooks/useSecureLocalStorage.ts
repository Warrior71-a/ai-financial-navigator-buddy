import { useState, useEffect, useCallback } from 'react';
import { storageEncryption } from '@/lib/security';

type SetValue<T> = T | ((val: T) => T);

interface UseSecureLocalStorageOptions {
  encrypt?: boolean;
  syncAcrossTabs?: boolean;
  onError?: (error: Error, key: string) => void;
  validateData?: (data: any) => data is any;
}

const defaultOptions: UseSecureLocalStorageOptions = {
  encrypt: true,
  syncAcrossTabs: true
};

export function useSecureLocalStorage<T>(
  key: string,
  initialValue: T,
  options: UseSecureLocalStorageOptions = {}
): [T, (value: SetValue<T>) => void, () => void, Error | null] {
  const opts = { ...defaultOptions, ...options };
  const [error, setError] = useState<Error | null>(null);
  
  // Get from local storage then parse stored json or return initialValue
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (!item) return initialValue;
      
      let decryptedItem = item;
      if (opts.encrypt) {
        decryptedItem = storageEncryption.decrypt(item);
      }
      
      const parsed = JSON.parse(decryptedItem);
      
      // Validate data structure if validator provided
      if (opts.validateData && !opts.validateData(parsed)) {
        console.warn(`Invalid data structure for key "${key}", using initial value`);
        return initialValue;
      }
      
      return parsed;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Storage read error');
      console.error(`Error reading localStorage key "${key}":`, err);
      setError(err);
      
      if (opts.onError) {
        opts.onError(err, key);
      }
      
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
          const serialized = JSON.stringify(valueToStore);
          const finalValue = opts.encrypt ? storageEncryption.encrypt(serialized) : serialized;
          window.localStorage.setItem(key, finalValue);
        }
        
        // Dispatch custom event for cross-tab synchronization
        if (opts.syncAcrossTabs) {
          window.dispatchEvent(
            new CustomEvent('secureStorageChange', {
              detail: { key, value: valueToStore }
            })
          );
        }
        
        // Clear any previous errors
        setError(null);
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Storage write error');
        console.error(`Error setting localStorage key "${key}":`, err);
        setError(err);
        
        if (opts.onError) {
          opts.onError(err, key);
        }
      }
    },
    [key, storedValue, opts]
  );

  // Remove from localStorage
  const removeValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
      setError(null);
      
      if (opts.syncAcrossTabs) {
        window.dispatchEvent(
          new CustomEvent('secureStorageChange', {
            detail: { key, value: undefined }
          })
        );
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Storage remove error');
      console.error(`Error removing localStorage key "${key}":`, err);
      setError(err);
      
      if (opts.onError) {
        opts.onError(err, key);
      }
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
          if (!e.newValue) {
            setStoredValue(initialValue);
            return;
          }
          
          let decryptedValue = e.newValue;
          if (opts.encrypt) {
            decryptedValue = storageEncryption.decrypt(e.newValue);
          }
          
          const newValue = JSON.parse(decryptedValue);
          setStoredValue(newValue);
          setError(null);
        } catch (error) {
          const err = error instanceof Error ? error : new Error('Storage sync error');
          console.error(`Error parsing localStorage change for key "${key}":`, err);
          setError(err);
          
          if (opts.onError) {
            opts.onError(err, key);
          }
        }
      }
    };

    window.addEventListener('secureStorageChange', handleStorageChange as EventListener);
    window.addEventListener('storage', handleNativeStorageChange);

    return () => {
      window.removeEventListener('secureStorageChange', handleStorageChange as EventListener);
      window.removeEventListener('storage', handleNativeStorageChange);
    };
  }, [key, initialValue, opts]);

  return [storedValue, setValue, removeValue, error];
}