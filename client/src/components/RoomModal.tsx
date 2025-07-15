import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';
import { useSocket } from '@/hooks/useSocket';
import { useToast } from '@/hooks/use-toast';
import { GameType, RoomInfo } from '@shared/schema';
import { Gamepad2, Grid3X3, Target, Users, Plus, Wallet } from 'lucide-react';

interface RoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameType?: GameType;
}

const stakeOptions = [
  { value: 5, label: 'K5', tier: 'Entry' },
  { value: 10, label: 'K10', tier: 'Bronze' },
  { value: 50, label: 'K50', tier: 'Silver' },
  { value: 100, label: 'K100', tier: 'Gold' },
  { value: 500, label: 'K500', tier: 'Platinum' },
  { value: 1000, label: 'K1000', tier: 'Diamond' },
  { value: 5000, label: 'K5000', tier: 'Elite' }
];

const gameIcons = {
  njuga: Gamepad2,
  shansha: Grid3X3,
  chinshingwa: Target
};

export function RoomModal({ isOpen, onClose, gameType }: RoomModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedStake, setSelectedStake] = useState(100);

  const joinRoomMutation = useMutation({
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

  const handleJoinRoom = async (room: RoomInfo) => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'Please sign in first',
        variant: 'destructive'
      });
      return;
    }

    if (user.balance < room.stakes) {
      toast({
        title: 'Insufficient Balance',
        description: `You need at least K${room.stakes} to join this room`,
        variant: 'destructive'
      });
      return;
    }

    try {
      await apiRequest('POST', `/api/rooms/${room.id}/join`, { stakes: room.stakes });
      joinRoom(user.id, room.id, room.stakes);
      onClose();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to join room',
        variant: 'destructive'
      });
    }
  };

  const handleCreateRoom = () => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'Please sign in first',
        variant: 'destructive'
      });
      return;
    }

    if (user.balance < selectedStake) {
      toast({
        title: 'Insufficient Balance',
        description: `You need at least K${selectedStake} to create this room`,
        variant: 'destructive'
      });
      return;
    }

    createRoomMutation.mutate({
      gameType: gameType || 'njuga',
      stakes: selectedStake
    });
  };

  const filteredRooms = roomsData?.rooms?.filter((room: RoomInfo) => 
    !gameType || room.gameType === gameType
  ) || [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Select Room & Stakes</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Stakes Selection */}
          <div>
            <h3 className="text-lg font-medium mb-3">Choose Stakes</h3>
            <div className="grid grid-cols-3 md:grid-cols-7 gap-2">
              {stakeOptions.map((stake) => (
                <Button
                  key={stake.value}
                  variant={selectedStake === stake.value ? "default" : "outline"}
                  className="flex flex-col p-3 h-auto"
                  onClick={() => setSelectedStake(stake.value)}
                >
                  <div className="text-sm font-medium">{stake.label}</div>
                  <div className="text-xs text-muted-foreground">{stake.tier}</div>
                </Button>
              ))}
            </div>
          </div>
          
          {/* Available Rooms */}
          <div>
            <h3 className="text-lg font-medium mb-3">Available Rooms</h3>
            {isLoading ? (
              <div className="text-center py-8">Loading rooms...</div>
            ) : filteredRooms.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No rooms available. Create a new one!
              </div>
            ) : (
              <div className="space-y-3">
                {filteredRooms.map((room: RoomInfo) => {
                  const Icon = gameIcons[room.gameType];
                  return (
                    <Card key={room.id}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                              <Icon className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                              <h4 className="font-medium">{room.name}</h4>
                              <p className="text-sm text-muted-foreground">
                                {room.currentPlayers}/{room.maxPlayers} players • 
                                Stakes: K{room.stakes} • 
                                <span className={room.status === 'waiting' ? 'text-green-500' : 'text-yellow-500'}>
                                  {room.status === 'waiting' ? 'Waiting for players' : 'In progress'}
                                </span>
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="flex -space-x-2">
                              {room.players.map((player, index) => (
                                <div
                                  key={player.id}
                                  className={`w-8 h-8 rounded-full border-2 border-background flex items-center justify-center text-xs font-medium text-white ${
                                    index % 3 === 0 ? 'bg-blue-500' : 
                                    index % 3 === 1 ? 'bg-green-500' : 'bg-purple-500'
                                  }`}
                                >
                                  {player.displayName.charAt(0).toUpperCase()}
                                </div>
                              ))}
                            </div>
                            <Button
                              onClick={() => handleJoinRoom(room)}
                              disabled={room.status !== 'waiting' || room.currentPlayers >= room.maxPlayers}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Users className="h-4 w-4 mr-1" />
                              Join Room
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
          
          {/* Create New Room */}
          <div className="pt-4 border-t">
            <Button 
              onClick={handleCreateRoom}
              disabled={createRoomMutation.isPending}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              {createRoomMutation.isPending ? 'Creating...' : 'Create New Room'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
