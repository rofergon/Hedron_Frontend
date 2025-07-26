import { useState, useEffect, useCallback, useRef } from 'react'
import { HashConnect, HashConnectConnectionState, SessionData } from 'hashconnect'
import { AccountId } from '@hashgraph/sdk'
import { createHashConnect } from '../config/hashconnect'

export function useWallet() {
  const [hashconnect, setHashconnect] = useState<HashConnect | null>(null)
  const [connectionState, setConnectionState] = useState<HashConnectConnectionState>(HashConnectConnectionState.Disconnected)
  const [sessionData, setSessionData] = useState<SessionData | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [address, setAddress] = useState<string | null>(null)
  const [balance, setBalance] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  
  // Use ref to prevent multiple initializations
  const isInitialized = useRef(false)
  const hashconnectRef = useRef<HashConnect | null>(null)

  // Initialize HashConnect only once
  useEffect(() => {
    if (isInitialized.current) return

    const initHashConnect = async () => {
      try {
        console.log('Initializing HashConnect...')
        const hc = createHashConnect()
        hashconnectRef.current = hc
        
        // Set up event listeners
        hc.pairingEvent.on((newPairing: SessionData) => {
          console.log('✅ Paired with wallet:', newPairing)
          setSessionData(newPairing)
          setError(null)
          if (newPairing.accountIds && newPairing.accountIds.length > 0) {
            setAddress(newPairing.accountIds[0])
          }
        })

        hc.disconnectionEvent.on(() => {
          console.log('❌ Disconnected from wallet')
          setSessionData(null)
          setAddress(null)
          setBalance(null)
          setError(null)
        })

        hc.connectionStatusChangeEvent.on((connectionStatus: HashConnectConnectionState) => {
          console.log('🔄 Connection status changed:', connectionStatus)
          setConnectionState(connectionStatus)
          setIsConnecting(connectionStatus === HashConnectConnectionState.Connecting)
        })

        // Initialize
        await hc.init()
        setHashconnect(hc)
        setError(null)
        console.log('✅ HashConnect initialized successfully')
        
      } catch (error) {
        console.error('❌ Failed to initialize HashConnect:', error)
        setError(error instanceof Error ? error.message : 'Failed to initialize wallet connection')
      }
    }

    isInitialized.current = true
    initHashConnect()

    // Cleanup function
    return () => {
      if (hashconnectRef.current) {
        console.log('🧹 Cleaning up HashConnect...')
        try {
          hashconnectRef.current.disconnect()
        } catch (e) {
          console.warn('Error during cleanup:', e)
        }
      }
    }
  }, []) // Empty dependency array - only run once

  // Get balance when address changes
  useEffect(() => {
    if (address && connectionState === HashConnectConnectionState.Paired) {
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

  // Ref to track if modal is already opened
  // This prevents multiple modals from being opened simultaneously

  const modalOpenedRef = useRef(false)

const connect = useCallback(async () => {
  if (!hashconnect) {
    setError('Wallet not initialized')
    return
  }

  if (modalOpenedRef.current) {
    console.log('⏳ Modal already open')
    return
  }

  try {
    setIsConnecting(true)
    setError(null)
    modalOpenedRef.current = true
    console.log('🔗 Opening pairing modal...')
    hashconnect.openPairingModal()
  } catch (error) {
    console.error('Failed to connect:', error)
    setError(error instanceof Error ? error.message : 'Failed to connect to wallet')
  } finally {
    setIsConnecting(false)
    modalOpenedRef.current = false 
  }
}, [hashconnect])


  const disconnect = useCallback(async () => {
    if (!hashconnect) return
    
    try {
      console.log('🔌 Disconnecting wallet...')
      await hashconnect.disconnect()
      setSessionData(null)
      setAddress(null)
      setBalance(null)
      setError(null)
    } catch (error) {
      console.error('❌ Failed to disconnect:', error)
      setError(error instanceof Error ? error.message : 'Failed to disconnect wallet')
    }
  }, [hashconnect])

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

  const isConnected = connectionState === HashConnectConnectionState.Paired && !!sessionData
  const isDisconnected = connectionState === HashConnectConnectionState.Disconnected

  // Mock chain object for compatibility
  const chain = {
    id: 295,
    name: 'Hedera Mainnet'
  }

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
    hashconnect,
    error,
    // Additional methods for compatibility
    openModal: connect,
    closeModal: disconnect
  }
}