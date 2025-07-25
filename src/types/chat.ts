export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai' | 'system';
  timestamp: Date;
  hasTransaction?: boolean;
  transactionData?: TransactionData;
}

export interface TransactionData {
  originalQuery: string;
  transactionBytes: Uint8Array;
  transactionId?: string;
  status?: 'pending' | 'success' | 'failed';
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

// WebSocket message types
export interface WSUserMessage {
  type: 'USER_MESSAGE';
  message: string;
  timestamp: number;
}

export interface WSAgentResponse {
  type: 'AGENT_RESPONSE';
  message: string;
  hasTransaction?: boolean;
}

export interface WSSystemMessage {
  type: 'SYSTEM_MESSAGE';
  level: string;
  message: string;
}

export interface WSTransactionToSign {
  type: 'TRANSACTION_TO_SIGN';
  originalQuery: string;
  transactionBytes: number[];
}

export interface WSTransactionResult {
  type: 'TRANSACTION_RESULT';
  success: boolean;
  transactionId: string;
  status: string;
  timestamp: number;
}

export type WSIncomingMessage = WSAgentResponse | WSSystemMessage | WSTransactionToSign;
export type WSOutgoingMessage = WSUserMessage | WSTransactionResult;