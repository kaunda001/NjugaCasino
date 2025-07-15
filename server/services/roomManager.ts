import { WebSocket } from 'ws';
import { storage } from '../storage';
import { GameLogic } from './gameLogic';
import { RoomInfo, PlayerInfo, GameType, RoomStatus } from '@shared/schema';

export interface ConnectedPlayer {
  userId: number;
  ws: WebSocket;
  roomId?: number;
}

export class RoomManager {
  private static instance: RoomManager;
  private connectedPlayers: Map<number, ConnectedPlayer> = new Map();
  private roomIntervals: Map<number, NodeJS.Timeout> = new Map();

  static getInstance(): RoomManager {
    if (!RoomManager.instance) {
      RoomManager.instance = new RoomManager();
    }
    return RoomManager.instance;
  }

  addPlayer(userId: number, ws: WebSocket): void {
    this.connectedPlayers.set(userId, { userId, ws });
    
    ws.on('close', () => {
      this.handleDisconnect(userId);
    });
  }

  removePlayer(userId: number): void {
    this.connectedPlayers.delete(userId);
  }

  async handleDisconnect(userId: number): Promise<void> {
    const player = this.connectedPlayers.get(userId);
    if (player && player.roomId) {
      await storage.updatePlayerConnection(player.roomId, userId, false);
      await this.notifyRoomUpdate(player.roomId);
      
      // Start ghost player removal timer
      setTimeout(async () => {
        await this.removeGhostPlayer(player.roomId!, userId);
      }, 30000); // 30 seconds to reconnect
    }
    
    this.connectedPlayers.delete(userId);
  }

  async removeGhostPlayer(roomId: number, userId: number): Promise<void> {
    const player = this.connectedPlayers.get(userId);
    if (!player || !player.ws || player.ws.readyState !== WebSocket.OPEN) {
      await storage.removePlayerFromRoom(roomId, userId);
      await this.notifyRoomUpdate(roomId);
      
      // Check if room is empty
      const roomPlayers = await storage.getRoomPlayers(roomId);
      if (roomPlayers.length === 0) {
        await storage.updateRoom(roomId, { status: 'finished' });
        this.stopRoomTimer(roomId);
      }
    }
  }

  async joinRoom(userId: number, gameType: GameType, stakes: number): Promise<boolean> {
    const user = await storage.getUser(userId);
    if (!user || user.balance < stakes) {
      return false;
    }

    // Find or create appropriate room
    const roomId = await this.findOrCreateRoom(gameType, stakes);
    const room = await storage.getRoom(roomId);
    
    if (!room || room.currentPlayers >= room.maxPlayers || room.status !== 'waiting') {
      return false;
    }

    // Add player to room
    await storage.addPlayerToRoom({
      roomId,
      userId,
      position: room.currentPlayers,
      isReady: false,
      isConnected: true,
      bet: stakes
    });

    // Update player's room
    const player = this.connectedPlayers.get(userId);
    if (player) {
      player.roomId = roomId;
    }

    // Deduct bet from user balance
    await storage.updateUserBalance(userId, user.balance - stakes);

    // Update room pot
    await storage.updateRoom(roomId, { 
      pot: room.pot + stakes 
    });

    await this.notifyRoomUpdate(roomId);
    
    // Check if room is ready to start
    await this.checkStartGame(roomId);

    return true;
  }

  async leaveRoom(userId: number, roomId: number): Promise<void> {
    const roomPlayers = await storage.getRoomPlayers(roomId);
    const player = roomPlayers.find(p => p.userId === userId);
    
    if (player) {
      // Refund bet if game hasn't started
      const room = await storage.getRoom(roomId);
      if (room && room.status === 'waiting') {
        const user = await storage.getUser(userId);
        if (user) {
          await storage.updateUserBalance(userId, user.balance + player.bet);
          await storage.updateRoom(roomId, { pot: room.pot - player.bet });
        }
      }
      
      await storage.removePlayerFromRoom(roomId, userId);
      
      const connectedPlayer = this.connectedPlayers.get(userId);
      if (connectedPlayer) {
        connectedPlayer.roomId = undefined;
      }
      
      await this.notifyRoomUpdate(roomId);
    }
  }

  async toggleReady(userId: number, roomId: number): Promise<void> {
    const roomPlayers = await storage.getRoomPlayers(roomId);
    const player = roomPlayers.find(p => p.userId === userId);
    
    if (player) {
      await storage.updatePlayerReadyStatus(roomId, userId, !player.isReady);
      await this.notifyRoomUpdate(roomId);
      await this.checkStartGame(roomId);
    }
  }

