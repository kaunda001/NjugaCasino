import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSocket } from '@/hooks/useSocket';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, Clock, Users, ArrowLeft, Target, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { RoomInfo, PlayerInfo, ShanshaGameState } from '@shared/schema';

interface ShanshaRoomProps {
  room: RoomInfo;
  onLeave: () => void;
}

export default function ShanshaRoom({ room, onLeave }: ShanshaRoomProps) {
  const { user } = useAuth();
  const { socket } = useSocket();
  const { toast } = useToast();
  
  const [gameState, setGameState] = useState<ShanshaGameState | null>(null);
  const [timeLeft, setTimeLeft] = useState(20);
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [chipsPlaced, setChipsPlaced] = useState(false);
  const [selectedChip, setSelectedChip] = useState<number | null>(null);
  const [myGrid, setMyGrid] = useState<(number | null)[][]>(Array(4).fill(null).map(() => Array(6).fill(null)));
  const [chipValues] = useState<number[]>([20, 10, 10, 5, 5]); // For K50 room

  useEffect(() => {
    if (socket && user) {
      socket.send(JSON.stringify({
        type: 'joinRoom',
        data: { roomId: room.id, stakes: room.stakes }
      }));

      const handleMessage = (event: MessageEvent) => {
        const message = JSON.parse(event.data);
        
        switch (message.type) {
          case 'gameState':
            setGameState(message.data);
            setIsMyTurn(message.data.currentTurn === user.id.toString());
            setGameStarted(true);
            break;
          case 'turnTimer':
            setTimeLeft(message.data.timeLeft);
            break;
          case 'gameWinner':
            setGameStarted(false);
            if (message.data.winnerId === user.id.toString()) {
              toast({
                title: '🎉 Congratulations!',
                description: `You won K${message.data.winnings}!`,
              });
            }
            break;
          case 'chipPlacement':
            if (message.data.playerId === user.id.toString()) {
              setChipsPlaced(true);
            }
            break;
        }
      };

      socket.addEventListener('message', handleMessage);
      return () => socket.removeEventListener('message', handleMessage);
    }
  }, [socket, user, room.id, room.stakes, toast]);

  const handleReady = () => {
    if (socket && user && chipsPlaced) {
      socket.send(JSON.stringify({
        type: 'toggleReady',
        data: { roomId: room.id }
      }));
      setIsReady(!isReady);
    }
  };

  const handleChipPlacement = (row: number, col: number) => {
    if (selectedChip !== null && !gameStarted) {
      const newGrid = [...myGrid];
      newGrid[row][col] = chipValues[selectedChip];
      setMyGrid(newGrid);
      
      // Remove the placed chip from available chips
      setSelectedChip(null);
      
      // Check if all chips are placed
      const placedChips = myGrid.flat().filter(cell => cell !== null).length;
      if (placedChips === 4) { // 5 chips total - 1 just placed
        setChipsPlaced(true);
        
        // Send chip placement to server
        socket?.send(JSON.stringify({
          type: 'gameAction',
          data: {
            roomId: room.id,
            action: 'placeChips',
            data: { grid: newGrid }
          }
        }));
      }
    }
  };

  const handleGuess = (row: number, col: number) => {
    if (socket && user && isMyTurn && gameStarted) {
      socket.send(JSON.stringify({
        type: 'gameAction',
        data: {
          roomId: room.id,
          action: 'guess',
          data: { x: col, y: row }
        }
      }));
    }
  };

  const handleForfeit = () => {
    if (socket && user) {
      socket.send(JSON.stringify({
        type: 'gameAction',
        data: { 
          roomId: room.id, 
          action: 'forfeit',
          data: {}
        }
      }));
    }
  };

  const renderGrid = (isMyGrid: boolean) => {
    const grid = isMyGrid ? myGrid : Array(4).fill(null).map(() => Array(6).fill(null));
    const guesses = gameState?.guesses?.[user?.id?.toString() || ''] || [];
    
    return (
      <div className="grid grid-cols-6 gap-1 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
        {grid.map((row, rowIndex) =>
          row.map((cell, colIndex) => {
            const guess = guesses.find(g => g.x === colIndex && g.y === rowIndex);
            const isGuessed = guess !== undefined;
            const isHit = guess?.hit || false;
            const hasChip = cell !== null;
            
            return (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={`
                  w-12 h-12 border-2 rounded-lg flex items-center justify-center cursor-pointer
                  transition-all duration-200 text-xs font-bold
                  ${isMyGrid && !gameStarted ? 'hover:bg-blue-100 dark:hover:bg-blue-900' : ''}
                  ${isMyGrid && hasChip ? 'bg-green-200 dark:bg-green-800 border-green-400' : 'bg-white dark:bg-gray-700 border-gray-300'}
                  ${!isMyGrid && isGuessed && isHit ? 'bg-green-500 border-green-600 text-white' : ''}
                  ${!isMyGrid && isGuessed && !isHit ? 'bg-red-500 border-red-600 text-white' : ''}
                  ${!isMyGrid && !isGuessed && gameStarted && isMyTurn ? 'hover:bg-blue-100 dark:hover:bg-blue-900' : ''}
                `}
                onClick={() => {
                  if (isMyGrid && !gameStarted) {
                    handleChipPlacement(rowIndex, colIndex);
                  } else if (!isMyGrid && !isGuessed && gameStarted && isMyTurn) {
                    handleGuess(rowIndex, colIndex);
                  }
                }}
              >
                {isMyGrid && hasChip && (
                  <span className="text-green-800 dark:text-green-200">
                    K{cell}
                  </span>
                )}
                {!isMyGrid && isGuessed && (
                  <span className="text-white">
                    {isHit ? '✓' : '✗'}
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>
    );
  };

  const availableChips = chipValues.filter((_, index) => {
    const placedCount = myGrid.flat().filter(cell => cell === chipValues[index]).length;
    return placedCount === 0;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={onLeave} size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Leave Room
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-green-700 dark:text-green-300">
                {room.name} - Shansha
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Stakes: K{room.stakes} • Pot: K{room.pot}
              </p>
            </div>
          </div>
          
          {gameStarted && (
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span className="text-sm font-medium">{timeLeft}s</span>
                <Progress value={(timeLeft / 20) * 100} className="w-20" />
              </div>
              {isMyTurn && (
                <Badge variant="default" className="bg-green-500">
                  Your Turn
                </Badge>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* My Grid */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5" />
                  <span>Your Grid (Place Chips)</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {renderGrid(true)}
                
                {!gameStarted && !chipsPlaced && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                      Select a chip value, then click on the grid to place it:
                    </p>
                    <div className="flex space-x-2">
                      {availableChips.map((value, index) => (
                        <Button
                          key={index}
                          variant={selectedChip === chipValues.indexOf(value) ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedChip(chipValues.indexOf(value))}
                        >
                          K{value}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Opponent's Grid */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Eye className="h-5 w-5" />
                  <span>Opponent's Grid (Make Guesses)</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {renderGrid(false)}
                
                {gameStarted && isMyTurn && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Click on a tile to guess if there's a chip there
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Players Panel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Players ({room.players.length}/2)</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {room.players.map((player: PlayerInfo) => (
                <div key={player.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {player.displayName?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{player.displayName}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-300">
                        K{player.balance}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {gameState?.currentTurn === player.id && (
                      <Badge variant="default" size="sm">Turn</Badge>
                    )}
                    {player.isReady && !gameStarted && (
                      <Badge variant="outline" size="sm">Ready</Badge>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Game Controls */}
          <Card>
            <CardHeader>
              <CardTitle>Game Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {!gameStarted && (
                <Button
                  onClick={handleReady}
                  variant={isReady ? "default" : "outline"}
                  className="w-full"
                  disabled={!chipsPlaced}
                >
                  {isReady ? "Ready ✓" : chipsPlaced ? "Ready Up" : "Place Chips First"}
                </Button>
              )}
              
              {gameStarted && (
                <Button
                  onClick={handleForfeit}
                  variant="destructive"
                  className="w-full"
                >
                  Forfeit Game
                </Button>
              )}
              
              <div className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
                <p>• Place 5 chips on your 4x6 grid</p>
                <p>• Guess opponent's chip locations</p>
                <p>• Hit chips redistribute to your remaining chips</p>
                <p>• Win by capturing all opponent chips</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Game Rules */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5" />
              <span>Shansha Rules</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <div>
              <p className="font-medium">Setup:</p>
              <p>• Each player places 5 chips on their 4x6 grid</p>
              <p>• Chip values: K20, K10, K10, K5, K5 (for K50 room)</p>
            </div>
            <div>
              <p className="font-medium">Gameplay:</p>
              <p>• Take turns guessing opponent's chip locations</p>
              <p>• Hit chips: Amount redistributed to your remaining chips</p>
              <p>• Miss: Red highlight, turn passes to opponent</p>
              <p>• Win: Capture all opponent chips or they forfeit</p>
            </div>
            <div>
              <p className="font-medium">Payouts:</p>
              <p>• Winner: 85% of pot</p>
              <p>• House: 15% of pot</p>
              <p>• Forfeit: House 5%, Opponent 15%, Forfeiter 80%</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}