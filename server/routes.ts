import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { RoomManager } from "./services/roomManager";
import { verifyIdToken } from "./services/firebaseAdmin";
import { insertUserSchema, signUpSchema, signInSchema } from "@shared/schema";
import { z } from "zod";
import jwt from 'jsonwebtoken';

export async function registerRoutes(app: Express): Promise<Server> {
  const roomManager = RoomManager.getInstance();
  
  // Authentication middleware
  async function authenticateToken(req: any, res: any, next: any) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'Access token required' });
    }
    
    try {
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'default-secret');
      const user = await storage.getUser(decoded.userId);
      
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }
      
      req.user = user;
      next();
    } catch (error) {
      return res.status(403).json({ message: 'Invalid token' });
    }
  }

  // Authentication routes
  app.post('/api/auth/signup', async (req, res) => {
    try {
      const userData = signUpSchema.parse(req.body);
      
      // Check age requirement (18+)
      const birthDate = new Date(userData.dateOfBirth);
      const age = new Date().getFullYear() - birthDate.getFullYear();
      const monthDiff = new Date().getMonth() - birthDate.getMonth();
      
      if (age < 18 || (age === 18 && monthDiff < 0) || 
          (age === 18 && monthDiff === 0 && new Date().getDate() < birthDate.getDate())) {
        return res.status(400).json({ message: 'You must be 18 or older to register' });
      }
      
      // Check if user already exists
      const existingUser = await storage.getUserByPhoneNumber(userData.phoneNumber);
      if (existingUser) {
        return res.status(400).json({ message: 'Phone number already registered' });
      }
      
      // Create new user
      const { confirmPassword, ...userDataForDB } = userData;
      const newUser = await storage.createUser({
        ...userDataForDB,
        balance: 1000 // Starting balance
      });
      
      // Generate JWT token
      const token = jwt.sign(
        { userId: newUser.id, phoneNumber: newUser.phoneNumber },
        process.env.JWT_SECRET || 'default-secret',
        { expiresIn: '7d' }
      );
      
      // Remove password from response
      const { password, ...userResponse } = newUser;
      res.json({ user: userResponse, token });
    } catch (error) {
      console.error('Registration error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: 'Registration failed' });
    }
  });

  app.post('/api/auth/signin', async (req, res) => {
    try {
      const { phoneNumber, password } = signInSchema.parse(req.body);
      
      const user = await storage.authenticateUser(phoneNumber, password);
      if (!user) {
        return res.status(401).json({ message: 'Invalid phone number or password' });
      }
      
      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, phoneNumber: user.phoneNumber },
        process.env.JWT_SECRET || 'default-secret',
        { expiresIn: '7d' }
      );
      
      // Remove password from response
      const { password: _, ...userResponse } = user;
      res.json({ user: userResponse, token });
    } catch (error) {
      console.error('Login error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: 'Login failed' });
    }
  });

  app.get('/api/auth/verify', async (req, res) => {
    try {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];
      
      if (!token) {
        return res.status(401).json({ message: 'Access token required' });
      }
      
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'default-secret');
      const user = await storage.getUser(decoded.userId);
      
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }
      
      // Remove password from response
      const { password, ...userResponse } = user;
      res.json({ user: userResponse });
    } catch (error) {
      console.error('Token verification error:', error);
      res.status(403).json({ message: 'Invalid token' });
    }
  });

  app.get('/api/auth/me', authenticateToken, async (req, res) => {
    res.json({ user: req.user });
  });

  // Room routes
  app.get('/api/rooms', authenticateToken, async (req, res) => {
    try {
      const rooms = await roomManager.getAvailableRooms();
      res.json({ rooms });
    } catch (error) {
      console.error('Error fetching rooms:', error);
      res.status(500).json({ message: 'Failed to fetch rooms' });
    }
  });

  app.post('/api/rooms', authenticateToken, async (req, res) => {
    try {
      const { gameType, stakes } = req.body;
      
      if (!gameType || !stakes) {
        return res.status(400).json({ message: 'Game type and stakes required' });
      }
      
      const roomId = await roomManager.createRoom(gameType, stakes);
      res.json({ roomId });
    } catch (error) {
      console.error('Error creating room:', error);
      res.status(500).json({ message: 'Failed to create room' });
    }
  });

  app.post('/api/rooms/:id/join', authenticateToken, async (req, res) => {
    try {
      const roomId = parseInt(req.params.id);
      const { stakes } = req.body;
      
      const success = await roomManager.joinRoom(req.user.id, roomId, stakes);
      
      if (success) {
        res.json({ message: 'Joined room successfully' });
      } else {
        res.status(400).json({ message: 'Unable to join room' });
      }
    } catch (error) {
      console.error('Error joining room:', error);
      res.status(500).json({ message: 'Failed to join room' });
    }
  });

  app.post('/api/rooms/:id/leave', authenticateToken, async (req, res) => {
    try {
      const roomId = parseInt(req.params.id);
      await roomManager.leaveRoom(req.user.id, roomId);
      res.json({ message: 'Left room successfully' });
    } catch (error) {
      console.error('Error leaving room:', error);
      res.status(500).json({ message: 'Failed to leave room' });
    }
  });

  // Leaderboard route
  app.get('/api/leaderboard', authenticateToken, async (req, res) => {
    try {
      const leaderboard = await storage.getLeaderboard();
      res.json({ leaderboard });
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      res.status(500).json({ message: 'Failed to fetch leaderboard' });
    }
  });

  // User balance route
  app.get('/api/user/balance', authenticateToken, async (req, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      res.json({ balance: user?.balance || 0 });
    } catch (error) {
      console.error('Error fetching balance:', error);
      res.status(500).json({ message: 'Failed to fetch balance' });
    }
  });

  const httpServer = createServer(app);

  // WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', (ws: WebSocket, req) => {
    console.log('New WebSocket connection');
    
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        switch (data.type) {
          case 'authenticate':
            try {
              const decoded: any = jwt.verify(data.token, process.env.JWT_SECRET || 'default-secret');
              const user = await storage.getUser(decoded.userId);
              
              if (user) {
                roomManager.addPlayer(user.id, ws);
                const { password, ...userResponse } = user;
                ws.send(JSON.stringify({ type: 'authenticated', user: userResponse }));
              } else {
                ws.send(JSON.stringify({ type: 'error', message: 'User not found' }));
              }
            } catch (error) {
              ws.send(JSON.stringify({ type: 'error', message: 'Authentication failed' }));
            }
            break;
            
          case 'joinRoom':
            const success = await roomManager.joinRoom(data.userId, data.roomId, data.stakes);
            if (success) {
              ws.send(JSON.stringify({ type: 'roomJoined', roomId: data.roomId }));
            } else {
              ws.send(JSON.stringify({ type: 'error', message: 'Failed to join room' }));
            }
            break;
            
          case 'leaveRoom':
            await roomManager.leaveRoom(data.userId, data.roomId);
            ws.send(JSON.stringify({ type: 'roomLeft' }));
            break;
            
          case 'toggleReady':
            await roomManager.toggleReady(data.userId, data.roomId);
            break;
            
          case 'gameAction':
            await roomManager.handleGameAction(data.userId, data.roomId, data.action, data.actionData);
            break;
            
          default:
            ws.send(JSON.stringify({ type: 'error', message: 'Unknown message type' }));
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
      }
    });
    
    ws.on('close', () => {
      console.log('WebSocket connection closed');
    });
  });

  return httpServer;
}
