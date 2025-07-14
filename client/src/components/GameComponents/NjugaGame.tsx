import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useSocket } from '@/hooks/useSocket';
import { useToast } from '@/hooks/use-toast';
import { RoomInfo, Card as GameCard, NjugaGameState } from '@shared/schema';
import { Plus, Trash2, Trophy } from 'lucide-react';

interface NjugaGameProps {
  room: RoomInfo;
}

export function NjugaGame({ room }: NjugaGameProps) {
  const { user } = useAuth();
  const { sendGameAction } = useSocket();
  const { toast } = useToast();
  const [selectedCard, setSelectedCard] = useState<string | null>(null);

  const gameState = room.gameState as NjugaGameState;
  const playerHand = gameState?.playerHands?.[user?.id?.toString() || ''] || [];
  const discardPile = gameState?.discardPile || [];
  const isMyTurn = gameState?.currentTurn === user?.id?.toString();

  const handleDrawCard = (fromDiscard: boolean = false) => {
    if (!user || !isMyTurn) return;

    sendGameAction(user.id, room.id, 'drawCard', { fromDiscard });
    toast({
      title: 'Card drawn',
      description: fromDiscard ? 'Picked from discard pile' : 'Drew from deck'
    });
  };

  const handleDiscardCard = () => {
    if (!user || !selectedCard || !isMyTurn) return;

    sendGameAction(user.id, room.id, 'discardCard', { cardId: selectedCard });
    setSelectedCard(null);
  };

  const handleDeclareWin = () => {
    if (!user || !isMyTurn) return;

    sendGameAction(user.id, room.id, 'declareWin', {});
  };

  const renderCard = (card: GameCard) => {
    const isRed = card.suit === 'hearts' || card.suit === 'diamonds';
    const suitSymbol = {
      hearts: '♥',
      diamonds: '♦',
      clubs: '♣',
      spades: '♠'
    }[card.suit];

    return (
      <div
        className={`w-16 h-24 rounded-lg shadow-lg flex items-center justify-center font-bold cursor-pointer hover:scale-105 transition-transform ${
          isRed ? 'bg-gradient-to-b from-red-500 to-red-700' : 'bg-gradient-to-b from-blue-500 to-blue-700'
        } ${selectedCard === card.id ? 'ring-2 ring-yellow-400' : ''}`}
        onClick={() => setSelectedCard(card.id)}
      >
        <span className="text-white text-xs">
          {card.value}{suitSymbol}
        </span>
      </div>
    );
  };

  if (!gameState) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-medium text-white mb-2">Game Starting...</h3>
          <p className="text-slate-400">Waiting for all players to be ready</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Central Discard Pile */}
      <div className="flex justify-center mb-8">
        <div className="relative">
          <div className="w-20 h-32 bg-gradient-to-b from-slate-600 to-slate-800 rounded-lg border-2 border-slate-500 shadow-lg" />
          {discardPile.length > 0 && (
            <div className="absolute -top-2 -right-2 w-20 h-32 rounded-lg shadow-lg">
              {renderCard(discardPile[discardPile.length - 1])}
            </div>
          )}
          <Button
            size="sm"
            onClick={() => handleDrawCard(true)}
            disabled={!isMyTurn || discardPile.length === 0}
            className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 bg-blue-600 hover:bg-blue-700 text-xs px-3 py-1"
          >
            Pick Up
          </Button>
        </div>
      </div>

      {/* Player Hand */}
      <div className="flex-1 flex flex-col justify-end">
        <div className="text-center mb-4">
          <h3 className="text-lg font-medium text-white mb-2">Your Hand</h3>
          <div className="flex justify-center space-x-4">
            {playerHand.map((card) => renderCard(card))}
            {playerHand.length < 4 && (
              <div className="w-16 h-24 bg-gradient-to-b from-slate-600 to-slate-800 rounded-lg border-2 border-dashed border-slate-500 flex items-center justify-center text-slate-400">
                <Plus className="h-6 w-6" />
              </div>
            )}
          </div>
        </div>

        {/* Game Actions */}
        <div className="flex justify-center space-x-4">
          <Button
            onClick={() => handleDrawCard(false)}
            disabled={!isMyTurn || playerHand.length >= 4}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Draw Card
          </Button>
          
          <Button
            onClick={handleDiscardCard}
            disabled={!isMyTurn || !selectedCard || playerHand.length < 4}
            className="bg-red-600 hover:bg-red-700"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Discard
          </Button>
          
          <Button
            onClick={handleDeclareWin}
            disabled={!isMyTurn || playerHand.length < 3}
            className="bg-yellow-600 hover:bg-yellow-700"
          >
            <Trophy className="h-4 w-4 mr-2" />
            Declare Win
          </Button>
        </div>
      </div>
    </div>
  );
}