  async checkStartGame(roomId: number): Promise<void> {
    const room = await storage.getRoom(roomId);
    const roomPlayers = await storage.getRoomPlayers(roomId);
    
    if (!room || room.status !== 'waiting') return;
    
    // Auto-start conditions based on game type
    const shouldStart = room.gameType === 'njuga' 
      ? roomPlayers.length >= 2  // Njuga: 2+ players can start
      : roomPlayers.length === 2; // Shansha/Chinshingwa: exactly 2 players

    if (shouldStart) {
      await this.startGame(roomId);
      
      // Create new room for additional players if current room is full
      if (roomPlayers.length >= room.maxPlayers) {
        await this.findOrCreateRoom(room.gameType, room.stakes);
      }
    }
  }

  async startGame(roomId: number): Promise<void> {
    const room = await storage.getRoom(roomId);
    if (!room) return;
    
    const roomPlayers = await storage.getRoomPlayers(roomId);
    const playerIds = roomPlayers.map(p => p.userId.toString());
    
    let gameState;
    switch (room.gameType) {
      case 'njuga':
        gameState = GameLogic.initializeNjugaGame(playerIds);
        break;
      case 'shansha':
        gameState = GameLogic.initializeShanshaGame(playerIds);
        break;
      case 'chinshingwa':
        gameState = GameLogic.initializeChinshingwaGame(playerIds);
        break;
    }
    
    await storage.updateRoom(roomId, {
      status: 'playing',
      gameState: gameState as any
    });
    
    await this.notifyRoomUpdate(roomId);
    this.startRoomTimer(roomId);
  }

  async handleGameAction(userId: number, roomId: number, action: string, data: any): Promise<void> {
    const room = await storage.getRoom(roomId);
    if (!room || room.status !== 'playing' || !room.gameState) return;
    
    const gameState = room.gameState;
    let updated = false;
    
    switch (room.gameType) {
      case 'njuga':
        updated = await this.handleNjugaAction(userId, roomId, action, data, gameState);
        break;
      case 'shansha':
        updated = await this.handleShanshaAction(userId, roomId, action, data, gameState);
        break;
      case 'chinshingwa':
        updated = await this.handleChinshingwaAction(userId, roomId, action, data, gameState);
        break;
    }
    
    if (updated) {
      await storage.updateRoom(roomId, { gameState: gameState as any });
      await this.notifyRoomUpdate(roomId);
      
      // Check for win condition
      if (GameLogic.checkWinCondition(gameState, room.gameType)) {
        await this.endGame(roomId);
      }
    }
  }

  private async handleNjugaAction(userId: number, roomId: number, action: string, data: any, gameState: any): Promise<boolean> {
    const playerId = userId.toString();
    
    switch (action) {
      case 'drawCard':
        const drawn = GameLogic.drawCardNjuga(gameState, playerId, data.fromDiscard);
        if (drawn) {
          // Check if hand is over 4 cards, must discard
          return true;
        }
        break;
      
      case 'discardCard':
        const discarded = GameLogic.discardCardNjuga(gameState, playerId, data.cardId);
        if (discarded) {
          // Move to next player
          const roomPlayers = await storage.getRoomPlayers(roomId);
          const playerIds = roomPlayers.map(p => p.userId.toString());
          gameState.currentTurn = GameLogic.getNextPlayer(playerId, playerIds);
          return true;
        }
        break;
      
      case 'declareWin':
        const isWin = GameLogic.validateNjugaWin(gameState.playerHands[playerId]);
        if (isWin) {
          gameState.hasWinner = true;
          gameState.winnerId = playerId;
          return true;
        }
        break;
    }
    
    return false;
  }

  private async handleShanshaAction(userId: number, roomId: number, action: string, data: any, gameState: any): Promise<boolean> {
    const playerId = userId.toString();
    
    switch (action) {
      case 'placeMoney':
        return GameLogic.placeMoneyShansha(gameState, playerId, data.x, data.y, data.amount);
      
      case 'makeGuess':
        const hit = GameLogic.makeGuessShansha(gameState, playerId, data.targetPlayer, data.x, data.y);
        if (hit !== null) {
          // Move to next player
          const roomPlayers = await storage.getRoomPlayers(roomId);
          const playerIds = roomPlayers.map(p => p.userId.toString());
          gameState.currentTurn = GameLogic.getNextPlayer(playerId, playerIds);
          return true;
        }
        break;
    }
    
    return false;
  }

  private async handleChinshingwaAction(userId: number, roomId: number, action: string, data: any, gameState: any): Promise<boolean> {
    const playerId = userId.toString();
    
    switch (action) {
      case 'movePiece':
        const moved = GameLogic.makeMoveChinshingwa(gameState, playerId, data.fromX, data.fromY, data.toX, data.toY);
        if (moved) {
          // Move to next player
          const roomPlayers = await storage.getRoomPlayers(roomId);
          const playerIds = roomPlayers.map(p => p.userId.toString());
          gameState.currentTurn = GameLogic.getNextPlayer(playerId, playerIds);
          return true;
        }
        break;
    }
    
    return false;
  }

