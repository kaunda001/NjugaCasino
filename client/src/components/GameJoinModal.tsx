import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { GameType } from '@shared/schema';
import { Gamepad2, Grid3X3, Target, Wallet } from 'lucide-react';

interface GameJoinModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameType?: GameType;
}

const stakeOptions = {
  njuga: [
    { value: 5, label: 'K5', tier: 'Entry' },
    { value: 10, label: 'K10', tier: 'Bronze' },
    { value: 50, label: 'K50', tier: 'Silver' },
    { value: 100, label: 'K100', tier: 'Gold' },
    { value: 500, label: 'K500', tier: 'Platinum' },
    { value: 1000, label: 'K1000', tier: 'Diamond' },
    { value: 5000, label: 'K5000', tier: 'Elite' }
  ],
  shansha: [
    { value: 50, label: 'K50', tier: 'Silver' },
    { value: 100, label: 'K100', tier: 'Gold' },
    { value: 500, label: 'K500', tier: 'Platinum' },
    { value: 1000, label: 'K1000', tier: 'Diamond' },
    { value: 5000, label: 'K5000', tier: 'Elite' }
  ],
  chinshingwa: [
    { value: 50, label: 'K50', tier: 'Silver' },
    { value: 100, label: 'K100', tier: 'Gold' },
    { value: 500, label: 'K500', tier: 'Platinum' },
    { value: 1000, label: 'K1000', tier: 'Diamond' },
    { value: 5000, label: 'K5000', tier: 'Elite' }
  ]
};

const gameIcons = {
  njuga: Gamepad2,
  shansha: Grid3X3,
  chinshingwa: Target
};

const gameNames = {
  njuga: 'Njuga',
  shansha: 'Shansha',
  chinshingwa: 'Chinshingwa'
};

const gameDescriptions = {
  njuga: '2-6 players • Card matching game',
  shansha: '2 players • Strategy grid game',
  chinshingwa: '2 players • Brazilian checkers'
};

export function GameJoinModal({ isOpen, onClose, gameType }: GameJoinModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedStake, setSelectedStake] = useState(100);

  const joinGameMutation = useMutation({
    mutationFn: async (data: { gameType: GameType; stakes: number }) => {
      const response = await apiRequest('POST', '/api/rooms/join', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/rooms'] });
      onClose();
      toast({
        title: 'Success',
        description: 'Joined game successfully!',
        variant: 'default'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to join game',
        variant: 'destructive'
      });
    }
  });

  const handleJoinGame = (selectedGameType: GameType, stakes: number) => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'Please sign in first',
        variant: 'destructive'
      });
      return;
    }

    if (user.balance < stakes) {
      toast({
        title: 'Insufficient Balance',
        description: `You need at least K${stakes} to join this game`,
        variant: 'destructive'
      });
      return;
    }

    joinGameMutation.mutate({ gameType: selectedGameType, stakes });
  };

  const availableStakes = gameType ? stakeOptions[gameType] : stakeOptions.njuga;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {gameType ? `Join ${gameNames[gameType]}` : 'Select Game & Stakes'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Game Selection (if no specific game type) */}
          {!gameType && (
            <div>
              <h3 className="text-lg font-medium mb-3">Choose Game</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(gameNames).map(([type, name]) => {
                  const Icon = gameIcons[type as GameType];
                  return (
                    <Card key={type} className="cursor-pointer hover:bg-muted/50">
                      <CardContent className="p-4">
                        <div className="flex flex-col items-center space-y-2">
                          <Icon className="h-8 w-8 text-primary" />
                          <h4 className="font-medium">{name}</h4>
                          <p className="text-sm text-muted-foreground text-center">
                            {gameDescriptions[type as GameType]}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Stakes Selection */}
          <div>
            <h3 className="text-lg font-medium mb-3">Choose Stakes</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {availableStakes.map((stake) => (
                <Button
                  key={stake.value}
                  variant={selectedStake === stake.value ? "default" : "outline"}
                  className="flex flex-col p-4 h-auto"
                  onClick={() => setSelectedStake(stake.value)}
                >
                  <div className="text-lg font-bold">{stake.label}</div>
                  <div className="text-xs text-muted-foreground">{stake.tier}</div>
                </Button>
              ))}
            </div>
          </div>

          {/* Game Info */}
          {gameType && (
            <div className="bg-muted/20 p-4 rounded-lg">
              <div className="flex items-center space-x-3">
                {(() => {
                  const Icon = gameIcons[gameType];
                  return <Icon className="h-6 w-6 text-primary" />;
                })()}
                <div>
                  <h4 className="font-medium">{gameNames[gameType]}</h4>
                  <p className="text-sm text-muted-foreground">
                    {gameDescriptions[gameType]}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* User Balance */}
          <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
            <div className="flex items-center space-x-2">
              <Wallet className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium">Your Balance</span>
            </div>
            <Badge variant="outline" className="text-sm">
              K{user?.balance || 0}
            </Badge>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={() => handleJoinGame(gameType || 'njuga', selectedStake)}
              disabled={joinGameMutation.isPending || !user || user.balance < selectedStake}
            >
              {joinGameMutation.isPending ? 'Joining...' : `Join Game (K${selectedStake})`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}