import React, { useState } from 'react';
import { Menu, X, Wallet, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import ChatSidebar from './components/ChatSidebar';
import ChatArea from './components/ChatArea';
import ChatInput from './components/ChatInput';
import ThemeToggle from './components/ThemeToggle';
import WalletButton from './components/WalletButton';
import { useTheme } from './hooks/useTheme';
import { useChat } from './hooks/useChat';

function App() {
  // Initialize theme
  useTheme();
  
  // Mock wallet connection state - replace with actual wallet integration
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [walletAccount, setWalletAccount] = useState<string | null>(null);

  const {
    sessions,
    currentSession,
    isLoading,
    createNewSession,
    selectSession,
    deleteSession,
    renameSession,
    sendMessage,
  } = useChat();

  const [message, setMessage] = useState('');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarHidden, setIsSidebarHidden] = useState(false);

  // Mock wallet connection function
  const handleWalletConnect = () => {
    if (isWalletConnected) {
      // Disconnect
      setIsWalletConnected(false);
      setWalletAccount(null);
    } else {
      // Connect (mock)
      setIsWalletConnected(true);
      setWalletAccount('0.0.123456');
    }
  };

  const handleSendMessage = async () => {
    if (message.trim() && !isLoading) {
      const messageToSend = message;
      setMessage('');
      await sendMessage(messageToSend);
    }
  };

  const handleNewChat = () => {
    createNewSession();
    setIsMobileSidebarOpen(false);
  };

  const handleSelectChat = (sessionId: string) => {
    selectSession(sessionId);
    setIsMobileSidebarOpen(false);
  };

  return (
    <div className="h-screen bg-theme-bg-primary dark:bg-gray-900 flex transition-colors duration-300">
      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-theme-bg-secondary/95 dark:bg-gray-800/95 backdrop-blur-md border-b border-theme-border-primary dark:border-gray-700 px-4 py-2.5 shadow-theme-sm">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            className="p-2 hover:bg-theme-bg-tertiary dark:hover:bg-gray-700 rounded-lg transition-all duration-200 hover:scale-105 text-theme-text-primary"
          >
            {isMobileSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <h1 className="font-bold text-theme-text-primary text-base truncate flex-1 text-center mx-4">
            {currentSession?.title || 'Hedron Agent'}
          </h1>
          <div className="flex items-center gap-1.5">
            <ThemeToggle variant="compact" />
            <WalletButton variant="compact" />
          </div>
        </div>
      </div>

      {/* Sidebar */}
      {!isSidebarHidden && (
        <ChatSidebar
          sessions={sessions}
          currentSessionId={currentSession?.id || null}
          isWalletConnected={isWalletConnected}
          walletAccount={walletAccount}
          onToggleSidebar={() => setIsSidebarHidden(true)}
          onNewChat={handleNewChat}
          onSelectChat={handleSelectChat}
          onDeleteChat={deleteSession}
          onRenameChat={renameSession}
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Main chat area */}
      <div className="flex-1 flex flex-col lg:ml-0">
        {/* Desktop header */}
        <div className="hidden lg:block border-b border-theme-border-primary dark:border-gray-700 bg-theme-bg-secondary/95 dark:bg-gray-800/95 backdrop-blur-md px-8 py-4 shadow-theme-sm">
          <div className="flex items-center justify-between">
            {/* Left section with sidebar toggle */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsSidebarHidden(!isSidebarHidden)}
                className="p-2 hover:bg-theme-bg-tertiary dark:hover:bg-gray-700 rounded-lg transition-all duration-200 hover:scale-105 text-theme-text-primary"
                aria-label="Show sidebar"
              >
                <PanelLeftOpen size={18} />
              </button>
              
              <div className="h-5 w-px bg-theme-border-primary dark:bg-gray-600" />
              
              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-bold text-theme-text-primary truncate">
                  {currentSession?.title || 'Hedron Agent'}
                </h1>
                <p className="text-xs text-theme-text-secondary mt-0.5 font-medium">
                  {currentSession ? `${currentSession.messages.length} messages` : 'Start a new conversation'}
                </p>
              </div>
            </div>
            
            {/* Right section with controls */}
            <div className="flex items-center gap-3 ml-4">
              {isSidebarHidden && (
                <button
                  onClick={handleNewChat}
                  className="px-3 py-2 bg-theme-accent hover:bg-theme-accent-hover text-white rounded-lg transition-all duration-200 hover:scale-105 text-sm font-medium"
                >
                  New Chat
                </button>
              )}
              
              <ThemeToggle />
              <WalletButton />
            </div>
          </div>
        </div>

        {/* Chat messages area */}
        <div className="flex-1 flex flex-col pt-16 lg:pt-0">
          <ChatArea
            messages={currentSession?.messages || []}
            isLoading={isLoading}
          />

          {/* Message input */}
          <ChatInput
            message={message}
            setMessage={setMessage}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}

export default App;