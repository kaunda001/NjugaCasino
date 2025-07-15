import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSocket } from '@/hooks/useSocket';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, Clock, Users, ArrowLeft, Crown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { RoomInfo, PlayerInfo, ChinshingwaGameState } from '@shared/schema';

interface ChinshingwaRoomProps {
  room: RoomInfo;
  onLeave: () => void;
}

export default function ChinshingwaRoom({ room, onLeave }: ChinshingwaRoomProps) {
  const { user } = useAuth();
  const { socket } = useSocket();
  const { toast } = useToast();

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
  
  const [gameState, setGameState] = useState<ChinshingwaGameState | null>(null);
  const [timeLeft, setTimeLeft] = useState(20);
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [selectedPiece, setSelectedPiece] = useState<{x: number, y: number} | null>(null);
  const [validMoves, setValidMoves] = useState<{x: number, y: number}[]>([]);
  const [myColor, setMyColor] = useState<'red' | 'black' | null>(null);

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
            setIsMyTurn(message.data.currentTurn === user?.id?.toString());
            setGameStarted(true);
            break;
          case 'playerAssignment':
            setMyColor(message.data.color);
            break;
          case 'turnTimer':
            setTimeLeft(message.data.timeLeft);
            break;
          case 'gameWinner':
            setGameStarted(false);
            if (message.data.winnerId === user?.id?.toString()) {
              toast({
                title: '🎉 Congratulations!',
                description: `You won K${message.data.winnings}!`,
              });
            }
            break;
          case 'validMoves':
            setValidMoves(message.data.moves);
            break;
        }
      };

      socket.addEventListener('message', handleMessage);
      return () => socket.removeEventListener('message', handleMessage);
    }
  }, [socket, user, room.id, room.stakes, toast]);

  const handleReady = () => {
    if (socket && user) {
      socket.send(JSON.stringify({
        type: 'toggleReady',
        data: { roomId: room.id }
      }));
      setIsReady(!isReady);
    }
  };

  const handlePieceClick = (x: number, y: number) => {
    if (!gameStarted || !isMyTurn) return;

    const piece = gameState?.board[y][x];
    
    if (piece && piece.includes(myColor || '')) {
      // Select piece
      setSelectedPiece({x, y});
      
      // Request valid moves from server
      socket?.send(JSON.stringify({
        type: 'gameAction',
        data: {
          roomId: room.id,
          action: 'getValidMoves',
          data: { fromX: x, fromY: y }
        }
      }));
    } else if (selectedPiece) {
      // Try to move piece
      const isValidMove = validMoves.some(move => move.x === x && move.y === y);
      
      if (isValidMove) {
        socket?.send(JSON.stringify({
          type: 'gameAction',
          data: {
            roomId: room.id,
            action: 'movePiece',
            data: {
              fromX: selectedPiece.x,
              fromY: selectedPiece.y,
              toX: x,
              toY: y
            }
          }
        }));
        
        setSelectedPiece(null);
        setValidMoves([]);
      }
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

  const renderBoard = () => {
    if (!gameState) return null;

    return (
      <div className="inline-block bg-amber-100 dark:bg-amber-900 p-4 rounded-lg">
        <div className="grid grid-cols-8 gap-1">
          {gameState.board.map((row, rowIndex) =>
            row.map((cell, colIndex) => {
              const isSelected = selectedPiece?.x === colIndex && selectedPiece?.y === rowIndex;
              const isValidMove = validMoves.some(move => move.x === colIndex && move.y === rowIndex);
              const isLight = (rowIndex + colIndex) % 2 === 0;
              
              return (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={`
                    w-12 h-12 flex items-center justify-center cursor-pointer
                    transition-all duration-200 border-2
                    ${isLight ? 'bg-amber-200 dark:bg-amber-800' : 'bg-amber-800 dark:bg-amber-600'}
                    ${isSelected ? 'border-blue-500 shadow-lg' : 'border-transparent'}
                    ${isValidMove ? 'border-green-500 shadow-md' : ''}
                    ${isMyTurn ? 'hover:border-gray-400' : ''}
                  `}
                  onClick={() => handlePieceClick(colIndex, rowIndex)}
                >
                  {cell && (
                    <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center
                      ${cell.includes('red') ? 'bg-red-500' : 'bg-gray-800'}
                      ${cell.includes('king') ? 'border-2 border-yellow-400' : ''}
                      transition-all duration-200
                    `}>
                      {cell.includes('king') && (
                        <Crown className="h-4 w-4 text-yellow-400" />
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  const getPieceCount = (color: 'red' | 'black') => {
    if (!gameState) return 0;
    return gameState.board.flat().filter(cell => cell && cell.includes(color)).length;
  };

  const getKingCount = (color: 'red' | 'black') => {
    if (!gameState) return 0;
    return gameState.board.flat().filter(cell => cell && cell.includes(color) && cell.includes('king')).length;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={onLeave} size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Leave Room
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                {room.name} - Chinshingwa
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
                <Badge variant="default" className="bg-blue-500">
                  Your Turn
                </Badge>
              )}
              {myColor && (
                <Badge variant="outline" className={myColor === 'red' ? 'border-red-500 text-red-500' : 'border-gray-800 text-gray-800'}>
                  {myColor === 'red' ? 'Red' : 'Black'}
                </Badge>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Game Board */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Game Board</span>
                  {gameStarted && (
                    <div className="flex items-center space-x-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                        <span>Red: {getPieceCount('red')} ({getKingCount('red')} ♔)</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-gray-800 rounded-full"></div>
                        <span>Black: {getPieceCount('black')} ({getKingCount('black')} ♔)</span>
                      </div>
                    </div>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center">
                {renderBoard()}
              </CardContent>
            </Card>
          </div>

          {/* Side Panel */}
          <div className="space-y-6">
            {/* Players */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>Players (2/2)</span>
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
                  >
                    {isReady ? "Ready ✓" : "Ready Up"}
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
                  <p>• Click your piece to select it</p>
                  <p>• Click highlighted squares to move</p>
                  <p>• Must capture maximum pieces</p>
                  <p>• Kings can move long range</p>
                </div>
              </CardContent>
            </Card>

            {/* Game Rules */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5" />
                  <span>Chinshingwa Rules</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <div>
                  <p className="font-medium">Brazilian Checkers:</p>
                  <p>• 8x8 board with 12 pieces each</p>
                  <p>• Must capture maximum pieces</p>
                  <p>• Kings can move long range</p>
                  <p>• Backward captures allowed</p>
                </div>
                <div>
                  <p className="font-medium">Gameplay:</p>
                  <p>• 20 seconds per turn</p>
                  <p>• Forced captures</p>
                  <p>• Win by capturing all opponent pieces</p>
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
      </div>
    </div>
  );
}