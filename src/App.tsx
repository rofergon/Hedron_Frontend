import React, { useState } from 'react';
import { Menu, X, Wallet, PanelLeftClose, PanelLeftOpen, Wifi, WifiOff, AlertCircle } from 'lucide-react';
import ChatSidebar from './components/ChatSidebar';
import ChatArea from './components/ChatArea';
import ChatInput from './components/ChatInput';
import ThemeToggle from './components/ThemeToggle';
import WalletButton from './components/WalletButton';
import { useTheme } from './hooks/useTheme';
import { useChat } from './hooks/useChat';
import { useWallet } from './hooks/useWallet';

function App() {
  // Initialize theme
  useTheme();
  
  // Real wallet connection using HashConnect
  const { 
    address, 
    isConnected: isWalletConnected, 
    isConnecting,
    connect: handleWalletConnect,
    disconnect,
    formatAddress
  } = useWallet();

  const {
    sessions,
    currentSession,
    isLoading,
    isConnected: isWSConnected,
    isConnecting: isWSConnecting,
    isAuthenticated,
    isWalletConnected: isChatWalletConnected,
    wsError,
    createNewSession,
    selectSession,
    deleteSession,
    renameSession,
    sendMessage,
  } = useChat();

  const [message, setMessage] = useState('');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarHidden, setIsSidebarHidden] = useState(false);

  // Wallet account formatting for display
  const walletAccount = address ? formatAddress(address) : null;

  const handleSendMessage = async () => {
    if (message.trim() && !isLoading && isWSConnected && isAuthenticated && isWalletConnected) {
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

  // Connection status component
  const ConnectionStatus = ({ className = "" }: { className?: string }) => {
    if (isWSConnecting) {
      return (
        <div className={`flex items-center gap-2 text-yellow-600 dark:text-yellow-400 ${className}`}>
          <Wifi size={16} className="animate-pulse" />
          <span className="text-xs font-medium">Connecting...</span>
        </div>
      );
    }

    if (!isWSConnected) {
      return (
        <div className={`flex items-center gap-2 text-red-600 dark:text-red-400 ${className}`}>
          <WifiOff size={16} />
          <span className="text-xs font-medium">Disconnected</span>
        </div>
      );
    }

    if (!isWalletConnected) {
      return (
        <div className={`flex items-center gap-2 text-orange-600 dark:text-orange-400 ${className}`}>
          <Wallet size={16} />
          <span className="text-xs font-medium">Wallet Required</span>
        </div>
      );
    }

    if (!isAuthenticated) {
      return (
        <div className={`flex items-center gap-2 text-blue-600 dark:text-blue-400 ${className}`}>
          <Wifi size={16} className="animate-pulse" />
          <span className="text-xs font-medium">Authenticating...</span>
        </div>
      );
    }

    return (
      <div className={`flex items-center gap-2 text-green-600 dark:text-green-400 ${className}`}>
        <Wifi size={16} />
        <span className="text-xs font-medium">Connected & Ready</span>
      </div>
    );
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
          <div className="flex-1 text-center mx-4">
            <h1 className="font-bold text-theme-text-primary text-base truncate">
              {currentSession?.title || 'Hedron Agent'}
            </h1>
            <ConnectionStatus />
          </div>
          <div className="flex items-center gap-1.5">
            <ThemeToggle variant="compact" />
            <WalletButton variant="compact" />
          </div>
        </div>
      </div>

      {/* Connection Error Alert */}
      {wsError && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 max-w-md">
          <AlertCircle size={16} />
          <span className="text-sm font-medium">{wsError}</span>
        </div>
      )}

      {/* Sidebar */}
      {!isSidebarHidden && (
        <ChatSidebar
          sessions={sessions}
          currentSessionId={currentSession?.id || null}
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
                <div className="flex items-center gap-4 mt-0.5">
                  <p className="text-xs text-theme-text-secondary font-medium">
                    {currentSession ? `${currentSession.messages.length} messages` : 'Start a new conversation'}
                  </p>
                  <ConnectionStatus />
                </div>
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
            isLoading={isLoading || !isWSConnected || !isAuthenticated || !isWalletConnected}
            isConnected={isWSConnected && isAuthenticated && isWalletConnected}
          />
        </div>
      </div>
    </div>
  );
}

export default App;