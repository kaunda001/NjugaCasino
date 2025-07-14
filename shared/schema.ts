import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  phoneNumber: text("phone_number").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name"),
  dateOfBirth: text("date_of_birth").notNull(),
  country: text("country").notNull(),
  balance: integer("balance").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const rooms = pgTable("rooms", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  gameType: text("game_type").notNull(), // 'njuga', 'shansha', 'chinshingwa'
  stakes: integer("stakes").notNull(),
  maxPlayers: integer("max_players").notNull(),
  currentPlayers: integer("current_players").default(0),
  status: text("status").default("waiting"), // 'waiting', 'playing', 'finished'
  pot: integer("pot").default(0),
  gameState: jsonb("game_state"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const roomPlayers = pgTable("room_players", {
  id: serial("id").primaryKey(),
  roomId: integer("room_id").references(() => rooms.id),
  userId: integer("user_id").references(() => users.id),
  position: integer("position").notNull(),
  isReady: boolean("is_ready").default(false),
  isConnected: boolean("is_connected").default(true),
  bet: integer("bet").default(0),
  joinedAt: timestamp("joined_at").defaultNow()
});

export const gameHistory = pgTable("game_history", {
  id: serial("id").primaryKey(),
  roomId: integer("room_id").references(() => rooms.id),
  winnerId: integer("winner_id").references(() => users.id),
  gameType: text("game_type").notNull(),
  stakes: integer("stakes").notNull(),
  pot: integer("pot").notNull(),
  winnings: integer("winnings").notNull(),
  houseCut: integer("house_cut").notNull(),
  players: jsonb("players"), // Array of player data
  gameData: jsonb("game_data"), // Game-specific data
  completedAt: timestamp("completed_at").defaultNow()
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const signUpSchema = insertUserSchema.extend({
  confirmPassword: z.string().min(6, "Password must be at least 6 characters")
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

export const signInSchema = z.object({
  phoneNumber: z.string().min(1, "Phone number is required"),
  password: z.string().min(1, "Password is required")
});

export type SignUpData = z.infer<typeof signUpSchema>;
export type SignInData = z.infer<typeof signInSchema>;

export const insertRoomSchema = createInsertSchema(rooms).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertRoomPlayerSchema = createInsertSchema(roomPlayers).omit({
  id: true,
  joinedAt: true
});

export const insertGameHistorySchema = createInsertSchema(gameHistory).omit({
  id: true,
  completedAt: true
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertRoom = z.infer<typeof insertRoomSchema>;
export type Room = typeof rooms.$inferSelect;
export type InsertRoomPlayer = z.infer<typeof insertRoomPlayerSchema>;
export type RoomPlayer = typeof roomPlayers.$inferSelect;
export type InsertGameHistory = z.infer<typeof insertGameHistorySchema>;
export type GameHistory = typeof gameHistory.$inferSelect;

// Game-specific types
export type GameType = 'njuga' | 'shansha' | 'chinshingwa';
export type RoomStatus = 'waiting' | 'playing' | 'finished';

export interface Card {
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  value: 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';
  id: string;
}

export interface NjugaGameState {
  deck: Card[];
  discardPile: Card[];
  playerHands: { [playerId: string]: Card[] };
  currentTurn: string;
  hasWinner: boolean;
  winnerId?: string;
}

export interface ShanshaGameState {
  playerGrids: { [playerId: string]: (number | null)[][] };
  moneyPlacements: { [playerId: string]: { x: number; y: number; amount: number }[] };
  guesses: { [playerId: string]: { x: number; y: number; hit: boolean }[] };
  currentTurn: string;
  hasWinner: boolean;
  winnerId?: string;
}

export interface ChinshingwaGameState {
  board: (string | null)[][];
  currentTurn: string;
  hasWinner: boolean;
  winnerId?: string;
  kings: { [playerId: string]: { x: number; y: number }[] };
}

export interface PlayerInfo {
  id: string;
  userId: number;
  phoneNumber: string;
  displayName: string;
  balance: number;
  position: number;
  isReady: boolean;
  isConnected: boolean;
  bet: number;
}

export interface RoomInfo {
  id: number;
  name: string;
  gameType: GameType;
  stakes: number;
  maxPlayers: number;
  currentPlayers: number;
  status: RoomStatus;
  pot: number;
  players: PlayerInfo[];
  gameState: NjugaGameState | ShanshaGameState | ChinshingwaGameState | null;
}
