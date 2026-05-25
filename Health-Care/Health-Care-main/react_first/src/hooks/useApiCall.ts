// useApiCall.ts - Custom hook for API calls with better error handling
import { useState, useCallback } from 'react';
import { apiCall, APIError, getErrorMessage } from '../lib/api';

interface UseApiCallState<T> {
  data: T | null;
  error: APIError | null;
  isLoading: boolean;
}

interface UseApiCallOptions {
  onSuccess?: (data: unknown) => void;
  onError?: (error: APIError) => void;
}

/**
 * Custom Hook للـ API calls مع:
 * ✅ State management (loading, error, data)
 * ✅ Automatic error handling
 * ✅ Callbacks على success/error
 * ✅ Reload function
 */
export function useApiCall<T>(options?: UseApiCallOptions) {
  const [state, setState] = useState<UseApiCallState<T>>({
    data: null,
    error: null,
    isLoading: false,
  });

  const execute = useCallback(
    async (endpoint: string, fetchOptions?: RequestInit) => {
      setState({ data: null, error: null, isLoading: true });

      try {
        const result = await apiCall<T>(endpoint, fetchOptions);
        setState({ data: result, error: null, isLoading: false });
        
        if (options?.onSuccess) {
          options.onSuccess(result);
        }
        
        return result;
      } catch (error) {
        const apiError = error instanceof APIError 
          ? error 
          : new APIError('UNKNOWN_ERROR', undefined, error as Error);
        
        setState({ data: null, error: apiError, isLoading: false });
        
        if (options?.onError) {
          options.onError(apiError);
        }
        
        throw apiError;
      }
    },
    [options]
  );

  const reset = useCallback(() => {
    setState({ data: null, error: null, isLoading: false });
  }, []);

  return {
    ...state,
    execute,
    reset,
    errorMessage: state.error ? getErrorMessage(state.error) : null,
  };
}
