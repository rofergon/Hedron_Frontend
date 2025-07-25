import { HashConnect, HashConnectConnectionState, SessionData } from 'hashconnect'
import { LedgerId } from '@hashgraph/sdk'

// Get project ID from WalletConnect Cloud
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'your-project-id-here'

// Validate project ID
if (projectId === 'your-project-id-here' || !projectId) {
  console.warn('⚠️  WalletConnect Project ID not configured!')
  console.warn('Please get a Project ID from https://cloud.walletconnect.com')
  console.warn('and set VITE_WALLETCONNECT_PROJECT_ID in your .env file')
}

// App metadata for HashConnect
export const appMetadata = {
  name: 'Hedron Agent Chat Interface',
  description: 'Hedron Agent Chat Interface with Direct Hedera Wallet Integration',
  url: typeof window !== 'undefined' ? window.location.origin : '',
  icons: ['https://avatars.githubusercontent.com/u/37784886']
}

// Create HashConnect instance for testnet
export const createHashConnect = () => {
  console.log('🚀 Creating HashConnect instance for Hedera Testnet')
  console.log('📋 Project ID:', projectId.slice(0, 8) + '...')
  
  return new HashConnect(
    LedgerId.TESTNET,  // Changed to TESTNET for development
    projectId,
    appMetadata,
    true // Enable debug mode
  )
}

// Export configuration values
export { projectId }

// Export types for use in components
export type { HashConnectConnectionState, SessionData } 