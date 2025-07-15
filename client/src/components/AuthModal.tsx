import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { signUpSchema, signInSchema, SignUpData, SignInData } from '@shared/schema';
import { Shield } from 'lucide-react';
import { SignInForm } from './SignInForm';
import { SignUpForm } from './SignUpForm';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [isLoading, setIsLoading] = useState(false);

  const signInForm = useForm<SignInData>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      phoneNumber: '',
      password: ''
    }
  });

  const signUpForm = useForm<SignUpData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      phoneNumber: '',
      password: '',
      confirmPassword: '',
      displayName: '',
      dateOfBirth: '',
      country: 'ZM'
    }
  });

  const handleSignIn = async (data: SignInData) => {
    setIsLoading(true);
    try {
      await signIn(data);
      toast({
        title: 'Success',
        description: 'Successfully signed in!'
      });
      onClose();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to sign in',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (data: SignUpData) => {
    setIsLoading(true);
    try {
      await signUp(data);
      toast({
        title: 'Success',
        description: 'Account created successfully!'
      });
      onClose();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create account',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Reset forms when switching modes
  const handleModeChange = (newMode: 'signin' | 'signup') => {
    setMode(newMode);
    
    // Reset both forms to their default values
    signInForm.reset({
      phoneNumber: '',
      password: ''
    });
    
    signUpForm.reset({
      phoneNumber: '',
      password: '',
      confirmPassword: '',
      displayName: '',
      dateOfBirth: '',
      country: 'ZM'
    });
  };

  // Reset forms when modal opens
  React.useEffect(() => {
    if (isOpen) {
      signInForm.reset({
        phoneNumber: '',
        password: ''
      });
      
      signUpForm.reset({
        phoneNumber: '',
        password: '',
        confirmPassword: '',
        displayName: '',
        dateOfBirth: '',
        country: 'ZM'
      });
    }
  }, [isOpen, signInForm, signUpForm]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        onClose();
      }
    }}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            {mode === 'signin' ? 'Sign In to Njuga' : 'Create Njuga Account'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Mode Toggle */}
          <div className="flex gap-2">
            <Button
              variant={mode === 'signin' ? 'default' : 'outline'}
              onClick={() => handleModeChange('signin')}
              className="flex-1"
            >
              Sign In
            </Button>
            <Button
              variant={mode === 'signup' ? 'default' : 'outline'}
              onClick={() => handleModeChange('signup')}
              className="flex-1"
            >
              Sign Up
            </Button>
          </div>

          {mode === 'signin' ? (
            <SignInForm 
              form={signInForm}
              onSubmit={handleSignIn}
              isLoading={isLoading}
            />
          ) : (
            <SignUpForm 
              form={signUpForm}
              onSubmit={handleSignUp}
              isLoading={isLoading}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}