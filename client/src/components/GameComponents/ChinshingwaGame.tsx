import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useSocket } from '@/hooks/useSocket';
import { useToast } from '@/hooks/use-toast';
import { RoomInfo, ChinshingwaGameState } from '@shared/schema';
import { Crown, Circle } from 'lucide-react';

interface ChinshingwaGameProps {
  room: RoomInfo;
}

export function ChinshingwaGame({ room }: ChinshingwaGameProps) {
  const { user } = useAuth();
  const { sendGameAction } = useSocket();
  const { toast } = useToast();
  const [selectedPiece, setSelectedPiece] = useState<{ x: number; y: number } | null>(null);

  const gameState = room.gameState as ChinshingwaGameState;
  const playerId = user?.id?.toString() || '';
  const board = gameState?.board || Array(8).fill(null).map(() => Array(8).fill(null));
  const kings = gameState?.kings?.[playerId] || [];
  const isMyTurn = gameState?.currentTurn === playerId;

  const handleSquareClick = (x: number, y: number) => {
    if (!user || !isMyTurn) return;

    if (selectedPiece) {
      // Try to move piece
      sendGameAction(user.id, room.id, 'movePiece', {
        fromX: selectedPiece.x,
        fromY: selectedPiece.y,
        toX: x,
        toY: y
      });
      setSelectedPiece(null);
    } else if (board[x][y] === playerId) {
      // Select piece
      setSelectedPiece({ x, y });
    }
  };

  const renderSquare = (x: number, y: number) => {
    const piece = board[x][y];
    const isLight = (x + y) % 2 === 0;
    const isSelected = selectedPiece?.x === x && selectedPiece?.y === y;
    const isKing = kings.some(k => k.x === x && k.y === y);
    
    return (
      <div
        key={`${x}-${y}`}
        className={`w-12 h-12 flex items-center justify-center cursor-pointer transition-colors ${
          isLight ? 'bg-amber-100' : 'bg-amber-800'
        } ${isSelected ? 'ring-2 ring-yellow-400' : ''}`}
        onClick={() => handleSquareClick(x, y)}
      >
        {piece && (
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            piece === playerId ? 'bg-blue-600' : 'bg-red-600'
          }`}>
            {isKing ? (
              <Crown className="h-4 w-4 text-white" />
            ) : (
              <Circle className="h-4 w-4 text-white" />
            )}
          </div>
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
    <div className="flex-1 flex flex-col">
      {/* Game Instructions */}
      <div className="text-center mb-4">
        <h3 className="text-lg font-medium text-white mb-2">
          {isMyTurn ? 'Your Turn' : 'Opponent\'s Turn'}
        </h3>
        <p className="text-slate-400">
          {selectedPiece ? 'Click a square to move your piece' : 'Click your piece to select it'}
        </p>
      </div>

      {/* Game Board */}
      <div className="flex-1 flex justify-center items-center">
        <div className="grid grid-cols-8 gap-1 border-2 border-amber-600 p-2 bg-amber-200">
          {board.map((row, x) =>
            row.map((_, y) => renderSquare(x, y))
          )}
        </div>
      </div>

      {/* Game Controls */}
      <div className="flex justify-center space-x-4 mt-4">
        <Button
          onClick={() => setSelectedPiece(null)}
          variant="outline"
          disabled={!selectedPiece}
        >
          Cancel Selection
        </Button>
      </div>

      {/* Game Legend */}
      <div className="text-center mt-4">
        <div className="flex justify-center space-x-4 text-sm">
          <div className="flex items-center space-x-1">
            <div className="w-4 h-4 bg-blue-600 rounded-full" />
            <span className="text-slate-400">Your Pieces</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-4 h-4 bg-red-600 rounded-full" />
            <span className="text-slate-400">Opponent Pieces</span>
          </div>
          <div className="flex items-center space-x-1">
            <Crown className="h-4 w-4 text-white" />
            <span className="text-slate-400">King</span>
          </div>
        </div>
      </div>
    </div>
  );
}
