export interface User {
  id: number;
  name: string;
  email: string;
}

export interface Wallet {
  id: number;
  currency: string;
  balance: number;
  status: 'ACTIVE' | 'SUSPENDED' | 'CLOSED';
  ownerName: string;
  ownerEmail: string;
}

export interface Transaction {
  id: number;
  reference: string;
  counterpartyName: string;
  counterpartyEmail: string;
  direction: 'INCOMING' | 'OUTGOING';
  amount: number;
  currency: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'FLAGGED';
  createdAt: string;
  description?: string;
}

export interface FraudFlag {
  id?: number;
  ruleCode: string;
  reason: string;
  createdAt?: string;
}

export interface LedgerEntry {
  id: number;
  transferReference: string;
  walletOwnerName: string;
  entryType: 'DEBIT' | 'CREDIT';
  amount: number;
  currency: string;
  createdAt: string;
}

export interface Transfer {
  id: number;
  reference: string;
  senderEmail: string;
  recipientEmail: string;
  amount: number;
  currency: string;
  description?: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'FLAGGED';
  fraudFlags: FraudFlag[];
  ledgerEntries: LedgerEntry[];
  createdAt: string;
}

export interface LedgerSummary {
  totalDebits: number;
  totalCredits: number;
  entryCount: number;
  currency: string;
}

export interface PagedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export interface AuthResponse {
  token: string;
  tokenType: string;
  expiresIn: number;
  email: string;
  name: string;
  walletId: number;
}
