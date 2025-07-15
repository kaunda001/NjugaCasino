import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Wallet, CreditCard, Phone, ArrowUpRight, ArrowDownLeft, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WalletModal({ isOpen, onClose }: WalletModalProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('deposit');
  const [amount, setAmount] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [provider, setProvider] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDeposit = async () => {
    if (!amount || !phoneNumber || !provider) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields',
        variant: 'destructive'
      });
      return;
    }

    setIsProcessing(true);
    
    // Simulate API call
    setTimeout(() => {
      toast({
        title: 'Deposit Initiated',
        description: `A deposit request for K${amount} has been sent to ${phoneNumber}. Please check your phone for the payment prompt.`,
      });
      setIsProcessing(false);
      onClose();
    }, 2000);
  };

  const handleWithdraw = async () => {
    if (!amount || !phoneNumber || !provider) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields',
        variant: 'destructive'
      });
      return;
    }

    setIsProcessing(true);
    
    // Simulate API call
    setTimeout(() => {
      toast({
        title: 'Withdrawal Initiated',
        description: `A withdrawal of K${amount} has been initiated to ${phoneNumber}. Funds will be transferred within 5 minutes.`,
      });
      setIsProcessing(false);
      onClose();
    }, 2000);
  };

  const resetForm = () => {
    setAmount('');
    setPhoneNumber('');
    setProvider('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Wallet Management
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="deposit" className="flex items-center gap-2">
              <ArrowDownLeft className="h-4 w-4" />
              Deposit
            </TabsTrigger>
            <TabsTrigger value="withdraw" className="flex items-center gap-2">
              <ArrowUpRight className="h-4 w-4" />
              Withdraw
            </TabsTrigger>
          </TabsList>

          <TabsContent value="deposit" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Deposit Funds</CardTitle>
                <CardDescription>
                  Add money to your Njuga wallet using mobile money
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="deposit-amount">Amount (ZMW)</Label>
                  <Input
                    id="deposit-amount"
                    type="number"
                    placeholder="Enter amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    min="1"
                    step="0.01"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deposit-provider">Mobile Money Provider</Label>
                  <Select value={provider} onValueChange={setProvider}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select provider" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="airtel">
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          Airtel Money
                        </div>
                      </SelectItem>
                      <SelectItem value="mtn">
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          MTN Mobile Money
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deposit-phone">Phone Number</Label>
                  <Input
                    id="deposit-phone"
                    type="tel"
                    placeholder="+260 xxx xxx xxx"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                  />
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                    <div className="text-sm text-blue-800 dark:text-blue-200">
                      <p className="font-medium">How it works:</p>
                      <p>1. Enter amount and phone number</p>
                      <p>2. You'll receive a payment prompt on your phone</p>
                      <p>3. Confirm payment to complete deposit</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={handleDeposit} 
                    disabled={isProcessing}
                    className="flex-1"
                  >
                    {isProcessing ? 'Processing...' : 'Deposit Funds'}
                  </Button>
                  <Button variant="outline" onClick={resetForm}>
                    Clear
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="withdraw" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Withdraw Funds</CardTitle>
                <CardDescription>
                  Transfer money from your Njuga wallet to mobile money
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="withdraw-amount">Amount (ZMW)</Label>
                  <Input
                    id="withdraw-amount"
                    type="number"
                    placeholder="Enter amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    min="1"
                    step="0.01"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="withdraw-provider">Mobile Money Provider</Label>
                  <Select value={provider} onValueChange={setProvider}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select provider" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="airtel">
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          Airtel Money
                        </div>
                      </SelectItem>
                      <SelectItem value="mtn">
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          MTN Mobile Money
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="withdraw-phone">Phone Number</Label>
                  <Input
                    id="withdraw-phone"
                    type="tel"
                    placeholder="+260 xxx xxx xxx"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                  />
                </div>

                <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
                    <div className="text-sm text-amber-800 dark:text-amber-200">
                      <p className="font-medium">Withdrawal Info:</p>
                      <p>• Minimum withdrawal: K20</p>
                      <p>• Processing time: 5 minutes</p>
                      <p>• Small processing fee applies</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={handleWithdraw} 
                    disabled={isProcessing}
                    className="flex-1"
                  >
                    {isProcessing ? 'Processing...' : 'Withdraw Funds'}
                  </Button>
                  <Button variant="outline" onClick={resetForm}>
                    Clear
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}