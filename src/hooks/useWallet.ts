import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { DAppConnector } from '@hashgraph/hedera-wallet-connect'
import { createDAppConnector, ConnectionState } from '../config/hashconnect'

// Global singleton to prevent multiple DAppConnector instances across hot reloads
let globalDAppConnectorInstance: DAppConnector | null = null
let globalInitPromise: Promise<DAppConnector> | null = null

export function useWallet() {
  const [dAppConnector, setDAppConnector] = useState<DAppConnector | null>(null)
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.Disconnected)
  const [sessionData, setSessionData] = useState<any>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [address, setAddress] = useState<string | null>(null)
  const [balance, setBalance] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  
  // Stable refs that persist across re-renders
  const modalOpenedRef = useRef(false)
  const modalTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const cleanupFunctionsRef = useRef<(() => void)[]>([])
  
  // Helper function to clear all WalletConnect storage
  const clearWalletConnectStorage = useCallback(() => {
    try {
      const storageKeys = [
        'wc@2:client:0.3//session',
        'wc@2:core:0.3//keychain', 
        'wc@2:core:0.3//messages',
        'wc@2:core:0.3//expirer',
        'wc@2:core:0.3//pairing',
        'wc@2:universal_provider://namespaces'
      ]
      storageKeys.forEach(key => {
        try {
          localStorage.removeItem(key)
        } catch (e) {
          // Ignore errors for individual keys
        }
      })
      console.log('🧹 Cleared all WalletConnect storage')
    } catch (e) {
      console.warn('Could not clear WalletConnect storage:', e)
    }
  }, [])

  // Get or create DAppConnector instance (singleton pattern)
  const getDAppConnectorInstance = useCallback(async (): Promise<DAppConnector> => {
    // Return existing instance if available
    if (globalDAppConnectorInstance) {
      console.log('♻️ Reusing existing DAppConnector instance')
      return globalDAppConnectorInstance
    }

    // Return existing init promise if in progress
    if (globalInitPromise) {
      console.log('⏳ Waiting for existing DAppConnector initialization')
      return globalInitPromise
    }

    console.log('🚀 Creating new DAppConnector instance')
    
    // Clear storage before creating new instance
    clearWalletConnectStorage()

    // Create initialization promise
    globalInitPromise = (async () => {
      try {
        const connector = createDAppConnector()
        await connector.init({ logger: 'error' })
        globalDAppConnectorInstance = connector
        console.log('✅ DAppConnector instance created and initialized')
        return connector
      } catch (error) {
        console.error('❌ Failed to initialize DAppConnector:', error)
        globalInitPromise = null // Reset so it can be retried
        throw error
      }
    })()

    return globalInitPromise
  }, [clearWalletConnectStorage])

  // Initialize DAppConnector only once per component instance
  useEffect(() => {
    let isMounted = true

    const initializeDAppConnector = async () => {
      try {
        const connector = await getDAppConnectorInstance()
        
        if (!isMounted) return // Component unmounted during init
        
        setDAppConnector(connector)
        setError(null)

        // Initialize periodic session check to detect successful pairing
        const checkConnectionStatus = () => {
          if (!isMounted || !connector) return
          
          // Check if we have active sessions
          const sessions = connector.walletConnectClient?.session?.getAll() || []
          
          if (sessions.length > 0) {
            const activeSession = sessions[0]
            console.log('✅ Found active session:', {
              topic: activeSession.topic,
              namespaces: activeSession.namespaces,
              accounts: activeSession.namespaces?.hedera?.accounts
            })
            
            setSessionData(activeSession)
            setConnectionState(ConnectionState.Connected) 
            setIsConnecting(false)
            setError(null)
            modalOpenedRef.current = false
            
            // Clear timeout since connection succeeded
            if (modalTimeoutRef.current) {
              clearTimeout(modalTimeoutRef.current)
              modalTimeoutRef.current = null
            }
            
            // Extract account ID from session
            try {
              let accountId = null
              if (activeSession?.namespaces?.hedera?.accounts?.length > 0) {
                accountId = activeSession.namespaces.hedera.accounts[0].split(':')[2]
              }
              
              if (accountId) {
                setAddress(accountId)
                console.log('📍 Account ID set:', accountId)
              }
            } catch (error) {
              console.warn('⚠️ Error extracting account ID:', error)
            }
          } else if (connectionState === ConnectionState.Connected) {
            // No sessions but we think we're connected - disconnect
            console.log('❌ No active sessions, disconnecting')
            setSessionData(null)
            setAddress(null)
            setBalance(null)
            setConnectionState(ConnectionState.Disconnected)
            setIsConnecting(false)
          }
        }

        // Check connection status immediately and then periodically
        checkConnectionStatus()
        const statusCheckInterval = setInterval(checkConnectionStatus, 2000)

        console.log('✅ DAppConnector initialized with periodic session checking')

        // Store cleanup functions
        cleanupFunctionsRef.current = [
          () => {
            clearInterval(statusCheckInterval)
          }
        ]

      } catch (error) {
        if (!isMounted) return
        console.error('❌ Failed to initialize DAppConnector:', error)
        setError(error instanceof Error ? error.message : 'Failed to initialize wallet connection')
      }
    }

    initializeDAppConnector()

    return () => {
      isMounted = false
      
      // Clear timeout
      if (modalTimeoutRef.current) {
        clearTimeout(modalTimeoutRef.current)
        modalTimeoutRef.current = null
      }
      
      // Run cleanup functions
      cleanupFunctionsRef.current.forEach(cleanup => {
        try {
          cleanup()
        } catch (e) {
          console.warn('Error during event cleanup:', e)
        }
      })
      cleanupFunctionsRef.current = []
      
      // Reset local state
      setDAppConnector(null)
      setConnectionState(ConnectionState.Disconnected)
      setSessionData(null)
      setAddress(null)
      setBalance(null)
      setIsConnecting(false)
      modalOpenedRef.current = false
      
      console.log('✅ useWallet cleanup completed')
    }
  }, [getDAppConnectorInstance])

  // Get balance when address changes
  useEffect(() => {
    if (address && connectionState === ConnectionState.Connected) {
      // For now, we'll show a mock balance
      // In a real implementation, you would query the Hedera mirror node
      setBalance({
        value: BigInt('1000000000000000000'), // 1 HBAR in tinybar
        symbol: 'HBAR'
      })
    } else {
      setBalance(null)
    }
  }, [address, connectionState])

  // Connect function with improved error handling
  const connect = useCallback(async () => {
    if (!dAppConnector) {
      setError('Wallet not initialized')
      return
    }

    // Prevent multiple modal opens
    if (modalOpenedRef.current) {
      console.log('⏳ Modal already open, ignoring request')
      return
    }

    // Prevent opening modal if already connecting or connected
    if (connectionState === ConnectionState.Connecting || 
        connectionState === ConnectionState.Connected) {
      console.log('⏳ Already connecting or connected')
      return
    }

    try {
      setError(null)
      setIsConnecting(true)
      setConnectionState(ConnectionState.Connecting)
      modalOpenedRef.current = true
      console.log('🔗 Opening connection modal...')
      await dAppConnector.openModal()
      
      // The periodic session checker will detect when pairing is successful
      // Set a timeout to reset connecting state if no connection is established
      modalTimeoutRef.current = setTimeout(() => {
        // Check current sessions to see if connection was established
        const sessions = dAppConnector.walletConnectClient?.session?.getAll() || []
        if (modalOpenedRef.current && sessions.length === 0) {
          console.log('⏰ Modal timeout - no sessions found, resetting connection state')
          modalOpenedRef.current = false
          setIsConnecting(false)
          setConnectionState(ConnectionState.Disconnected)
          setError('Connection timeout - please try again')
        }
      }, 60000) // 60 second timeout to give more time for pairing
      
    } catch (error) {
      console.error('❌ Failed to open connection modal:', error)
      setError(error instanceof Error ? error.message : 'Failed to connect to wallet')
      modalOpenedRef.current = false // Reset flag only on error
      setIsConnecting(false)
      setConnectionState(ConnectionState.Disconnected)
    }
  }, [dAppConnector, connectionState, sessionData])

  // Disconnect function with proper cleanup
  const disconnect = useCallback(async () => {
    if (!dAppConnector) return
    
    try {
      console.log('🔌 Disconnecting wallet...')
      
      // Clear timeout and reset modal flag first
      if (modalTimeoutRef.current) {
        clearTimeout(modalTimeoutRef.current)
        modalTimeoutRef.current = null
      }
      modalOpenedRef.current = false
      
      // Disconnect from DAppConnector
      if (sessionData) {
        await dAppConnector.disconnect(sessionData.topic)
      }
      
      console.log('✅ Wallet disconnected successfully')
      
    } catch (error) {
      console.error('❌ Failed to disconnect:', error)
      setError(error instanceof Error ? error.message : 'Failed to disconnect wallet')
    }
  }, [dAppConnector])

  // Force reset function for emergency cases
  const forceReset = useCallback(() => {
    console.log('🚨 Force resetting DAppConnector...')
    
    // Clear all storage
    clearWalletConnectStorage()
    
    // Reset global singleton
    globalDAppConnectorInstance = null
    globalInitPromise = null
    
    // Reset modal state
    modalOpenedRef.current = false
    
    if (modalTimeoutRef.current) {
      clearTimeout(modalTimeoutRef.current)
      modalTimeoutRef.current = null
    }
    
    // Reset all state
    setDAppConnector(null)
    setConnectionState(ConnectionState.Disconnected)
    setSessionData(null)
    setAddress(null)
    setBalance(null)
    setIsConnecting(false)
    setError(null)
    
    console.log('✅ Force reset completed')
  }, [clearWalletConnectStorage])

  // Utility functions
  const formatAddress = useCallback((addr: string) => {
    if (!addr) return ''
    // For Hedera account IDs like 0.0.123456
    if (addr.includes('.')) {
      return addr
    }
    // For other formats, show first 6 and last 4 characters
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }, [])

  const formatBalance = useCallback((bal: any) => {
    if (!bal) return '0'
    // Convert from tinybar to HBAR (1 HBAR = 100,000,000 tinybar)
    const hbarAmount = Number(bal.value) / 100000000
    return hbarAmount.toFixed(4)
  }, [])

  // Computed values
  const isConnected = useMemo(() => 
    connectionState === ConnectionState.Connected && !!sessionData, 
    [connectionState, sessionData]
  )
  
  const isDisconnected = useMemo(() => 
    connectionState === ConnectionState.Disconnected, 
    [connectionState]
  )

  // Chain object for current Hedera network
  const chain = useMemo(() => {
    const networkConfig = import.meta.env.VITE_HEDERA_NETWORK || 'mainnet'
    const networkName = networkConfig.charAt(0).toUpperCase() + networkConfig.slice(1).toLowerCase()
    
    return {
      id: networkConfig.toLowerCase() === 'testnet' ? 296 : networkConfig.toLowerCase() === 'previewnet' ? 297 : 295,
      name: `Hedera ${networkName}`
    }
  }, [])

  // Manual check function for debugging
  const checkStatus = useCallback(() => {
    if (!dAppConnector) {
      console.log('🔍 DAppConnector not initialized')
      return
    }
    
    const sessions = dAppConnector.walletConnectClient?.session?.getAll() || []
    console.log('🔍 Manual status check:', {
      connectionState,
      isConnecting,
      isConnected,
      sessions: sessions.length,
      address,
      sessionData: !!sessionData
    })
    
    sessions.forEach((session, index) => {
      console.log(`📋 Session ${index}:`, {
        topic: session.topic,
        accounts: session.namespaces?.hedera?.accounts
      })
    })
  }, [dAppConnector, connectionState, isConnecting, isConnected, address, sessionData])

  return {
    address,
    isConnected,
    isConnecting,
    isDisconnected,
    chain,
    balance,
    connect,
    disconnect,
    formatAddress,
    formatBalance,
    connectionState,
    sessionData,
    dAppConnector,
    error,
    forceReset, // Emergency reset function
    checkStatus, // Manual status check for debugging
    // Additional methods for compatibility
    openModal: connect,
    closeModal: disconnect
  }
}