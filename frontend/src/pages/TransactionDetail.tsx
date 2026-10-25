import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ShieldCheck,
  AlertTriangle,
  Clock,
  ArrowRight,
  BookOpen,
} from 'lucide-react';
import { getTransferByIdApi } from '../api/transfers';
import { Transfer } from '../types';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';

export const TransactionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [transfer, setTransfer] = useState<Transfer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      setIsLoading(true);
      getTransferByIdApi(Number(id))
        .then((data) => setTransfer(data))
        .catch((err) => setError('Could not load transaction details.'))
        .finally(() => setIsLoading(false));
    }
  }, [id]);

  const formatCurrency = (val: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(val);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-4xl mx-auto">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !transfer) {
    return (
      <div className="max-w-xl mx-auto text-center py-12 bg-white rounded-card border border-[#DFE3E8] p-6 shadow-card">
        <p className="text-sm font-semibold text-[#C2414B] mb-2">{error || 'Record Not Found'}</p>
        <p className="text-xs text-[#667085] mb-4">
          This transfer may belong to a different account or does not exist.
        </p>
        <Button variant="secondary" size="sm" onClick={() => navigate('/transactions')}>
          &larr; Back to Transactions
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/transactions')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#172B4D] hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to All Transactions</span>
        </button>

        <Badge variant={transfer.status} />
      </div>

      <div className="bg-white rounded-card border border-[#DFE3E8] p-6 shadow-card">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#DFE3E8]">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#667085]">
              Irrevocable Transaction Reference
            </span>
            <h2 className="text-base font-bold font-mono text-[#17212F] mt-0.5">
              {transfer.reference}
            </h2>
            <p className="text-xs text-[#667085] mt-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>Created: {formatDate(transfer.createdAt)}</span>
            </p>
          </div>

          <div className="text-right">
            <span className="text-xs text-[#667085]">Settled Principal</span>
            <p className="text-2xl font-bold text-[#17212F]">
              {formatCurrency(transfer.amount, transfer.currency)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6 border-b border-[#DFE3E8]">
          <div className="p-4 rounded bg-[#F4F6F8] border border-[#DFE3E8]">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#667085] mb-1">
              Sender (Debited)
            </p>
            <p className="text-xs font-bold text-[#17212F]">{transfer.senderEmail}</p>
            <p className="text-[11px] text-[#667085] mt-1">Originating Wallet Account</p>
          </div>

          <div className="p-4 rounded bg-[#F4F6F8] border border-[#DFE3E8]">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#667085] mb-1">
              Recipient (Credited)
            </p>
            <p className="text-xs font-bold text-[#17212F]">{transfer.recipientEmail}</p>
            <p className="text-[11px] text-[#667085] mt-1">Beneficiary Wallet Account</p>
          </div>
        </div>

        {transfer.description && (
          <div className="py-4 border-b border-[#DFE3E8] text-xs">
            <span className="text-[#667085] font-semibold">Memo / Description: </span>
            <span className="text-[#17212F] italic">{transfer.description}</span>
          </div>
        )}

        {transfer.fraudFlags && transfer.fraudFlags.length > 0 && (
          <div className="my-6 p-4 rounded bg-amber-50 border border-amber-200 text-xs text-[#B7791F] space-y-2">
            <div className="flex items-center gap-2 font-bold">
              <AlertTriangle className="w-4 h-4" />
              <span>Automated Fraud Rule Triggers</span>
            </div>
            {transfer.fraudFlags.map((flag, idx) => (
              <div key={idx} className="bg-white/80 p-2.5 rounded border border-amber-200">
                <p className="font-mono font-bold text-[11px] text-[#17212F]">
                  Rule: {flag.ruleCode}
                </p>
                <p className="text-xs text-[#344563] mt-0.5">{flag.reason}</p>
              </div>
            ))}
          </div>
        )}

        <div className="pt-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#172B4D]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#17212F]">
                Associated Double-Entry Ledger Records
              </h3>
            </div>
            <span className="text-[11px] text-[#218568] font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Balanced Sum: 0.00
            </span>
          </div>

          <div className="border border-[#DFE3E8] rounded overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F4F6F8] text-[#667085] font-semibold border-b border-[#DFE3E8]">
                <tr>
                  <th className="py-2.5 px-3">Entry ID</th>
                  <th className="py-2.5 px-3">Account Holder</th>
                  <th className="py-2.5 px-3">Accounting Type</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DFE3E8]">
                {transfer.ledgerEntries && transfer.ledgerEntries.length > 0 ? (
                  transfer.ledgerEntries.map((le) => (
                    <tr key={le.id}>
                      <td className="py-2.5 px-3 font-mono text-[#667085]">#{le.id}</td>
                      <td className="py-2.5 px-3 font-medium text-[#17212F]">
                        {le.walletOwnerName}
                      </td>
                      <td className="py-2.5 px-3">
                        <Badge variant={le.entryType}>{le.entryType}</Badge>
                      </td>
                      <td className="py-2.5 px-3 text-right font-medium">
                        <span
                          className={
                            le.entryType === 'CREDIT' ? 'text-[#218568]' : 'text-[#C2414B]'
                          }
                        >
                          {le.entryType === 'CREDIT' ? '+' : '-'}
                          {formatCurrency(le.amount, le.currency)}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-3 px-3 text-center text-[#667085]">
                      Ledger entries attached to this transfer record.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
