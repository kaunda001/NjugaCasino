import { useState, useEffect, useRef } from 'react';
import { useAuth } from './useAuth';
import { RoomInfo } from '@shared/schema';

export function useSocket() {
  const { getToken } = useAuth();
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentRoom, setCurrentRoom] = useState<RoomInfo | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    connectSocket();
    
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socket) {
        socket.close();
      }
    };
  }, []);

  const connectSocket = async () => {
    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = async () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        
        // Authenticate with server
        const token = await getToken();
        if (token) {
          ws.send(JSON.stringify({ type: 'authenticate', token }));
        }
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        setSocket(null);
        
        // Attempt to reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          connectSocket();
        }, 3000);
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
      
      setSocket(ws);
    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
    }
  };

  const handleMessage = (data: any) => {
    switch (data.type) {
      case 'authenticated':
        console.log('Authenticated with server');
        break;
        
      case 'roomUpdate':
        setCurrentRoom(data.data);
        break;
        
      case 'roomJoined':
        console.log('Joined room:', data.roomId);
        break;
        
      case 'roomLeft':
        setCurrentRoom(null);
        break;
        
      case 'error':
        console.error('Server error:', data.message);
        break;
        
      default:
        console.log('Unknown message type:', data.type);
    }
  };

  const joinRoom = (userId: number, roomId: number, stakes: number) => {
    if (socket && isConnected) {
      socket.send(JSON.stringify({
        type: 'joinRoom',
        userId,
        roomId,
        stakes
      }));
    }
  };

  const leaveRoom = (userId: number, roomId: number) => {
    if (socket && isConnected) {
      socket.send(JSON.stringify({
        type: 'leaveRoom',
        userId,
        roomId
      }));
    }
  };

  const toggleReady = (userId: number, roomId: number) => {
    if (socket && isConnected) {
      socket.send(JSON.stringify({
        type: 'toggleReady',
        userId,
        roomId
      }));
    }
  };

  const sendGameAction = (userId: number, roomId: number, action: string, actionData: any) => {
    if (socket && isConnected) {
      socket.send(JSON.stringify({
        type: 'gameAction',
        userId,
        roomId,
        action,
        actionData
      }));
    }
  };

  return {
    socket,
    isConnected,
    currentRoom,
    joinRoom,
    leaveRoom,
    toggleReady,
    sendGameAction
  };
}
