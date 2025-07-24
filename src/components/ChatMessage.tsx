import React from 'react';
import { Bot, User } from 'lucide-react';
import { Message } from '../types/chat';

interface ChatMessageProps {
  message: Message;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.sender === 'user';
  
  return (
    <div className={`flex gap-4 mb-8 ${isUser ? 'flex-row-reverse' : ''} group`}>
      {/* Avatar */}
      <div className={`
        w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-md
        transition-transform duration-200 group-hover:scale-105
        ${isUser 
          ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white' 
          : 'bg-gradient-to-br from-gray-700 to-gray-800 dark:from-gray-600 dark:to-gray-700 text-gray-200 dark:text-gray-300'
        }
      `}>
        {isUser ? <User size={18} /> : <Bot size={18} />}
      </div>

      {/* Message Content */}
      <div className={`
        flex-1 max-w-[85%] ${isUser ? 'text-right' : ''}
      `}>
        <div className={`
          inline-block px-5 py-4 rounded-2xl text-sm leading-relaxed shadow-sm
          transition-all duration-200 hover:shadow-theme-md
          ${isUser 
            ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-br-md' 
            : 'bg-theme-bg-secondary dark:bg-gray-800 text-theme-text-primary rounded-bl-md border border-theme-border-primary dark:border-gray-700'
          }
        `}>
          <div className="whitespace-pre-wrap break-words font-medium">
            {message.content}
          </div>
        </div>
        
        {/* Timestamp */}
        <div className={`
          text-xs text-theme-text-tertiary mt-2 font-medium
          ${isUser ? 'text-right' : 'text-left'}
        `}>
          {message.timestamp.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </div>
      </div>
    </div>
  );
}