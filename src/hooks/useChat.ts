import { useState, useCallback, useEffect } from 'react';
import { ChatSession, Message, TransactionData, WSAgentResponse, WSSystemMessage, WSTransactionToSign } from '../types/chat';
import { useWebSocket } from './useWebSocket';

const generateId = () => Math.random().toString(36).substr(2, 9);

export function useChat() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingTransactions, setPendingTransactions] = useState<Map<string, TransactionData>>(new Map());

  const { 
    isConnected, 
    isConnecting, 
    error: wsError, 
    sendMessage: sendWSMessage, 
    sendTransactionResult,
    lastMessage 
  } = useWebSocket();

  const currentSession = sessions.find(s => s.id === currentSessionId);

  // Handle incoming WebSocket messages
  useEffect(() => {
    if (!lastMessage) return;

    const sessionId = currentSessionId;
    if (!sessionId) return;

    switch (lastMessage.type) {
      case 'AGENT_RESPONSE':
        handleAgentResponse(lastMessage, sessionId);
        break;
      case 'SYSTEM_MESSAGE':
        handleSystemMessage(lastMessage, sessionId);
        break;
      case 'TRANSACTION_TO_SIGN':
        handleTransactionToSign(lastMessage, sessionId);
        break;
    }
  }, [lastMessage, currentSessionId]);

  const handleAgentResponse = (message: WSAgentResponse, sessionId: string) => {
    const aiMessage: Message = {
      id: generateId(),
      content: message.message,
      sender: 'ai',
      timestamp: new Date(),
      hasTransaction: message.hasTransaction
    };

    setSessions(prev => prev.map(session => 
      session.id === sessionId
        ? {
            ...session,
            messages: [...session.messages, aiMessage],
            updatedAt: new Date(),
          }
        : session
    ));

    setIsLoading(false);
  };

  const handleSystemMessage = (message: WSSystemMessage, sessionId: string) => {
    const systemMessage: Message = {
      id: generateId(),
      content: `[${message.level.toUpperCase()}] ${message.message}`,
      sender: 'system',
      timestamp: new Date()
    };

    setSessions(prev => prev.map(session => 
      session.id === sessionId
        ? {
            ...session,
            messages: [...session.messages, systemMessage],
            updatedAt: new Date(),
          }
        : session
    ));
  };

  const handleTransactionToSign = (message: WSTransactionToSign, sessionId: string) => {
    const transactionData: TransactionData = {
      originalQuery: message.originalQuery,
      transactionBytes: new Uint8Array(message.transactionBytes),
      status: 'pending'
    };

    const transactionMessage: Message = {
      id: generateId(),
      content: `🔏 Transaction received for signing:\n📝 Query: ${message.originalQuery}\n📊 Transaction size: ${message.transactionBytes.length} bytes\n\nThis transaction needs to be signed to proceed.`,
      sender: 'system',
      timestamp: new Date(),
      hasTransaction: true,
      transactionData
    };

    setSessions(prev => prev.map(session => 
      session.id === sessionId
        ? {
            ...session,
            messages: [...session.messages, transactionMessage],
            updatedAt: new Date(),
          }
        : session
    ));

    // Store pending transaction
    setPendingTransactions(prev => new Map(prev.set(transactionMessage.id, transactionData)));

    // Auto-approve for demo (similar to test client)
    setTimeout(() => {
      approveTransaction(transactionMessage.id);
    }, 2000);
  };

  const approveTransaction = useCallback((messageId: string) => {
    const transactionData = pendingTransactions.get(messageId);
    if (!transactionData) return;

    // Send transaction result to backend
    sendTransactionResult({
      success: true,
      transactionId: '0.0.5864846@' + Date.now() + '.123456789',
      status: 'SUCCESS',
      timestamp: Date.now()
    });

    // Update the message to show success
    setSessions(prev => prev.map(session => ({
      ...session,
      messages: session.messages.map(msg => 
        msg.id === messageId && msg.transactionData
          ? {
              ...msg,
              content: msg.content + '\n\n✅ Transaction approved and executed successfully!',
              transactionData: {
                ...msg.transactionData,
                status: 'success',
                transactionId: '0.0.5864846@' + Date.now() + '.123456789'
              }
            }
          : msg
      )
    })));

    // Remove from pending
    setPendingTransactions(prev => {
      const newMap = new Map(prev);
      newMap.delete(messageId);
      return newMap;
    });
  }, [pendingTransactions, sendTransactionResult]);

  const createNewSession = useCallback(() => {
    const newSession: ChatSession = {
      id: generateId(),
      title: 'New Chat',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
  }, []);

  const selectSession = useCallback((sessionId: string) => {
    setCurrentSessionId(sessionId);
  }, []);

  const deleteSession = useCallback((sessionId: string) => {
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    if (currentSessionId === sessionId) {
      setCurrentSessionId(null);
    }
  }, [currentSessionId]);

  const renameSession = useCallback((sessionId: string, newTitle: string) => {
    setSessions(prev => prev.map(session => 
      session.id === sessionId 
        ? { ...session, title: newTitle, updatedAt: new Date() }
        : session
    ));
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    if (!isConnected) {
      console.error('❌ Not connected to backend');
      return;
    }

    let sessionId = currentSessionId;
    
    // Create a new session if none exists
    if (!sessionId) {
      const newSession: ChatSession = {
        id: generateId(),
        title: content.slice(0, 50) + (content.length > 50 ? '...' : ''),
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setSessions(prev => [newSession, ...prev]);
      sessionId = newSession.id;
      setCurrentSessionId(sessionId);
    }

    // Add user message
    const userMessage: Message = {
      id: generateId(),
      content,
      sender: 'user',
      timestamp: new Date(),
    };

    setSessions(prev => prev.map(session => {
      if (session.id === sessionId) {
        const updatedMessages = [...session.messages, userMessage];
        return {
          ...session,
          messages: updatedMessages,
          updatedAt: new Date(),
          // Update title if this is the first message
          title: session.messages.length === 0 
            ? content.slice(0, 50) + (content.length > 50 ? '...' : '')
            : session.title
        };
      }
      return session;
    }));

    // Send message via WebSocket
    setIsLoading(true);
    try {
      sendWSMessage(content);
    } catch (error) {
      console.error('Failed to send message:', error);
      setIsLoading(false);
      
      // Add error message to chat
      const errorMessage: Message = {
        id: generateId(),
        content: 'Failed to send message to backend. Please check your connection.',
        sender: 'system',
        timestamp: new Date(),
      };

      setSessions(prev => prev.map(session => 
        session.id === sessionId
          ? {
              ...session,
              messages: [...session.messages, errorMessage],
              updatedAt: new Date(),
            }
          : session
      ));
    }
  }, [currentSessionId, isConnected, sendWSMessage]);

  return {
    sessions,
    currentSession,
    isLoading,
    isConnected,
    isConnecting,
    wsError,
    createNewSession,
    selectSession,
    deleteSession,
    renameSession,
    sendMessage,
    approveTransaction,
  };
}