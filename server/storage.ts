import { users, rooms, roomPlayers, gameHistory, type User, type InsertUser, type Room, type InsertRoom, type RoomPlayer, type InsertRoomPlayer, type GameHistory, type InsertGameHistory } from "@shared/schema";
import bcrypt from 'bcrypt';
import { db } from "./db";
import { eq, and } from "drizzle-orm";

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

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByPhoneNumber(phoneNumber: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.phoneNumber, phoneNumber));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        password: hashedPassword
      })
      .returning();
    return user;
  }

  async authenticateUser(phoneNumber: string, password: string): Promise<User | null> {
    const [user] = await db.select().from(users).where(eq(users.phoneNumber, phoneNumber));
    if (!user) return null;
    
    const isValid = await bcrypt.compare(password, user.password);
    return isValid ? user : null;
  }

  async updateUserBalance(userId: number, newBalance: number): Promise<void> {
    await db
      .update(users)
      .set({ balance: newBalance, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  async createRoom(insertRoom: InsertRoom): Promise<Room> {
    const [room] = await db
      .insert(rooms)
      .values(insertRoom)
      .returning();
    return room;
  }

  async getRoom(id: number): Promise<Room | undefined> {
    const [room] = await db.select().from(rooms).where(eq(rooms.id, id));
    return room || undefined;
  }

  async updateRoom(id: number, updates: Partial<Room>): Promise<void> {
    await db
      .update(rooms)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(rooms.id, id));
  }

  async getRoomsByGameType(gameType: string): Promise<Room[]> {
    return await db.select().from(rooms).where(eq(rooms.gameType, gameType));
  }

  async getAvailableRooms(): Promise<Room[]> {
    return await db.select().from(rooms).where(eq(rooms.status, 'waiting'));
  }

  async addPlayerToRoom(insertRoomPlayer: InsertRoomPlayer): Promise<RoomPlayer> {
    const [roomPlayer] = await db
      .insert(roomPlayers)
      .values(insertRoomPlayer)
      .returning();
    return roomPlayer;
  }

  async removePlayerFromRoom(roomId: number, userId: number): Promise<void> {
    await db
      .delete(roomPlayers)
      .where(and(
        eq(roomPlayers.roomId, roomId),
        eq(roomPlayers.userId, userId)
      ));
  }

  async getRoomPlayers(roomId: number): Promise<RoomPlayer[]> {
    return await db.select().from(roomPlayers).where(eq(roomPlayers.roomId, roomId));
  }

  async updatePlayerReadyStatus(roomId: number, userId: number, isReady: boolean): Promise<void> {
    await db
      .update(roomPlayers)
      .set({ isReady })
      .where(and(
        eq(roomPlayers.roomId, roomId),
        eq(roomPlayers.userId, userId)
      ));
  }

  async updatePlayerConnection(roomId: number, userId: number, isConnected: boolean): Promise<void> {
    await db
      .update(roomPlayers)
      .set({ isConnected })
      .where(and(
        eq(roomPlayers.roomId, roomId),
        eq(roomPlayers.userId, userId)
      ));
  }

  async createGameHistory(insertHistory: InsertGameHistory): Promise<GameHistory> {
    const [history] = await db
      .insert(gameHistory)
      .values(insertHistory)
      .returning();
    return history;
  }

  async getPlayerStats(userId: number): Promise<{ wins: number; totalWinnings: number; gamesPlayed: number }> {
    const histories = await db.select().from(gameHistory);
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
    const allUsers = await db.select().from(users);
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

export const storage = new DatabaseStorage();