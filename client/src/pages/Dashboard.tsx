
import React, { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSocket } from "@/hooks/useSocket";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { GameJoinModal } from "@/components/GameJoinModal";
import { GameType } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Gamepad2, Grid3X3, Target, Wallet } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { socket } = useSocket();
  const queryClient = useQueryClient();
  const [showGameJoinModal, setShowGameJoinModal] = useState(false);
  const [selectedGameType, setSelectedGameType] = useState<GameType | undefined>();

  const joinGameMutation = useMutation({
    mutationFn: async (data: { gameType: GameType; stakes: number }) => {
      const response = await apiRequest('POST', '/api/rooms/join', data);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/rooms'] });
      toast({
        title: 'Success',
        description: 'Joined game successfully!',
        variant: 'default'
      });
      // Navigate to game room (this would be handled by WebSocket updates)
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to join game',
        variant: 'destructive'
      });
    }
  });

  const handleGameSelect = (gameType: GameType) => {
    setSelectedGameType(gameType);
    setShowGameJoinModal(true);
  };

  const gameOptions = [
    {
      type: 'njuga' as GameType,
      name: 'Njuga',
      description: '2-6 players • Card matching game',
      icon: Gamepad2,
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      type: 'shansha' as GameType,
      name: 'Shansha',
      description: '2 players • Strategy grid game',
      icon: Grid3X3,
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      type: 'chinshingwa' as GameType,
      name: 'Chinshingwa',
      description: '2 players • Brazilian checkers',
      icon: Target,
      color: 'bg-red-500 hover:bg-red-600'
    }
  ];

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">Please sign in to continue</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Welcome, {user.displayName}!</h1>
          <p className="text-muted-foreground">Choose a game to start playing</p>
        </div>
        <div className="flex items-center space-x-2">
          <Wallet className="h-5 w-5 text-muted-foreground" />
          <Badge variant="outline" className="text-lg px-3 py-1">
            K{user.balance}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {gameOptions.map((game) => {
          const Icon = game.icon;
          return (
            <Card key={game.type} className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${game.color}`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">{game.name}</CardTitle>
                    <CardDescription>{game.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => handleGameSelect(game.type)}
                  className="w-full"
                  disabled={joinGameMutation.isPending}
                >
                  {joinGameMutation.isPending ? 'Joining...' : 'Play Now'}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <GameJoinModal
        isOpen={showGameJoinModal}
        onClose={() => setShowGameJoinModal(false)}
        gameType={selectedGameType}
      />
    </div>
  );
}
