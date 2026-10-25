import api from './axios';
import { PagedResponse, Transfer } from '../types';

export const createTransferApi = async (
  data: {
    recipientEmail: string;
    amount: number;
    description?: string;
  },
  idempotencyKey?: string
): Promise<Transfer> => {
  const headers: Record<string, string> = {};
  if (idempotencyKey) {
    headers['Idempotency-Key'] = idempotencyKey;
  }

  const response = await api.post<Transfer>('/transfers', data, { headers });
  return response.data;
};

export const getTransfersApi = async (page = 0, size = 20): Promise<PagedResponse<Transfer>> => {
  const response = await api.get<PagedResponse<Transfer>>('/transfers', {
    params: { page, size },
  });
  return response.data;
};

export const getTransferByIdApi = async (id: number): Promise<Transfer> => {
  const response = await api.get<Transfer>(`/transfers/${id}`);
  return response.data;
};
