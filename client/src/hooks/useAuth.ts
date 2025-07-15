import { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { SignInData, SignUpData } from '@shared/schema';

interface User {
  id: number;
  phoneNumber: string;
  displayName: string;
  balance: number;
  dateOfBirth: string;
  country: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      // Verify token with backend
      verifyToken(token);
    } else {
      setIsLoading(false);
    }
  }, []);

  const verifyToken = async (token: string) => {
    try {
      const response = await fetch('/api/auth/verify', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        localStorage.removeItem('authToken');
      }
    } catch (error) {
      console.error('Error verifying token:', error);
      localStorage.removeItem('authToken');
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (data: SignUpData): Promise<void> => {
    try {
      const response = await apiRequest('POST', '/api/auth/signup', data);
      const result = await response.json();
      setUser(result.user);
      localStorage.setItem('authToken', result.token);
      
      // Force redirect to dashboard after successful signup
      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  };

  const signIn = async (data: SignInData): Promise<void> => {
    try {
      const response = await apiRequest('POST', '/api/auth/signin', data);
      const result = await response.json();
      setUser(result.user);
      localStorage.setItem('authToken', result.token);
      
      // Force redirect to dashboard after successful login
      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      setUser(null);
      localStorage.removeItem('authToken');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const getToken = async (): Promise<string | null> => {
    return localStorage.getItem('authToken');
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    signUp,
    signIn,
    signOut,
    getToken
  };
}