import { useState, useCallback } from 'react';

interface LoadingState {
  isLoading: boolean;
  error: string | null;
  success: boolean;
}

interface UseLoadingStateOptions {
  successDuration?: number; // How long to show success state (ms)
  resetOnError?: boolean; // Reset to initial state when error occurs
}

export function useLoadingState(options: UseLoadingStateOptions = {}) {
  const { successDuration = 2000, resetOnError = true } = options;
  
  const [state, setState] = useState<LoadingState>({
    isLoading: false,
    error: null,
    success: false
  });

  const setLoading = useCallback(() => {
    setState({
      isLoading: true,
      error: null,
      success: false
    });
  }, []);

  const setSuccess = useCallback(() => {
    setState({
      isLoading: false,
      error: null,
      success: true
    });

    // Auto-reset success state after duration
    if (successDuration > 0) {
      setTimeout(() => {
        setState(prev => ({
          ...prev,
          success: false
        }));
      }, successDuration);
    }
  }, [successDuration]);

  const setError = useCallback((error: string | Error) => {
    const errorMessage = error instanceof Error ? error.message : error;
    
    setState({
      isLoading: false,
      error: errorMessage,
      success: false
    });

    if (resetOnError) {
      // Auto-reset error state after 5 seconds
      setTimeout(() => {
        setState(prev => ({
          ...prev,
          error: null
        }));
      }, 5000);
    }
  }, [resetOnError]);

  const reset = useCallback(() => {
    setState({
      isLoading: false,
      error: null,
      success: false
    });
  }, []);

  // Utility function to wrap async operations
  const execute = useCallback(async <T>(
    asyncOperation: () => Promise<T>,
    options: {
      onSuccess?: (result: T) => void;
      onError?: (error: Error) => void;
      showSuccess?: boolean;
    } = {}
  ): Promise<T | null> => {
    const { onSuccess, onError, showSuccess = true } = options;
    
    setLoading();
    
    try {
      const result = await asyncOperation();
      
      if (showSuccess) {
        setSuccess();
      } else {
        reset();
      }
      
      onSuccess?.(result);
      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      setError(err);
      onError?.(err);
      return null;
    }
  }, [setLoading, setSuccess, setError, reset]);

  return {
    ...state,
    setLoading,
    setSuccess,
    setError,
    reset,
    execute
  };
}

// Specialized hook for form submissions
export function useFormSubmission() {
  const loading = useLoadingState({ successDuration: 3000 });
  
  const submitForm = useCallback(async <T>(
    formData: T,
    submitFunction: (data: T) => Promise<void>,
    options: {
      onSuccess?: () => void;
      onError?: (error: Error) => void;
      successMessage?: string;
    } = {}
  ) => {
    return loading.execute(
      () => submitFunction(formData),
      {
        onSuccess: () => {
          options.onSuccess?.();
        },
        onError: options.onError,
        showSuccess: true
      }
    );
  }, [loading]);

  return {
    ...loading,
    submitForm
  };
}