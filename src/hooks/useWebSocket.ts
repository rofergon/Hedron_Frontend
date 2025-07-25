import { useState, useEffect, useCallback, useRef } from 'react';
import { WSIncomingMessage, WSOutgoingMessage, WSUserMessage, WSTransactionResult } from '../types/chat';

export interface UseWebSocketReturn {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  sendMessage: (message: string) => void;
  sendTransactionResult: (result: Omit<WSTransactionResult, 'type'>) => void;
  lastMessage: WSIncomingMessage | null;
}

export function useWebSocket(url: string = 'ws://localhost:8080'): UseWebSocketReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastMessage, setLastMessage] = useState<WSIncomingMessage | null>(null);
  
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      ws.current = new WebSocket(url);

      ws.current.onopen = () => {
        console.log('🔗 Connected to Hedera WebSocket Agent');
        setIsConnected(true);
        setIsConnecting(false);
        setError(null);
      };

      ws.current.onmessage = (event) => {
        try {
          const message: WSIncomingMessage = JSON.parse(event.data);
          console.log('📨 Received message:', message);
          setLastMessage(message);
        } catch (err) {
          console.error('❌ Failed to parse WebSocket message:', err);
          setError('Failed to parse message from server');
        }
      };

      ws.current.onclose = (event) => {
        console.log('🔌 WebSocket connection closed:', event.code, event.reason);
        setIsConnected(false);
        setIsConnecting(false);

        // Auto-reconnect after 3 seconds unless it was a clean close
        if (event.code !== 1000) {
          setError('Connection lost. Attempting to reconnect...');
          reconnectTimeout.current = setTimeout(() => {
            connect();
          }, 3000);
        }
      };

      ws.current.onerror = (event) => {
        console.error('❌ WebSocket error:', event);
        setError('Connection error. Check if the backend is running on port 8080.');
        setIsConnecting(false);
      };

    } catch (err) {
      console.error('❌ Failed to create WebSocket connection:', err);
      setError('Failed to connect to backend');
      setIsConnecting(false);
    }
  }, [url]);

  const disconnect = useCallback(() => {
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
      reconnectTimeout.current = null;
    }

    if (ws.current) {
      ws.current.close(1000, 'Client disconnect');
      ws.current = null;
    }

    setIsConnected(false);
    setIsConnecting(false);
  }, []);

  const sendMessage = useCallback((message: string) => {
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
      setError('Not connected to backend');
      return;
    }

    const userMessage: WSUserMessage = {
      type: 'USER_MESSAGE',
      message,
      timestamp: Date.now()
    };

    try {
      ws.current.send(JSON.stringify(userMessage));
      console.log('📤 Sent message:', userMessage);
    } catch (err) {
      console.error('❌ Failed to send message:', err);
      setError('Failed to send message');
    }
  }, []);

  const sendTransactionResult = useCallback((result: Omit<WSTransactionResult, 'type'>) => {
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
      setError('Not connected to backend');
      return;
    }

    const transactionResult: WSTransactionResult = {
      type: 'TRANSACTION_RESULT',
      ...result
    };

    try {
      ws.current.send(JSON.stringify(transactionResult));
      console.log('📤 Sent transaction result:', transactionResult);
    } catch (err) {
      console.error('❌ Failed to send transaction result:', err);
      setError('Failed to send transaction result');
    }
  }, []);

  // Connect on mount, disconnect on unmount
  useEffect(() => {
    connect();
    return disconnect;
  }, [connect, disconnect]);

  return {
    isConnected,
    isConnecting,
    error,
    sendMessage,
    sendTransactionResult,
    lastMessage
  };
} 