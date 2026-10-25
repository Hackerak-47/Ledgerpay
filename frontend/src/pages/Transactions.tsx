import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronLeft,
  ChevronRight,
  Receipt,
} from 'lucide-react';
import { getTransactionsApi } from '../api/wallet';
import { PagedResponse, Transaction } from '../types';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';

export const TransactionsPage: React.FC = () => {
  const navigate = useNavigate();

  const [data, setData] = useState<PagedResponse<Transaction> | null>(null);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [direction, setDirection] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchTransactions = async () => {
    try {
      setIsLoading(true);
      const res = await getTransactionsApi({
        page,
        size: 10,
        search: search.trim() || undefined,
        direction: direction || undefined,
        status: status || undefined,
      });
      setData(res);
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [page, direction, status]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    fetchTransactions();
  };

  const formatCurrency = (val: number, currency: string) => {
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
    });
  };

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-card border border-[#DFE3E8] shadow-card flex flex-col md:flex-row md:items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#667085]" />
          <input
            type="text"
            placeholder="Search by counterparty name or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-[#DFE3E8] rounded focus:outline-none focus:border-[#172B4D]"
          />
        </form>

        <div className="flex items-center gap-2">
          <select
            value={direction}
            onChange={(e) => {
              setDirection(e.target.value);
              setPage(0);
            }}
            className="px-2.5 py-1.5 text-xs bg-white border border-[#DFE3E8] rounded text-[#17212F] focus:outline-none focus:border-[#172B4D]"
          >
            <option value="">All Directions</option>
            <option value="INCOMING">Incoming (Credits)</option>
            <option value="OUTGOING">Outgoing (Debits)</option>
          </select>

          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(0);
            }}
            className="px-2.5 py-1.5 text-xs bg-white border border-[#DFE3E8] rounded text-[#17212F] focus:outline-none focus:border-[#172B4D]"
          >
            <option value="">All Statuses</option>
            <option value="COMPLETED">Completed</option>
            <option value="PENDING">Pending</option>
            <option value="FLAGGED">Flagged</option>
            <option value="FAILED">Failed</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-card border border-[#DFE3E8] shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F4F6F8] text-[#667085] font-semibold border-b border-[#DFE3E8]">
              <tr>
                <th className="py-3 px-4">Transaction Reference</th>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Counterparty</th>
                <th className="py-3 px-3">Flow</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4 text-right">Settlement Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DFE3E8]">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="py-3 px-4">
                      <Skeleton className="h-5 w-full" />
                    </td>
                  </tr>
                ))
              ) : !data || data.content.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <EmptyState
                      icon={<Receipt className="w-5 h-5" />}
                      title="No transactions found"
                      description="Try adjusting your search criteria or filter options."
                    />
                  </td>
                </tr>
              ) : (
                data.content.map((tx) => (
                  <tr
                    key={tx.id}
                    onClick={() => navigate(`/transactions/${tx.id}`)}
                    className="hover:bg-gray-50/80 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-medium text-[#17212F] truncate max-w-[160px]">
                      {tx.reference}
                    </td>
                    <td className="py-3 px-4 text-[#667085] whitespace-nowrap">
                      {formatDate(tx.createdAt)}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-[#17212F]">{tx.counterpartyName}</p>
                      <p className="text-[11px] text-[#667085] truncate max-w-[180px]">
                        {tx.counterpartyEmail}
                      </p>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 font-medium text-[11px]">
                        {tx.direction === 'INCOMING' ? (
                          <>
                            <ArrowDownLeft className="w-3.5 h-3.5 text-[#218568]" />
                            <span className="text-[#218568]">Incoming</span>
                          </>
                        ) : (
                          <>
                            <ArrowUpRight className="w-3.5 h-3.5 text-[#C2414B]" />
                            <span className="text-[#C2414B]">Outgoing</span>
                          </>
                        )}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-medium whitespace-nowrap">
                      <span
                        className={
                          tx.direction === 'INCOMING'
                            ? 'text-[#218568] font-bold'
                            : 'text-[#17212F] font-bold'
                        }
                      >
                        {tx.direction === 'INCOMING' ? '+' : '-'}
                        {formatCurrency(tx.amount, tx.currency)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <Badge variant={tx.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {data && data.totalPages > 1 && (
          <div className="px-4 py-3 border-t border-[#DFE3E8] bg-[#F4F6F8] flex items-center justify-between text-xs text-[#667085]">
            <span>
              Showing Page <span className="font-semibold text-[#17212F]">{data.page + 1}</span> of{' '}
              <span className="font-semibold text-[#17212F]">{data.totalPages}</span> ({data.totalElements} records)
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={data.first}
                className="px-2.5 py-1 bg-white border border-[#DFE3E8] rounded hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>

              <button
                onClick={() => setPage(page + 1)}
                disabled={data.last}
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
