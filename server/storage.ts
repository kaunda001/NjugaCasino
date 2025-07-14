import { users, rooms, roomPlayers, gameHistory, type User, type InsertUser, type Room, type InsertRoom, type RoomPlayer, type InsertRoomPlayer, type GameHistory, type InsertGameHistory } from "@shared/schema";
import bcrypt from 'bcrypt';

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByPhoneNumber(phoneNumber: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserBalance(userId: number, newBalance: number): Promise<void>;
  authenticateUser(phoneNumber: string, password: string): Promise<User | null>;

  // Room operations
  createRoom(room: InsertRoom): Promise<Room>;
  getRoom(id: number): Promise<Room | undefined>;
  updateRoom(id: number, updates: Partial<Room>): Promise<void>;
  getRoomsByGameType(gameType: string): Promise<Room[]>;
  getAvailableRooms(): Promise<Room[]>;

  // Room player operations
  addPlayerToRoom(roomPlayer: InsertRoomPlayer): Promise<RoomPlayer>;
  removePlayerFromRoom(roomId: number, userId: number): Promise<void>;
  getRoomPlayers(roomId: number): Promise<RoomPlayer[]>;
  updatePlayerReadyStatus(roomId: number, userId: number, isReady: boolean): Promise<void>;
  updatePlayerConnection(roomId: number, userId: number, isConnected: boolean): Promise<void>;

  // Game history operations
  createGameHistory(history: InsertGameHistory): Promise<GameHistory>;
  getPlayerStats(userId: number): Promise<{ wins: number; totalWinnings: number; gamesPlayed: number }>;
  getLeaderboard(): Promise<{ user: User; stats: { wins: number; totalWinnings: number; gamesPlayed: number } }[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private rooms: Map<number, Room>;
  private roomPlayers: Map<string, RoomPlayer>; // key: roomId-userId
  private gameHistory: Map<number, GameHistory>;
  private currentUserId: number;
  private currentRoomId: number;
  private currentRoomPlayerId: number;
  private currentGameHistoryId: number;

  constructor() {
    this.users = new Map();
    this.rooms = new Map();
    this.roomPlayers = new Map();
    this.gameHistory = new Map();
    this.currentUserId = 1;
    this.currentRoomId = 1;
    this.currentRoomPlayerId = 1;
    this.currentGameHistoryId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByPhoneNumber(phoneNumber: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.phoneNumber === phoneNumber);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const user: User = {
      ...insertUser,
      password: hashedPassword,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async authenticateUser(phoneNumber: string, password: string): Promise<User | null> {
    const user = Array.from(this.users.values()).find(user => user.phoneNumber === phoneNumber);
    if (!user) return null;
    
    const isValid = await bcrypt.compare(password, user.password);
    return isValid ? user : null;
  }

  async updateUserBalance(userId: number, newBalance: number): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      user.balance = newBalance;
      user.updatedAt = new Date();
      this.users.set(userId, user);
    }
  }

  async createRoom(insertRoom: InsertRoom): Promise<Room> {
    const id = this.currentRoomId++;
    const room: Room = {
      ...insertRoom,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.rooms.set(id, room);
    return room;
  }

  async getRoom(id: number): Promise<Room | undefined> {
    return this.rooms.get(id);
  }

  async updateRoom(id: number, updates: Partial<Room>): Promise<void> {
    const room = this.rooms.get(id);
    if (room) {
      Object.assign(room, updates);
      room.updatedAt = new Date();
      this.rooms.set(id, room);
    }
  }

  async getRoomsByGameType(gameType: string): Promise<Room[]> {
    return Array.from(this.rooms.values()).filter(room => room.gameType === gameType);
  }

  async getAvailableRooms(): Promise<Room[]> {
    return Array.from(this.rooms.values()).filter(room => 
      room.status === 'waiting' && room.currentPlayers < room.maxPlayers
    );
  }

  async addPlayerToRoom(insertRoomPlayer: InsertRoomPlayer): Promise<RoomPlayer> {
    const id = this.currentRoomPlayerId++;
    const roomPlayer: RoomPlayer = {
      ...insertRoomPlayer,
      id,
      joinedAt: new Date()
    };
    
    const key = `${insertRoomPlayer.roomId}-${insertRoomPlayer.userId}`;
    this.roomPlayers.set(key, roomPlayer);
    
    // Update room player count
    const room = this.rooms.get(insertRoomPlayer.roomId!);
    if (room) {
      room.currentPlayers = (room.currentPlayers || 0) + 1;
      room.updatedAt = new Date();
      this.rooms.set(insertRoomPlayer.roomId!, room);
    }
    
    return roomPlayer;
  }

  async removePlayerFromRoom(roomId: number, userId: number): Promise<void> {
    const key = `${roomId}-${userId}`;
    this.roomPlayers.delete(key);
    
    // Update room player count
    const room = this.rooms.get(roomId);
    if (room) {
      room.currentPlayers = Math.max(0, (room.currentPlayers || 0) - 1);
      room.updatedAt = new Date();
      this.rooms.set(roomId, room);
    }
  }

  async getRoomPlayers(roomId: number): Promise<RoomPlayer[]> {
    return Array.from(this.roomPlayers.values()).filter(player => player.roomId === roomId);
  }

  async updatePlayerReadyStatus(roomId: number, userId: number, isReady: boolean): Promise<void> {
    const key = `${roomId}-${userId}`;
    const player = this.roomPlayers.get(key);
    if (player) {
      player.isReady = isReady;
      this.roomPlayers.set(key, player);
    }
  }

  async updatePlayerConnection(roomId: number, userId: number, isConnected: boolean): Promise<void> {
    const key = `${roomId}-${userId}`;
    const player = this.roomPlayers.get(key);
    if (player) {
      player.isConnected = isConnected;
      this.roomPlayers.set(key, player);
    }
  }

  async createGameHistory(insertHistory: InsertGameHistory): Promise<GameHistory> {
    const id = this.currentGameHistoryId++;
    const history: GameHistory = {
      ...insertHistory,
      id,
      completedAt: new Date()
    };
    this.gameHistory.set(id, history);
    return history;
  }

  async getPlayerStats(userId: number): Promise<{ wins: number; totalWinnings: number; gamesPlayed: number }> {
    const histories = Array.from(this.gameHistory.values());
    const playerHistories = histories.filter(h => {
      const players = h.players as any[];
      return players.some(p => p.userId === userId);
    });
    
    const wins = histories.filter(h => h.winnerId === userId).length;
    const totalWinnings = histories
      .filter(h => h.winnerId === userId)
      .reduce((sum, h) => sum + h.winnings, 0);
    
    return {
      wins,
      totalWinnings,
      gamesPlayed: playerHistories.length
    };
  }

  async getLeaderboard(): Promise<{ user: User; stats: { wins: number; totalWinnings: number; gamesPlayed: number } }[]> {
    const allUsers = Array.from(this.users.values());
    const leaderboard = await Promise.all(
      allUsers.map(async user => ({
        user,
        stats: await this.getPlayerStats(user.id)
      }))
    );
    
    return leaderboard
      .filter(entry => entry.stats.gamesPlayed > 0)
      .sort((a, b) => b.stats.totalWinnings - a.stats.totalWinnings);
  }
}

export const storage = new MemStorage();
