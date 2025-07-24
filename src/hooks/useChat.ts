import { useState, useCallback } from 'react';
import { ChatSession, Message } from '../types/chat';

const generateId = () => Math.random().toString(36).substr(2, 9);

// Mock AI response - replace with actual AI API call
const mockAIResponse = async (userMessage: string): Promise<string> => {
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
  
  const responses = [
    "I understand your question. Let me help you with that.",
    "That's an interesting point. Here's what I think about it...",
    "Based on what you've shared, I'd suggest the following approach:",
    "I can definitely help you with this. Let me break it down for you:",
    "Great question! Here's my analysis of the situation:",
    "I see what you're getting at. From my perspective, the key considerations are:",
  ];
  
  const randomResponse = responses[Math.floor(Math.random() * responses.length)];
  return `${randomResponse}\n\nRegarding "${userMessage}", this is a simulated AI response. In a real implementation, this would be connected to an actual AI service like OpenAI's GPT, Claude, or similar. The response would be generated based on the conversation context and the AI model's training.`;
};

export function useChat() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const currentSession = sessions.find(s => s.id === currentSessionId);

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

    // Get AI response
    setIsLoading(true);
    try {
      const aiResponse = await mockAIResponse(content);
      
      const aiMessage: Message = {
        id: generateId(),
        content: aiResponse,
        sender: 'ai',
        timestamp: new Date(),
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
    } catch (error) {
      console.error('Failed to get AI response:', error);
      // Handle error - could add error message to chat
    } finally {
      setIsLoading(false);
    }
  }, [currentSessionId]);

  return {
    sessions,
    currentSession,
    isLoading,
    createNewSession,
    selectSession,
    deleteSession,
    renameSession,
    sendMessage,
  };
}