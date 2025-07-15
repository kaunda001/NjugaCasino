import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useSocket } from '@/hooks/useSocket';
import { useToast } from '@/hooks/use-toast';
import { RoomInfo } from '@shared/schema';
import { ArrowLeft, Clock, Wallet, Check, Flag, Users } from 'lucide-react';
import { NjugaGame } from './GameComponents/NjugaGame';
import { ShanshaGame } from './GameComponents/ShanshaGame';
import { ChinshingwaGame } from './GameComponents/ChinshingwaGame';

interface GameRoomProps {
  room: RoomInfo;
  onLeave: () => void;
}

export function GameRoom({ room, onLeave }: GameRoomProps) {
  const { user } = useAuth();
  const { leaveRoom, toggleReady } = useSocket();
  const { toast } = useToast();
  const [gameTimer, setGameTimer] = useState(0);

  // Early return if user is not loaded
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading user data...</p>
        </div>
      </div>
    );
  }

  const currentPlayer = room.players.find(p => p.userId === user?.id);
  const isMyTurn = room.gameState && (room.gameState as any).currentTurn === user?.id.toString();

  const handleLeave = () => {
    if (user?.id) {
      leaveRoom(user.id, room.id);
    }
    onLeave();
  };

  const handleToggleReady = () => {
    if (user?.id) {
      toggleReady(user.id, room.id);
    }
  };

  const handleForfeit = () => {
    toast({
      title: 'Forfeit',
      description: 'You forfeit 20% of your stake',
      variant: 'destructive'
    });
    // Implement forfeit logic
  };

  const renderGameComponent = () => {
    switch (room.gameType) {
      case 'njuga':
        return <NjugaGame room={room} />;
      case 'shansha':
        return <ShanshaGame room={room} />;
      case 'chinshingwa':
        return <ChinshingwaGame room={room} />;
      default:
        return <div>Unknown game type</div>;
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900 z-50 flex flex-col">
      {/* Room Header */}
      <div className="bg-slate-800 border-b border-slate-700 px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLeave}
              className="text-slate-400 hover:text-red-400"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h2 className="text-xl font-semibold text-white">{room.name}</h2>
              <p className="text-sm text-slate-400">
                Stakes: K{room.stakes} • 
                Pot: <span className="text-green-400">K{room.pot}</span> • 
                House: <span className="text-yellow-400">15%</span>
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Badge variant="outline" className="text-blue-400 border-blue-400">
              <Clock className="h-3 w-3 mr-1" />
              {Math.floor(gameTimer / 60)}:{(gameTimer % 60).toString().padStart(2, '0')}
            </Badge>
            <Badge variant="outline" className="text-green-400 border-green-400">
              <Wallet className="h-3 w-3 mr-1" />
              K{user?.balance || 0}
            </Badge>
          </div>
        </div>
      </div>
      
      {/* Game Area */}
      <div className="flex-1 flex">
        {/* Game Board */}
        <div className="flex-1 p-6">
          <div className="h-full bg-slate-800 rounded-xl p-6 flex flex-col">
            {/* Game Status */}
            <div className="text-center mb-6">
              <div className="text-lg font-semibold text-blue-400 mb-2">
                {room.status === 'waiting' ? 'Waiting for players' : 
                 room.status === 'playing' ? (isMyTurn ? 'Your Turn' : 'Waiting for turn') : 
                 'Game Finished'}
              </div>
              <div className="text-sm text-slate-400">
                {room.status === 'waiting' ? 'All players need to be ready to start' :
                 room.status === 'playing' ? 'Make your move' :
                 'Game has ended'}
              </div>
            </div>
            
            {/* Game Component */}
            {renderGameComponent()}
          </div>
        </div>
        
        {/* Players Panel */}
        <div className="w-80 bg-slate-800 border-l border-slate-700 p-4">
          <h3 className="text-lg font-medium mb-4 text-white">Players</h3>
          <div className="space-y-3">
            {room.players.map((player) => (
              <Card key={player.id} className={`${
                player.userId === user?.id ? 'border-blue-500' : 'border-slate-700'
              }`}>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                        player.userId === user?.id ? 'bg-blue-500' : 'bg-slate-600'
                      }`}>
                        {player.displayName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-white">
                          {player.displayName}
                          {player.userId === user?.id && (
                            <span className="text-xs text-blue-400 ml-1">(You)</span>
                          )}
                        </p>
                        <p className="text-xs text-slate-400">
                          {player.isReady ? (
                            <span className="text-green-400">Ready</span>
                          ) : (
                            <span className="text-yellow-400">Not Ready</span>
                          )}
                          {room.gameState && (
                            <span className="ml-2">
                              {(room.gameState as any).currentTurn === player.userId.toString() && (
                                <span className="text-blue-400">• Turn</span>
                              )}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-green-400">K{player.balance}</div>
                      <div className="text-xs text-slate-400">Balance</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Room Controls */}
          <div className="mt-6 space-y-2">
            {room.status === 'waiting' && (
              <Button
                onClick={handleToggleReady}
                variant={currentPlayer?.isReady ? "secondary" : "default"}
                className="w-full"
              >
                <Check className="h-4 w-4 mr-2" />
                {currentPlayer?.isReady ? 'Ready' : 'Not Ready'}
              </Button>
            )}
            
            {room.status === 'playing' && (
              <Button
                onClick={handleForfeit}
                variant="destructive"
                className="w-full"
              >
                <Flag className="h-4 w-4 mr-2" />
                Forfeit (20% penalty)
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
