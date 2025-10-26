import { 
  DAppConnector,
  HederaSessionEvent, 
  HederaJsonRpcMethod,
  HederaChainId 
} from '@hashgraph/hedera-wallet-connect'
import { LedgerId } from '@hashgraph/sdk'

// Get project ID from WalletConnect Cloud
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'your-project-id-here'

// Get network configuration from environment
const networkConfig = import.meta.env.VITE_HEDERA_NETWORK || 'mainnet'

// Validate project ID
if (projectId === 'your-project-id-here' || !projectId) {
  console.warn('⚠️  WalletConnect Project ID not configured!')
  console.warn('Please get a Project ID from https://cloud.walletconnect.com')
  console.warn('and set VITE_WALLETCONNECT_PROJECT_ID in your .env file')
}

// Determine LedgerId based on environment variable
const getLedgerId = (): LedgerId => {
  switch (networkConfig.toLowerCase()) {
    case 'testnet':
      return LedgerId.TESTNET
    case 'previewnet':
      return LedgerId.PREVIEWNET
    case 'mainnet':
    default:
      return LedgerId.MAINNET
  }
}

const ledgerId = getLedgerId()
const networkName = networkConfig.charAt(0).toUpperCase() + networkConfig.slice(1).toLowerCase()

// App metadata for Hedera DApp Connector
export const appMetadata = {
  name: 'Hedron Agent Chat Interface',
  description: 'Hedron Agent Chat Interface with Direct Hedera Wallet Integration',
  url: typeof window !== 'undefined' ? window.location.origin : '',
  icons: ['https://avatars.githubusercontent.com/u/37784886']
}

export enum ConnectionState {
  Disconnected = 'disconnected',
  Connecting = 'connecting',
  Connected = 'connected'
}

// Get Hedera Chain ID based on network configuration
const getHederaChainId = () => {
  switch (networkConfig.toLowerCase()) {
    case 'testnet':
      return HederaChainId.Testnet
    case 'previewnet':
      return HederaChainId.Previewnet
    case 'mainnet':
    default:
      return HederaChainId.Mainnet
  }
}

// Create DApp Connector instance with dynamic network configuration
export const createDAppConnector = () => {
  console.log(`🚀 Creating DApp Connector for Hedera ${networkName}`)
  console.log('📋 Project ID:', projectId.slice(0, 8) + '...')
  console.log('🌐 Network:', networkConfig.toUpperCase())
  
  const supportedChains = [getHederaChainId()]
  
  return new DAppConnector(
    appMetadata,
    ledgerId,  // Dynamic network based on environment variable
    projectId,
    Object.values(HederaJsonRpcMethod),
    [HederaSessionEvent.ChainChanged, HederaSessionEvent.AccountsChanged],
    supportedChains
  )
}

// Export configuration values
export { projectId, networkConfig, networkName, ledgerId }

// Export types for use in components
export type { HederaSessionEvent, HederaJsonRpcMethod } 