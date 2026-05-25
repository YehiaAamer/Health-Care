// src/hooks/useAuth.ts
import { useContext } from 'react';
import { AuthContext, AuthContextType } from '@/contexts/AuthContext';

/**
 * Custom Hook للوصول لـ auth context
 * 
 * الاستخدام:
 * ```tsx
 * const { user, login, logout, isAuthenticated } = useAuth();
 * ```
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error(
      '❌ useAuth يجب أن يُستخدم داخل <AuthProvider>'
    );
  }
  
  return context;
}
