import { Card, NjugaGameState, ShanshaGameState, ChinshingwaGameState, GameType } from '@shared/schema';

export class GameLogic {
  // Card deck generation
  static generateDeck(): Card[] {
    const suits: Card['suit'][] = ['hearts', 'diamonds', 'clubs', 'spades'];
    const values: Card['value'][] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    const deck: Card[] = [];
    
    suits.forEach(suit => {
      values.forEach(value => {
        deck.push({
          suit,
          value,
          id: `${suit}-${value}`
        });
      });
    });
    
    return this.shuffleDeck(deck);
  }

  static shuffleDeck(deck: Card[]): Card[] {
    const shuffled = [...deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // Njuga game logic
  static initializeNjugaGame(playerIds: string[]): NjugaGameState {
    const deck = this.generateDeck();
    const playerHands: { [playerId: string]: Card[] } = {};
    
    // Deal 3 cards to each player initially
    let cardIndex = 0;
    playerIds.forEach(playerId => {
      playerHands[playerId] = deck.slice(cardIndex, cardIndex + 3);
      cardIndex += 3;
    });
    
    const remainingDeck = deck.slice(cardIndex);
    const discardPile = remainingDeck.splice(0, 1);
    
    // Random starting player
    const randomStartIndex = Math.floor(Math.random() * playerIds.length);
    
    return {
      deck: remainingDeck,
      discardPile,
      playerHands,
      currentTurn: playerIds[randomStartIndex],
      hasWinner: false
    };
  }

  static validateNjugaWin(hand: Card[]): boolean {
    // Must have exactly 4 cards to win
    if (hand.length !== 4) return false;
    
    // Count occurrences of each value
    const valueCounts: { [value: string]: number } = {};
    hand.forEach(card => {
      valueCounts[card.value] = (valueCounts[card.value] || 0) + 1;
    });
    
    // Find pairs and singles
    const pairs: string[] = [];
    const singles: string[] = [];
    
    Object.entries(valueCounts).forEach(([value, count]) => {
      if (count === 2) {
        pairs.push(value);
      } else if (count === 1) {
        singles.push(value);
      }
    });
    
    // Must have exactly 1 pair and 2 single cards
    if (pairs.length !== 1 || singles.length !== 2) return false;
    
    // Check if the two singles are consecutive
    const valueOrder = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    const singleIndexes = singles.map(val => valueOrder.indexOf(val)).sort((a, b) => a - b);
    
    // Check if consecutive (including wrap-around: K follows 10, J follows Q, Q follows K)
    const isConsecutive = (a: number, b: number): boolean => {
      return b - a === 1;
    };
    
    return isConsecutive(singleIndexes[0], singleIndexes[1]);
  }

  static drawCardNjuga(gameState: NjugaGameState, playerId: string, fromDiscard: boolean = false): Card | null {
    if (gameState.currentTurn !== playerId) return null;
    
    let card: Card | null = null;
    
    if (fromDiscard && gameState.discardPile.length > 0) {
      card = gameState.discardPile.pop()!;
    } else if (gameState.deck.length > 0) {
      card = gameState.deck.pop()!;
    }
    
    if (card) {
      gameState.playerHands[playerId].push(card);
    }
    
    return card;
  }

  static discardCardNjuga(gameState: NjugaGameState, playerId: string, cardId: string): boolean {
    if (gameState.currentTurn !== playerId) return false;
    
    const hand = gameState.playerHands[playerId];
    const cardIndex = hand.findIndex(card => card.id === cardId);
    
    if (cardIndex === -1) return false;
    
    const discardedCard = hand.splice(cardIndex, 1)[0];
    gameState.discardPile.push(discardedCard);
    
    return true;
  }

  // Shansha game logic
  static initializeShanshaGame(playerIds: string[]): ShanshaGameState {
    const playerGrids: { [playerId: string]: (number | null)[][] } = {};
    const moneyPlacements: { [playerId: string]: { x: number; y: number; amount: number }[] } = {};
    const guesses: { [playerId: string]: { x: number; y: number; hit: boolean }[] } = {};
    
    playerIds.forEach(playerId => {
      playerGrids[playerId] = Array(4).fill(null).map(() => Array(6).fill(null));
      moneyPlacements[playerId] = [];
      guesses[playerId] = [];
    });
    
    // Random starting player
    const randomStartIndex = Math.floor(Math.random() * playerIds.length);
    
    return {
      playerGrids,
      moneyPlacements,
      guesses,
      currentTurn: playerIds[randomStartIndex],
      hasWinner: false
    };
  }

  static getChipSplit(stakes: number): number[] {
    // Base chip split for K50: [20, 10, 10, 5, 5]
    const baseChips = [20, 10, 10, 5, 5];
    const multiplier = stakes / 50;
    return baseChips.map(chip => chip * multiplier);
  }

  static placeMoneyShansha(gameState: ShanshaGameState, playerId: string, x: number, y: number, amount: number): boolean {
    if (gameState.moneyPlacements[playerId].length >= 5) return false;
    
    const existing = gameState.moneyPlacements[playerId].find(p => p.x === x && p.y === y);
    if (existing) return false;
    
    gameState.moneyPlacements[playerId].push({ x, y, amount });
    gameState.playerGrids[playerId][x][y] = amount;
    
    return true;
  }

  static makeGuessShansha(gameState: ShanshaGameState, playerId: string, targetPlayerId: string, x: number, y: number): boolean {
    if (gameState.currentTurn !== playerId) return false;
    
    const existingGuess = gameState.guesses[playerId].find(g => g.x === x && g.y === y);
    if (existingGuess) return false;
    
    const targetGrid = gameState.playerGrids[targetPlayerId];
    const hit = targetGrid[x][y] !== null;
    
    gameState.guesses[playerId].push({ x, y, hit });
    
    return hit;
  }

  // Chinshingwa game logic
  static initializeChinshingwaGame(playerIds: string[]): ChinshingwaGameState {
    const board: (string | null)[][] = Array(8).fill(null).map(() => Array(8).fill(null));
    const kings: { [playerId: string]: { x: number; y: number }[] } = {};
    
    // Initialize board with pieces
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 8; col++) {
        if ((row + col) % 2 === 1) {
          board[row][col] = playerIds[0]; // Player 1 pieces
        }
      }
    }
    
    for (let row = 5; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if ((row + col) % 2 === 1) {
          board[row][col] = playerIds[1]; // Player 2 pieces
        }
      }
    }
    
