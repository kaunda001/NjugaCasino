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
            <Form {...signInForm}>
              <form onSubmit={signInForm.handleSubmit(handleSignIn)} className="space-y-4">
                <FormField
                  control={signInForm.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="+1 234 567 8900"
                            className="pl-10"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={signInForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="password"
                            placeholder="Enter your password"
                            className="pl-10"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit"
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? 'Signing In...' : 'Sign In'}
                </Button>
              </form>
            </Form>
          ) : (
            <Form {...signUpForm}>
              <form onSubmit={signUpForm.handleSubmit(handleSignUp)} className="space-y-4">
                <FormField
                  control={signUpForm.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="+1 234 567 8900"
                            className="pl-10"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={signUpForm.control}
                  name="displayName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display Name</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Your display name"
                            className="pl-10"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={signUpForm.control}
                  name="dateOfBirth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date of Birth (Must be 18+)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="date"
                            className="pl-10"
                            max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={signUpForm.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <div className="flex items-center">
                              <Globe className="h-4 w-4 mr-2 text-muted-foreground" />
                              <SelectValue placeholder="Select your country" />
                            </div>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {countries.map((country) => (
                            <SelectItem key={country.value} value={country.value}>
                              {country.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={signUpForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="password"
                            placeholder="Create a password (min 6 characters)"
                            className="pl-10"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={signUpForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="password"
                            placeholder="Confirm your password"
                            className="pl-10"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit"
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? 'Creating Account...' : 'Create Account'}
                </Button>
              </form>
            </Form>
          )}
          
          <p className="text-xs text-muted-foreground text-center">
            By {mode === 'signin' ? 'signing in' : 'creating an account'}, you agree to our Terms of Service and Privacy Policy. You must be 18 or older to use this service.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
