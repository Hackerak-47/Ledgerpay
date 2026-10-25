import api from './axios';
import { LedgerEntry, LedgerSummary, PagedResponse } from '../types';

export const getLedgerEntriesApi = async (params?: {
  page?: number;
  size?: number;
  transferId?: number;
}): Promise<PagedResponse<LedgerEntry>> => {
  const response = await api.get<PagedResponse<LedgerEntry>>('/ledger/entries', { params });
  return response.data;
};

export const getLedgerEntryByIdApi = async (id: number): Promise<LedgerEntry> => {
  const response = await api.get<LedgerEntry>(`/ledger/entries/${id}`);
  return response.data;
};

export const getLedgerSummaryApi = async (): Promise<LedgerSummary> => {
  const response = await api.get<LedgerSummary>('/ledger/summary');
  return response.data;
};
