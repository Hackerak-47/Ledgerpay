import api from './axios';
import { PagedResponse, Transaction, Wallet } from '../types';

export const getWalletApi = async (): Promise<Wallet> => {
  const response = await api.get<Wallet>('/wallet');
  return response.data;
};

export const getTransactionsApi = async (params?: {
  page?: number;
  size?: number;
  search?: string;
  direction?: string;
  status?: string;
}): Promise<PagedResponse<Transaction>> => {
  const response = await api.get<PagedResponse<Transaction>>('/wallet/transactions', { params });
  return response.data;
};
