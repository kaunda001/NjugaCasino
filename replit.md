# Njuga Gambling Platform

## Overview

Njuga is a multiplayer real-time gambling platform built with React and Express.js. The platform hosts three distinct games: Njuga (card-based matching), Shansha (money grid game), and Chinshingwa (checkers variant). The system uses WebSocket connections for real-time gameplay, Firebase for authentication, and PostgreSQL with Drizzle ORM for data persistence.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Build Tool**: Vite for development and production builds
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack Query for server state, React hooks for local state
- **Routing**: Wouter for client-side routing
- **Authentication**: Firebase Auth with phone number verification

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **WebSocket**: Native WebSocket implementation for real-time communication
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Firebase Admin SDK for token verification
- **Session Management**: Connect-pg-simple for session storage
- **Database Migrations**: Drizzle Kit for schema management

## Key Components

### Authentication System
- Password-based authentication with phone number and additional user data
- JWT token verification on the server with bcrypt password hashing
- User registration requires phone number, display name, date of birth (18+), country, and password
- User login uses phone number and password
- Session management for WebSocket connections

### Game Engine
- **RoomManager**: Handles room creation, player management, and game state
- **GameLogic**: Contains game-specific rules and mechanics for all three games
- **Real-time Communication**: WebSocket connections for live gameplay
- **State Persistence**: Game states and history stored in PostgreSQL

### Data Models
- **Users**: Player profiles with balance and statistics
- **Rooms**: Game rooms with stakes, player limits, and current state
- **RoomPlayers**: Junction table for player-room relationships
- **GameHistory**: Historical game data for statistics and leaderboards

## Data Flow

### User Authentication Flow
1. User selects sign-up or sign-in mode in AuthModal
2. For sign-up: User enters phone number, display name, date of birth, country, and password
3. For sign-in: User enters phone number and password
4. Server validates age requirement (18+) for sign-up
5. Server creates account with bcrypt password hashing or authenticates existing user
6. Server generates JWT token and returns user data
7. User gains access to game lobby

### Game Session Flow
1. User selects game type and stakes in RoomModal
2. System creates room or joins existing room
3. WebSocket connection established with authentication
4. Real-time game state updates via WebSocket messages
5. Game completion updates user balance and statistics

### Real-time Communication
- WebSocket connections managed by RoomManager
- Message types: authenticate, joinRoom, leaveRoom, gameAction, roomUpdate
- Automatic reconnection handling with ghost player cleanup
- Turn-based game state synchronization

## External Dependencies

### Authentication
- **bcrypt**: Password hashing for secure storage
- **jsonwebtoken**: JWT token generation and verification
- **Firebase** (legacy): Client SDK still included for potential future use

### Database
- **Neon Database**: PostgreSQL hosting with connection pooling
- **Drizzle ORM**: Type-safe database queries and migrations
- **Connect-pg-simple**: PostgreSQL session store

### UI/UX
- **Radix UI**: Accessible component primitives
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library

### Development Tools
- **Vite**: Fast build tool with HMR
- **TypeScript**: Type safety across the application
- **ESBuild**: Fast JavaScript bundler for production

## Deployment Strategy

### Build Process
- Frontend: Vite builds React app to `dist/public`
- Backend: ESBuild bundles Express server to `dist/index.js`
- Database: Drizzle migrations applied via `db:push` script

### Environment Configuration
- Development: Local development with `tsx` for TypeScript execution
- Production: Node.js execution of bundled server
- Database: Environment-specific connection strings

### File Structure
```
├── client/          # React frontend
├── server/          # Express backend
├── shared/          # Shared types and schemas
├── migrations/      # Database migration files
└── dist/           # Production build output
```

### Game-Specific Logic
Each game has its own component and logic:
- **Njuga**: Card-based matching with deck management
- **Shansha**: Grid-based money placement and guessing
- **Chinshingwa**: Checkers variant with forfeit penalties

The architecture supports scalable real-time multiplayer gaming with proper separation of concerns between frontend, backend, and database layers.