    playerIds.forEach(playerId => {
      kings[playerId] = [];
    });
    
    return {
      board,
      currentTurn: playerIds[0],
      hasWinner: false,
      kings
    };
  }

  static isValidMoveChinshingwa(gameState: ChinshingwaGameState, playerId: string, fromX: number, fromY: number, toX: number, toY: number): boolean {
    if (gameState.currentTurn !== playerId) return false;
    if (gameState.board[fromX][fromY] !== playerId) return false;
    if (gameState.board[toX][toY] !== null) return false;
    
    const dx = Math.abs(toX - fromX);
    const dy = Math.abs(toY - fromY);
    
    // Basic move validation (diagonal only)
    if (dx !== dy || dx > 2) return false;
    
    // Check if jumping over piece
    if (dx === 2) {
      const midX = (fromX + toX) / 2;
      const midY = (fromY + toY) / 2;
      if (gameState.board[midX][midY] === null) return false;
      if (gameState.board[midX][midY] === playerId) return false;
    }
    
    return true;
  }

  static makeMoveChinshingwa(gameState: ChinshingwaGameState, playerId: string, fromX: number, fromY: number, toX: number, toY: number): boolean {
    if (!this.isValidMoveChinshingwa(gameState, playerId, fromX, fromY, toX, toY)) return false;
    
    gameState.board[toX][toY] = playerId;
    gameState.board[fromX][fromY] = null;
    
    // Handle capture
    const dx = Math.abs(toX - fromX);
    if (dx === 2) {
      const midX = (fromX + toX) / 2;
      const midY = (fromY + toY) / 2;
      gameState.board[midX][midY] = null;
    }
    
    // Check for king promotion
    if ((playerId === gameState.currentTurn && toX === 0) || 
        (playerId === gameState.currentTurn && toX === 7)) {
      gameState.kings[playerId].push({ x: toX, y: toY });
    }
    
    return true;
  }

  static checkWinCondition(gameState: NjugaGameState | ShanshaGameState | ChinshingwaGameState, gameType: GameType): boolean {
    switch (gameType) {
      case 'njuga':
        const njugaState = gameState as NjugaGameState;
        return njugaState.hasWinner;
      
      case 'shansha':
        const shanshaState = gameState as ShanshaGameState;
        // Win when all money is found
        const playerIds = Object.keys(shanshaState.moneyPlacements);
        return playerIds.some(playerId => {
          const correctGuesses = shanshaState.guesses[playerId].filter(g => g.hit).length;
          return correctGuesses >= 5;
        });
      
      case 'chinshingwa':
        const chinshingwaState = gameState as ChinshingwaGameState;
        // Win when opponent has no pieces
        const playerIds2 = Object.keys(chinshingwaState.kings);
        return playerIds2.some(playerId => {
          const opponentPieces = chinshingwaState.board.flat().filter(cell => cell && cell !== playerId);
          return opponentPieces.length === 0;
        });
      
      default:
        return false;
    }
  }

  static getNextPlayer(currentPlayer: string, playerIds: string[]): string {
    const currentIndex = playerIds.indexOf(currentPlayer);
    return playerIds[(currentIndex + 1) % playerIds.length];
  }
}
