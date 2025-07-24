import React from 'react'
import { Wallet, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { useWallet } from '../hooks/useWallet'

interface WalletButtonProps {
  variant?: 'full' | 'compact'
  className?: string
}

export default function WalletButton({ variant = 'full', className = '' }: WalletButtonProps) {
  const { 
    address, 
    isConnected, 
    isConnecting, 
    chain, 
    balance, 
    connect, 
    disconnect, 
    formatAddress, 
    formatBalance 
  } = useWallet()

  if (variant === 'compact') {
    return (
      <button 
        onClick={isConnected ? disconnect : connect}
        disabled={isConnecting}
        className={`
          p-2 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm
          ${isConnected 
            ? 'bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-700 hover:to-green-800 text-white' 
            : 'bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white'
          }
          ${className}
        `}
        aria-label={isConnected ? 'Disconnect wallet' : 'Connect wallet'}
      >
        {isConnecting ? (
          <Loader2 size={16} className="animate-spin" />
        ) : isConnected ? (
          <CheckCircle size={16} />
        ) : (
          <Wallet size={16} />
        )}
      </button>
    )
  }

  return (
    <button 
      onClick={isConnected ? disconnect : connect}
      disabled={isConnecting}
      className={`
        transition-all duration-200 px-4 py-2.5 rounded-lg flex items-center gap-2.5 font-medium text-sm
        shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98]
        border flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed
        ${isConnected 
          ? 'bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-700 hover:to-green-800 text-white border-emerald-500/20' 
          : 'bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white border-green-500/20'
        }
        ${className}
      `}
    >
      {isConnecting ? (
        <>
          <Loader2 size={16} className="animate-spin" />
          <div className="text-left">
            <div className="text-sm font-semibold">Connecting...</div>
            <div className="text-xs text-green-100 opacity-90">Please wait</div>
          </div>
        </>
      ) : isConnected ? (
        <>
          <div className="relative">
            <CheckCircle size={16} />
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-300 rounded-full animate-pulse" />
          </div>
          <div className="text-left">
            <div className="text-xs font-semibold">
              {formatAddress(address!)} • {chain?.name || 'Unknown'}
            </div>
            <div className="text-xs text-green-100 opacity-90 font-mono">
              {balance ? `${formatBalance(balance)} ${balance.symbol}` : 'Loading...'}
            </div>
          </div>
        </>
      ) : (
        <>
          <Wallet size={16} />
          <div className="text-left">
            <div className="text-sm font-semibold">Connect Wallet</div>
            <div className="text-xs text-green-100 opacity-90">Via Reown</div>
          </div>
        </>
      )}
    </button>
  )
}