import React from 'react';
import { Bot } from 'lucide-react';
import ChatMessage from './ChatMessage';
import { Message } from '../types/chat';

interface ChatAreaProps {
  messages: Message[];
  isLoading: boolean;
}

export default function ChatArea({ messages, isLoading }: ChatAreaProps) {
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-theme-bg-primary to-theme-bg-secondary dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-theme-lg">
            <img 
              src="/hedron-bot.png" 
              alt="Hedron Bot" 
              className="w-20 h-20 object-cover rounded-full"
            />
          </div>
          <h2 className="text-3xl font-bold text-theme-text-primary mb-3">
            Welcome to Hedron Agent
          </h2>
          <p className="text-theme-text-secondary max-w-md mx-auto text-lg leading-relaxed">
            Start a conversation with your AI assistant. Ask questions, get help, 
            or just have a chat!
          </p>
          <div className="mt-8 flex justify-center">
            <div className="bg-theme-bg-secondary dark:bg-gray-800 px-6 py-3 rounded-full shadow-theme-md border border-theme-border-primary dark:border-gray-700">
              <span className="text-sm text-theme-text-tertiary font-medium">Type a message to begin</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-b from-theme-bg-primary/50 to-theme-bg-secondary dark:from-gray-900/50 dark:to-gray-800">
      <div className="max-w-4xl mx-auto p-8">
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}
        
        {isLoading && (
          <div className="flex gap-4 mb-8 group">
            <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-theme-md">
              <img 
                src="/hedron-bot.png" 
                alt="Hedron Bot" 
                className="w-10 h-10 object-cover rounded-full"
              />
            </div>
            <div className="flex-1 max-w-[80%]">
              <div className="inline-block px-5 py-4 rounded-2xl rounded-bl-md bg-theme-bg-secondary dark:bg-gray-800 border border-theme-border-primary dark:border-gray-700 shadow-theme-sm">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 bg-blue-400 dark:bg-blue-500 rounded-full animate-bounce" />
                  <div className="w-2.5 h-2.5 bg-blue-400 dark:bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                  <div className="w-2.5 h-2.5 bg-blue-400 dark:bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}