  private async endGame(roomId: number): Promise<void> {
    const room = await storage.getRoom(roomId);
    if (!room || !room.gameState) return;
    
    const gameState = room.gameState as any;
    const winnerId = parseInt(gameState.winnerId);
    
    // Calculate winnings
    const houseCut = Math.floor(room.pot * 0.15);
    const winnings = room.pot - houseCut;
    
    // Update winner balance
    const winner = await storage.getUser(winnerId);
    if (winner) {
      await storage.updateUserBalance(winnerId, winner.balance + winnings);
    }
    
    // Create game history
    const roomPlayers = await storage.getRoomPlayers(roomId);
    const players = await Promise.all(roomPlayers.map(async (rp) => {
      const user = await storage.getUser(rp.userId);
      return { ...rp, user };
    }));
    
    await storage.createGameHistory({
      roomId,
      winnerId,
      gameType: room.gameType,
      stakes: room.stakes,
      pot: room.pot,
      winnings,
      houseCut,
      players: players as any,
      gameData: gameState
    });
    
    // Update room status
    await storage.updateRoom(roomId, { status: 'finished' });
    
    await this.notifyRoomUpdate(roomId);
    this.stopRoomTimer(roomId);
    
    // Remove all players from room after 10 seconds
    setTimeout(async () => {
      for (const player of roomPlayers) {
        await this.leaveRoom(player.userId, roomId);
      }
    }, 10000);
  }

  private startRoomTimer(roomId: number): void {
    const interval = setInterval(async () => {
      await this.notifyRoomUpdate(roomId);
    }, 1000);
    
    this.roomIntervals.set(roomId, interval);
  }

  private stopRoomTimer(roomId: number): void {
    const interval = this.roomIntervals.get(roomId);
    if (interval) {
      clearInterval(interval);
      this.roomIntervals.delete(roomId);
    }
  }

  private async notifyRoomUpdate(roomId: number): Promise<void> {
    const roomInfo = await this.getRoomInfo(roomId);
    if (!roomInfo) return;
    
    const message = JSON.stringify({
      type: 'roomUpdate',
      data: roomInfo
    });
    
    roomInfo.players.forEach(player => {
      const connectedPlayer = this.connectedPlayers.get(player.userId);
      if (connectedPlayer && connectedPlayer.ws.readyState === WebSocket.OPEN) {
        connectedPlayer.ws.send(message);
      }
    });
  }

  async getRoomInfo(roomId: number): Promise<RoomInfo | null> {
    const room = await storage.getRoom(roomId);
    if (!room) return null;
    
    const roomPlayers = await storage.getRoomPlayers(roomId);
    const players: PlayerInfo[] = [];
    
    for (const rp of roomPlayers) {
      const user = await storage.getUser(rp.userId);
      if (user) {
        players.push({
          id: rp.userId.toString(),
          userId: rp.userId,
          phoneNumber: user.phoneNumber,
          displayName: user.displayName || user.phoneNumber,
          balance: user.balance,
          position: rp.position,
          isReady: rp.isReady,
          isConnected: rp.isConnected,
          bet: rp.bet
        });
      }
    }
    
    return {
      id: room.id,
      name: room.name,
      gameType: room.gameType as GameType,
      stakes: room.stakes,
      maxPlayers: room.maxPlayers,
      currentPlayers: room.currentPlayers,
      status: room.status as RoomStatus,
      pot: room.pot,
      players,
      gameState: room.gameState as any
    };
  }

  async findOrCreateRoom(gameType: GameType, stakes: number): Promise<number> {
    // Find existing room that's not full
    const existingRooms = await storage.getRoomsByGameType(gameType);
    const availableRoom = existingRooms.find(room => 
      room.stakes === stakes && 
      room.status === 'waiting' &&
      room.currentPlayers < room.maxPlayers
    );
    
    if (availableRoom) {
      return availableRoom.id;
    }
    
    // Create new room if none available
    const maxPlayers = gameType === 'njuga' ? 6 : 2;
    const room = await storage.createRoom({
      name: `${gameType.charAt(0).toUpperCase() + gameType.slice(1)} Room`,
      gameType,
      stakes,
      maxPlayers,
      currentPlayers: 0,
      status: 'waiting',
      pot: 0,
      gameState: null
    });
    
    return room.id;
  }

  async getAvailableRooms(): Promise<RoomInfo[]> {
    const rooms = await storage.getAvailableRooms();
    const roomInfos: RoomInfo[] = [];
    
    for (const room of rooms) {
      const roomInfo = await this.getRoomInfo(room.id);
      if (roomInfo) {
        roomInfos.push(roomInfo);
      }
    }
    
    return roomInfos;
  }

  broadcastToRoom(roomId: number, message: string): void {
    this.connectedPlayers.forEach(player => {
      if (player.roomId === roomId && player.ws.readyState === WebSocket.OPEN) {
        player.ws.send(message);
      }
    });
  }

  sendToPlayer(userId: number, message: string): void {
    const player = this.connectedPlayers.get(userId);
    if (player && player.ws.readyState === WebSocket.OPEN) {
      player.ws.send(message);
    }
  }
}
