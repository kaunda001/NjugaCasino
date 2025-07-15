import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSocket } from '@/hooks/useSocket';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, Clock, Crown, Users, ArrowLeft, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card as GameCard, RoomInfo, PlayerInfo, NjugaGameState } from '@shared/schema';

interface NjugaRoomProps {
  room: RoomInfo;
  onLeave: () => void;
}

export default function NjugaRoom({ room, onLeave }: NjugaRoomProps) {
  const { user } = useAuth();
  const { socket } = useSocket();
  const { toast } = useToast();
  
  const [gameState, setGameState] = useState<NjugaGameState | null>(null);
  const [timeLeft, setTimeLeft] = useState(20);
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);

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
            setWinner(message.data.winnerId);
            setGameStarted(false);
            if (message.data.winnerId === user.id.toString()) {
              toast({
                title: '🎉 Congratulations!',
                description: `You won K${message.data.winnings}!`,
              });
            }
            break;
          case 'playerLeft':
            toast({
              title: 'Player Left',
              description: `${message.data.playerName} left the game`,
            });
            break;
          case 'gameStarted':
            setGameStarted(true);
            if (message.data.starterId === user.id.toString()) {
              toast({
                title: '🎉 You start!',
                description: 'Make your first move',
              });
            }
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

  const handleDrawCard = (fromDiscard: boolean = false) => {
    if (socket && user && isMyTurn) {
      socket.send(JSON.stringify({
        type: 'gameAction',
        data: { 
          roomId: room.id, 
          action: 'draw',
          data: { fromDiscard }
        }
      }));
    }
  };

  const handleDiscardCard = (cardId: string) => {
    if (socket && user && isMyTurn && selectedCard) {
      socket.send(JSON.stringify({
        type: 'gameAction',
        data: { 
          roomId: room.id, 
          action: 'discard',
          data: { cardId }
        }
      }));
      setSelectedCard(null);
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

  const renderCard = (card: GameCard, isSelected: boolean = false) => {
    const getSuitColor = (suit: string) => {
      return suit === 'hearts' || suit === 'diamonds' ? 'text-red-500' : 'text-black';
    };

    const getSuitSymbol = (suit: string) => {
      switch (suit) {
        case 'hearts': return '♥';
        case 'diamonds': return '♦';
        case 'clubs': return '♣';
        case 'spades': return '♠';
        default: return '';
      }
    };

    return (
      <div
        key={card.id}
        className={`
          relative w-16 h-24 bg-white rounded-lg border-2 cursor-pointer transform transition-all duration-200
          ${isSelected ? 'border-blue-500 shadow-lg scale-105 shadow-blue-500/50' : 'border-gray-300 hover:border-gray-400'}
          ${isMyTurn ? 'hover:scale-105' : ''}
        `}
        onClick={() => isMyTurn && setSelectedCard(card.id)}
      >
        <div className="absolute top-1 left-1 text-xs font-bold">
          <div className={getSuitColor(card.suit)}>{card.value}</div>
          <div className={getSuitColor(card.suit)}>{getSuitSymbol(card.suit)}</div>
        </div>
        <div className="absolute bottom-1 right-1 text-xs font-bold rotate-180">
          <div className={getSuitColor(card.suit)}>{card.value}</div>
          <div className={getSuitColor(card.suit)}>{getSuitSymbol(card.suit)}</div>
        </div>
      </div>
    );
  };

  const checkWinningHand = (hand: GameCard[]) => {
    if (hand.length !== 4) return false;
    
    // Check for pair + two followers
    const values = hand.map(card => card.value);
    const valueCounts = values.reduce((acc, val) => {
      acc[val] = (acc[val] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const hasPair = Object.values(valueCounts).some(count => count === 2);
    
    if (hasPair) {
      const remainingCards = hand.filter(card => valueCounts[card.value] === 1);
      if (remainingCards.length === 2) {
        const cardOrder = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
        const indices = remainingCards.map(card => cardOrder.indexOf(card.value)).sort((a, b) => a - b);
        return indices[1] - indices[0] === 1; // Consecutive
      }
    }
    
    return false;
  };

  const myHand = gameState?.playerHands?.[user?.id?.toString() || ''] || [];
  const hasWinningHand = checkWinningHand(myHand);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={onLeave} size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Leave Room
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-red-700 dark:text-red-300">
                {room.name} - Njuga
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Game Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Game Actions */}
            {gameStarted && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Game Actions</span>
                    {hasWinningHand && (
                      <Badge variant="default" className="bg-gold-500 text-white">
                        <Crown className="h-4 w-4 mr-1" />
                        Winning Hand!
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-4">
                    <Button
                      onClick={() => handleDrawCard(false)}
                      disabled={!isMyTurn}
                      variant="outline"
                    >
                      Draw from Deck
                    </Button>
                    <Button
                      onClick={() => handleDrawCard(true)}
                      disabled={!isMyTurn || !gameState?.discardPile.length}
                      variant="outline"
                    >
                      Draw from Discard
                    </Button>
                    <Button
                      onClick={() => selectedCard && handleDiscardCard(selectedCard)}
                      disabled={!isMyTurn || !selectedCard}
                      variant="default"
                    >
                      Discard Selected
                    </Button>
                    <Button
                      onClick={handleForfeit}
                      variant="destructive"
                      size="sm"
                    >
                      Forfeit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Player's Hand */}
            <Card>
              <CardHeader>
                <CardTitle>Your Hand</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex space-x-2 justify-center">
                  {myHand.map(card => renderCard(card, selectedCard === card.id))}
                </div>
                {myHand.length > 0 && (
                  <div className="mt-4 text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Goal: 1 Pair + 2 Consecutive Cards
                    </p>
                    {hasWinningHand && (
                      <p className="text-sm text-green-600 font-medium mt-1">
                        ✅ You have a winning hand!
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Discard Pile */}
            {gameStarted && gameState?.discardPile.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Discard Pile</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-center">
                    {renderCard(gameState.discardPile[gameState.discardPile.length - 1])}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Players Panel */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>Players ({room.players.length}/{room.maxPlayers})</span>
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
                        <Check className="h-4 w-4 text-green-500" />
                      )}
                      {!player.isConnected && (
                        <X className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Game Controls */}
            {!gameStarted && (
              <Card>
                <CardHeader>
                  <CardTitle>Game Controls</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    onClick={handleReady}
                    variant={isReady ? "default" : "outline"}
                    className="w-full"
                  >
                    {isReady ? "Ready ✓" : "Ready Up"}
                  </Button>
                  
                  <div className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
                    <p>• Game starts when 2+ players are ready</p>
                    <p>• Each turn: 20 seconds</p>
                    <p>• House fee: 15%</p>
                    <p>• Forfeit penalty: 20% to pot</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Game Rules */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5" />
                  <span>Njuga Rules</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <div>
                  <p className="font-medium">Winning Hand (4 cards):</p>
                  <p>• 1 Pair (same rank)</p>
                  <p>• 2 Followers (consecutive ranks)</p>
                </div>
                <div>
                  <p className="font-medium">Card Sequence:</p>
                  <p>A → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10 → J → Q → K</p>
                </div>
                <div>
                  <p className="font-medium">Gameplay:</p>
                  <p>• Draw from deck or discard pile</p>
                  <p>• Discard one card</p>
                  <p>• 20 seconds per turn</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}