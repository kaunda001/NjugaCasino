import { useState, useEffect, useRef } from 'react';
import { useAuth } from './useAuth';
import { RoomInfo } from '@shared/schema';

export function useSocket() {
  const { getToken } = useAuth();
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentRoom, setCurrentRoom] = useState<RoomInfo | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const isConnectingRef = useRef(false);

  useEffect(() => {
    // Only connect if authenticated
    const token = localStorage.getItem('authToken');
    if (token) {
      connectSocket();
    }
    
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socket) {
        socket.close(1000, 'Component unmounting');
      }
    };
  }, []);

  const connectSocket = async () => {
    // Prevent multiple simultaneous connections
    if (isConnectingRef.current) return;
    isConnectingRef.current = true;
    
    try {
      // Clear any existing timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      // Close existing socket if any
      if (socket) {
        socket.close(1000, 'Reconnecting');
      }
      
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = async () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        isConnectingRef.current = false;
        
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
      
      ws.onclose = (event) => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        setSocket(null);
        isConnectingRef.current = false;
        
        // Only reconnect if it wasn't a normal close and we have a token
        if (event.code !== 1000 && localStorage.getItem('authToken')) {
          reconnectTimeoutRef.current = setTimeout(() => {
            connectSocket();
          }, 3000);
        }
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        isConnectingRef.current = false;
      };
      
      setSocket(ws);
    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
      isConnectingRef.current = false;
      
      // Retry connection after error if we have a token
      if (localStorage.getItem('authToken')) {
        reconnectTimeoutRef.current = setTimeout(() => {
          connectSocket();
        }, 3000);
      }
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
