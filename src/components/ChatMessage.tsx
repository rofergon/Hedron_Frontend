import { Bot, User, Settings, CreditCard, CheckCircle, Clock } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Message } from '../types/chat';

interface ChatMessageProps {
  message: Message;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.sender === 'user';
  const isSystem = message.sender === 'system';
  const isAI = message.sender === 'ai';
  
  const getIcon = () => {
    if (isUser) return <User size={18} />;
    if (isSystem) {
      if (message.hasTransaction) {
        return message.transactionData?.status === 'success' 
          ? <CheckCircle size={18} />
          : <CreditCard size={18} />;
      }
      return <Settings size={18} />;
    }
    // This won't be used for bot messages since they render image directly
    return <Bot size={18} />;
  };

  const getAvatarStyle = () => {
    if (isUser) {
      return 'bg-gradient-to-br from-blue-600 to-blue-700 text-white';
    }
    if (isSystem) {
      if (message.hasTransaction) {
        return message.transactionData?.status === 'success'
          ? 'bg-gradient-to-br from-green-600 to-green-700 text-white'
          : 'bg-gradient-to-br from-orange-600 to-orange-700 text-white';
      }
      return 'bg-gradient-to-br from-purple-600 to-purple-700 text-white';
    }
    // For assistant/bot messages, no background - just the image
    return '';
  };

  const getMessageStyle = () => {
    if (isUser) {
      return 'bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-br-md';
    }
    if (isSystem) {
      if (message.hasTransaction) {
        return message.transactionData?.status === 'success'
          ? 'bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-700 rounded-bl-md'
          : 'bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30 text-orange-800 dark:text-orange-200 border border-orange-200 dark:border-orange-700 rounded-bl-md';
      }
      return 'bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 text-purple-800 dark:text-purple-200 border border-purple-200 dark:border-purple-700 rounded-bl-md';
    }
    return 'bg-theme-bg-secondary dark:bg-gray-800 text-theme-text-primary rounded-bl-md border border-theme-border-primary dark:border-gray-700';
  };

  const renderMessageContent = () => {
    if (isAI) {
      return (
        <ReactMarkdown
          components={{
            h1: (props: any) => (
              <h1 className="text-xl font-bold mb-4 text-theme-text-primary dark:text-white border-b border-theme-border-primary dark:border-gray-600 pb-2">
                {props.children}
              </h1>
            ),
            h2: (props: any) => (
              <h2 className="text-lg font-bold mb-3 text-theme-text-primary dark:text-white">
                {props.children}
              </h2>
            ),
            h3: (props: any) => (
              <h3 className="text-base font-bold mb-3 text-theme-text-primary dark:text-white border-b border-theme-border-primary dark:border-gray-600 pb-1">
                {props.children}
              </h3>
            ),
            p: (props: any) => (
              <p className="mb-3 last:mb-0 leading-relaxed">
                {props.children}
              </p>
            ),
            ul: (props: any) => (
              <ul className="mb-3 space-y-1">
                {props.children}
              </ul>
            ),
            li: (props: any) => (
              <li className="flex items-start gap-2">
                <span className="text-blue-500 dark:text-blue-400 font-bold mt-1">•</span>
                <span className="flex-1">{props.children}</span>
              </li>
            ),
            strong: (props: any) => (
              <strong className="font-semibold text-theme-text-primary dark:text-white">
                {props.children}
              </strong>
            ),
            code: (props: any) => (
              <code className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-sm font-mono">
                {props.children}
              </code>
            ),
            pre: (props: any) => (
              <pre className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg overflow-x-auto mb-3">
                {props.children}
              </pre>
            ),
          }}
        >
          {message.content}
        </ReactMarkdown>
      );
    }
    
    return (
      <div className="whitespace-pre-wrap break-words font-medium word-wrap">
        {message.content}
      </div>
    );
  };

  return (
    <div className={`flex gap-4 ${isUser ? 'flex-row-reverse' : ''} group w-full`}>
      {/* Avatar */}
      {!isUser && !isSystem ? (
        // For bot messages, show image directly without container
        <img 
          src="/hedron-bot.png" 
          alt="Hedron Bot" 
          className="w-10 h-10 object-cover rounded-full flex-shrink-0 shadow-md transition-transform duration-200 group-hover:scale-105"
        />
      ) : (
        // For user and system messages, use icon container
        <div className={`
          w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-md
          transition-transform duration-200 group-hover:scale-105
          ${getAvatarStyle()}
        `}>
          {getIcon()}
        </div>
      )}

      {/* Message Content */}
      <div className={`
        flex-1 min-w-0 ${isUser ? 'text-right flex flex-col items-end max-w-[85%]' : 'flex flex-col items-start max-w-[85%]'}
      `}>
        <div className={`
          inline-block px-5 py-4 rounded-2xl text-sm leading-relaxed shadow-sm
          transition-all duration-200 hover:shadow-theme-md w-auto max-w-full
          ${getMessageStyle()}
        `}>
          {renderMessageContent()}

          {/* Transaction Status Indicator */}
          {message.hasTransaction && message.transactionData && (
            <div className="mt-3 pt-3 border-t border-current opacity-60">
              <div className="flex items-center gap-2 text-xs">
                {message.transactionData.status === 'pending' && (
                  <>
                    <Clock size={14} className="animate-pulse" />
                    <span>Transaction pending...</span>
                  </>
                )}
                {message.transactionData.status === 'success' && (
                  <>
                    <CheckCircle size={14} />
                    <span>Transaction ID: {message.transactionData.transactionId}</span>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Timestamp */}
        <div className={`
          text-xs text-theme-text-tertiary mt-2 font-medium px-1
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