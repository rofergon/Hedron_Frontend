import { useAccount, useDisconnect, useBalance } from 'wagmi'
import { useAppKit } from '@reown/appkit/react'
import { formatEther } from 'viem'

export function useWallet() {
  const { address, isConnected, isConnecting, isDisconnected, chain } = useAccount()
  const { disconnect } = useDisconnect()
  const { open, close } = useAppKit()
  
  // Get balance for the connected account
  const { data: balance } = useBalance({
    address: address,
  })

  const connect = () => {
    open()
  }

  const handleDisconnect = () => {
    disconnect()
    close()
  }

  const formatAddress = (addr: string) => {
    if (!addr) return ''
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  const formatBalance = (bal: any) => {
    if (!bal) return '0'
    const formatted = formatEther(bal.value)
    return parseFloat(formatted).toFixed(4)
  }

  return {
    address,
    isConnected,
    isConnecting,
    isDisconnected,
    chain,
    balance,
    connect,
    disconnect: handleDisconnect,
    formatAddress,
    formatBalance,
    openModal: open,
    closeModal: close
  }
}