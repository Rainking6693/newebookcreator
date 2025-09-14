import { useState, useEffect, useRef, useCallback } from 'react';

type WebSocketMessage = {
  type: string;
  payload: any;
  timestamp: number;
};

interface UseWebSocketOptions {
  url?: string;
  protocols?: string | string[];
  enabled?: boolean;
  onOpen?: (event: Event) => void;
  onMessage?: (message: WebSocketMessage) => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (event: Event) => void;
  shouldReconnect?: boolean;
  reconnectAttempts?: number;
  reconnectInterval?: number;
}

interface UseWebSocketReturn {
  socket: WebSocket | null;
  isConnected: boolean;
  isConnecting: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  sendMessage: (message: WebSocketMessage) => void;
  sendData: (type: string, payload: any) => void;
  close: () => void;
  reconnect: () => void;
  lastMessage: WebSocketMessage | null;
}

export const useWebSocket = (options: UseWebSocketOptions = {}): UseWebSocketReturn => {
  const {
    url = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://localhost:8080',
    protocols,
    enabled = true,
    onOpen,
    onMessage,
    onClose,
    onError,
    shouldReconnect = true,
    reconnectAttempts = 5,
    reconnectInterval = 3000,
  } = options;

  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectCountRef = useRef(0);
  const shouldConnectRef = useRef(true);

  const connect = useCallback(() => {
    if (!shouldConnectRef.current || !enabled) return;
    
    setIsConnecting(true);
    setConnectionStatus('connecting');
    
    try {
      const ws = new WebSocket(url, protocols);
      
      ws.onopen = (event) => {
        setIsConnected(true);
        setIsConnecting(false);
        setConnectionStatus('connected');
        reconnectCountRef.current = 0;
        setSocket(ws);
        onOpen?.(event);
      };
      
      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          setLastMessage(message);
          onMessage?.(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };
      
      ws.onclose = (event) => {
        setIsConnected(false);
        setIsConnecting(false);
        setConnectionStatus('disconnected');
        setSocket(null);
        onClose?.(event);
        
        if (shouldReconnect && shouldConnectRef.current && reconnectCountRef.current < reconnectAttempts) {
          reconnectCountRef.current += 1;
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        }
      };
      
      ws.onerror = (event) => {
        console.error('WebSocket error:', event);
        setIsConnecting(false);
        setConnectionStatus('error');
        onError?.(event);
      };
      
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setIsConnecting(false);
      setConnectionStatus('error');
    }
  }, [url, protocols, enabled, onOpen, onMessage, onClose, onError, shouldReconnect, reconnectAttempts, reconnectInterval]);

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (socket && isConnected) {
      try {
        socket.send(JSON.stringify(message));
      } catch (error) {
        console.error('Failed to send WebSocket message:', error);
      }
    }
  }, [socket, isConnected]);

  const sendData = useCallback((type: string, payload: any) => {
    const message: WebSocketMessage = {
      type,
      payload,
      timestamp: Date.now(),
    };
    sendMessage(message);
  }, [sendMessage]);

  const close = useCallback(() => {
    shouldConnectRef.current = false;
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (socket) {
      socket.close();
    }
  }, [socket]);

  const reconnect = useCallback(() => {
    close();
    shouldConnectRef.current = true;
    reconnectCountRef.current = 0;
    connect();
  }, [close, connect]);

  useEffect(() => {
    if (enabled) {
      connect();
    }
    
    return () => {
      close();
    };
  }, [enabled]);

  return {
    socket,
    isConnected,
    isConnecting,
    connectionStatus,
    sendMessage,
    sendData,
    close,
    reconnect,
    lastMessage,
  };
};