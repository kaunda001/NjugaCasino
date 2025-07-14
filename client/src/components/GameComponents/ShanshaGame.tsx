import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useSocket } from '@/hooks/useSocket';
import { useToast } from '@/hooks/use-toast';
import { RoomInfo, ShanshaGameState } from '@shared/schema';
import { Coins, Target, DollarSign } from 'lucide-react';

interface ShanshaGameProps {
  room: RoomInfo;
}

export function ShanshaGame({ room }: ShanshaGameProps) {
  const { user } = useAuth();
  const { sendGameAction } = useSocket();
  const { toast } = useToast();
  const [selectedAmount, setSelectedAmount] = useState(100);
  const [gameMode, setGameMode] = useState<'setup' | 'playing'>('setup');

  const gameState = room.gameState as ShanshaGameState;
  const playerId = user?.id?.toString() || '';
  const playerGrid = gameState?.playerGrids?.[playerId] || Array(4).fill(null).map(() => Array(6).fill(null));
  const moneyPlacements = gameState?.moneyPlacements?.[playerId] || [];
  const guesses = gameState?.guesses?.[playerId] || [];
  const isMyTurn = gameState?.currentTurn === playerId;

  const handlePlaceMoney = (x: number, y: number) => {
    if (!user || moneyPlacements.length >= 5) return;

    sendGameAction(user.id, room.id, 'placeMoney', { x, y, amount: selectedAmount });
    toast({
      title: 'Money placed',
      description: `Placed K${selectedAmount} at position (${x + 1}, ${y + 1})`
    });
  };

  const handleMakeGuess = (x: number, y: number) => {
    if (!user || !isMyTurn) return;

    // Find opponent
    const opponent = room.players.find(p => p.userId !== user.id);
    if (!opponent) return;

    sendGameAction(user.id, room.id, 'makeGuess', { 
      targetPlayer: opponent.userId.toString(), 
      x, 
      y 
    });
  };

  const renderGrid = (isOwnGrid: boolean) => {
    const grid = isOwnGrid ? playerGrid : Array(4).fill(null).map(() => Array(6).fill(null));
    
    return (
      <div className="grid grid-cols-6 gap-1">
        {grid.map((row, x) =>
          row.map((cell, y) => {
            const hasPlacement = isOwnGrid && moneyPlacements.some(p => p.x === x && p.y === y);
            const hasGuess = !isOwnGrid && guesses.some(g => g.x === x && g.y === y);
            const isHit = !isOwnGrid && guesses.find(g => g.x === x && g.y === y)?.hit;
            
            return (
              <div
                key={`${x}-${y}`}
                className={`w-8 h-8 border border-slate-600 rounded-sm flex items-center justify-center cursor-pointer transition-colors ${
                  hasPlacement ? 'bg-green-600' : 
                  hasGuess ? (isHit ? 'bg-red-600' : 'bg-slate-600') : 
                  'bg-slate-700 hover:bg-slate-600'
                }`}
                onClick={() => isOwnGrid ? handlePlaceMoney(x, y) : handleMakeGuess(x, y)}
              >
                {hasPlacement && (
                  <Coins className="h-3 w-3 text-white" />
                )}
                {hasGuess && (
                  <Target className="h-3 w-3 text-white" />
                )}
              </div>
            );
          })
        )}
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
    <div className="flex-1 flex flex-col space-y-6">
      {/* Game Instructions */}
      <div className="text-center">
        <h3 className="text-lg font-medium text-white mb-2">
          {moneyPlacements.length < 5 ? 'Place Your Money' : 'Find Opponent\'s Money'}
        </h3>
        <p className="text-slate-400">
          {moneyPlacements.length < 5 
            ? `Place ${5 - moneyPlacements.length} more money placements`
            : isMyTurn ? 'Your turn to guess' : 'Waiting for opponent'
          }
        </p>
      </div>

      {/* Amount Selection */}
      {moneyPlacements.length < 5 && (
        <div className="flex justify-center space-x-4">
          <div className="flex items-center space-x-2">
            <Label htmlFor="amount" className="text-white">Amount:</Label>
            <Input
              id="amount"
              type="number"
              value={selectedAmount}
              onChange={(e) => setSelectedAmount(Number(e.target.value))}
              className="w-20"
              min="10"
              max="1000"
            />
          </div>
        </div>
      )}

      {/* Game Grids */}
      <div className="flex-1 flex justify-center items-center space-x-8">
        {/* Player's Grid */}
        <div className="text-center">
          <h4 className="text-sm font-medium text-white mb-2">Your Grid</h4>
          {renderGrid(true)}
          <p className="text-xs text-slate-400 mt-2">
            Money placed: {moneyPlacements.length}/5
          </p>
        </div>

        {/* Opponent's Grid */}
        {moneyPlacements.length >= 5 && (
          <div className="text-center">
            <h4 className="text-sm font-medium text-white mb-2">Opponent's Grid</h4>
            {renderGrid(false)}
            <p className="text-xs text-slate-400 mt-2">
              Hits: {guesses.filter(g => g.hit).length}/5
            </p>
          </div>
        )}
      </div>

      {/* Game Status */}
      <div className="text-center">
        <div className="flex justify-center space-x-4 text-sm">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-green-600 rounded-sm" />
            <span className="text-slate-400">Your Money</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-red-600 rounded-sm" />
            <span className="text-slate-400">Hit</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-slate-600 rounded-sm" />
            <span className="text-slate-400">Miss</span>
          </div>
        </div>
      </div>
    </div>
  );
}
