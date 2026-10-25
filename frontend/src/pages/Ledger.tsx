import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Info,
  Scale,
} from 'lucide-react';
import { getLedgerEntriesApi, getLedgerSummaryApi } from '../api/ledger';
import { LedgerEntry, LedgerSummary, PagedResponse } from '../types';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';

export const LedgerPage: React.FC = () => {
  const navigate = useNavigate();

  const [entriesData, setEntriesData] = useState<PagedResponse<LedgerEntry> | null>(null);
  const [summary, setSummary] = useState<LedgerSummary | null>(null);
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLedger = async () => {
      try {
        setIsLoading(true);
        const [entries, sum] = await Promise.all([
          getLedgerEntriesApi({ page, size: 12 }),
          getLedgerSummaryApi(),
        ]);
        setEntriesData(entries);
        setSummary(sum);
      } catch (err) {
        console.error('Failed to load ledger:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLedger();
  }, [page]);

  const formatCurrency = (val: number, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(val);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      <div className="p-4 rounded-card bg-[#172B4D] text-white flex items-start justify-between gap-4 shadow-card">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded bg-white/10 shrink-0 mt-0.5">
            <Scale className="w-5 h-5 text-[#218568]" />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-tight">
              Immutable Double-Entry General Ledger
            </h3>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              In financial systems, account balances must never be arbitrarily updated. Every money movement creates matching, irrevocable <span className="font-semibold text-white">DEBIT</span> and <span className="font-semibold text-white">CREDIT</span> entries within an atomic database transaction. Balances represent the mathematical sum of historical entries.
            </p>
          </div>
        </div>

        <div className="hidden md:flex flex-col items-end shrink-0 text-right">
          <span className="text-[10px] uppercase font-semibold text-slate-400">Ledger Invariant</span>
          <span className="text-xs font-mono font-bold text-[#218568] mt-0.5">
            &sum; Debits &equiv; &sum; Credits
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-card border border-[#DFE3E8] shadow-card">
          <p className="text-xs font-semibold text-[#667085] uppercase tracking-wider">
            Total Debits Recorded
          </p>
          {isLoading ? (
            <Skeleton className="h-8 w-28 mt-2" />
          ) : (
            <p className="text-2xl font-bold text-[#C2414B] mt-1 tracking-tight">
              -{formatCurrency(summary?.totalDebits || 0, summary?.currency)}
            </p>
          )}
          <p className="text-[11px] text-[#667085] mt-1">Cumulative outflows from this wallet</p>
        </div>

        <div className="bg-white p-5 rounded-card border border-[#DFE3E8] shadow-card">
          <p className="text-xs font-semibold text-[#667085] uppercase tracking-wider">
            Total Credits Recorded
          </p>
          {isLoading ? (
            <Skeleton className="h-8 w-28 mt-2" />
          ) : (
            <p className="text-2xl font-bold text-[#218568] mt-1 tracking-tight">
              +{formatCurrency(summary?.totalCredits || 0, summary?.currency)}
            </p>
          )}
          <p className="text-[11px] text-[#667085] mt-1">Cumulative inflows to this wallet</p>
        </div>

        <div className="bg-white p-5 rounded-card border border-[#DFE3E8] shadow-card">
          <p className="text-xs font-semibold text-[#667085] uppercase tracking-wider">
            Total Ledger Entries
          </p>
          {isLoading ? (
            <Skeleton className="h-8 w-20 mt-2" />
          ) : (
            <p className="text-2xl font-bold text-[#17212F] mt-1 tracking-tight">
              {summary?.entryCount || 0}
            </p>
          )}
          <p className="text-[11px] text-[#218568] font-medium mt-1 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> Immutable & Non-editable
          </p>
        </div>
      </div>

      <div className="bg-white rounded-card border border-[#DFE3E8] shadow-card overflow-hidden">
        <div className="p-4 border-b border-[#DFE3E8] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#172B4D]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#17212F]">
              Ledger Journal Entries (Journal of Record)
            </h3>
          </div>
          <span className="text-[11px] text-[#667085]">
            Strict chronological write-ahead entries
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F4F6F8] text-[#667085] font-semibold border-b border-[#DFE3E8]">
              <tr>
                <th className="py-3 px-4">Entry ID</th>
                <th className="py-3 px-4">Transaction Reference</th>
                <th className="py-3 px-4">Account Owner</th>
                <th className="py-3 px-3">Entry Type</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4 text-right">Commit Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DFE3E8]">
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="py-3 px-4">
                      <Skeleton className="h-5 w-full" />
                    </td>
                  </tr>
                ))
              ) : !entriesData || entriesData.content.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <EmptyState
                      icon={<BookOpen className="w-5 h-5" />}
                      title="No ledger entries recorded"
                      description="Ledger entries appear automatically once money transfers are completed."
                    />
                  </td>
                </tr>
              ) : (
                entriesData.content.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-[#17212F]">
                      #{entry.id}
                    </td>
                    <td className="py-3 px-4 font-mono text-[#344563] truncate max-w-[200px]">
                      {entry.transferReference}
                    </td>
                    <td className="py-3 px-4 font-medium text-[#17212F]">
                      {entry.walletOwnerName}
                    </td>
                    <td className="py-3 px-3">
                      <Badge variant={entry.entryType}>{entry.entryType}</Badge>
                    </td>
                    <td className="py-3 px-4 text-right font-medium whitespace-nowrap">
                      <span
                        className={
                          entry.entryType === 'CREDIT'
                            ? 'text-[#218568] font-bold'
                            : 'text-[#C2414B] font-bold'
                        }
                      >
                        {entry.entryType === 'CREDIT' ? '+' : '-'}
                        {formatCurrency(entry.amount, entry.currency)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-[#667085] whitespace-nowrap">
                      {formatDate(entry.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {entriesData && entriesData.totalPages > 1 && (
          <div className="px-4 py-3 border-t border-[#DFE3E8] bg-[#F4F6F8] flex items-center justify-between text-xs text-[#667085]">
            <span>
              Page <span className="font-semibold text-[#17212F]">{entriesData.page + 1}</span> of{' '}
              <span className="font-semibold text-[#17212F]">{entriesData.totalPages}</span> ({entriesData.totalElements} journal lines)
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={entriesData.first}
                className="px-2.5 py-1 bg-white border border-[#DFE3E8] rounded hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>

              <button
                onClick={() => setPage(page + 1)}
                disabled={entriesData.last}
                className="px-2.5 py-1 bg-white border border-[#DFE3E8] rounded hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
