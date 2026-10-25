import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wallet as WalletIcon,
  Send,
  Shield,
  ArrowUpRight,
  ArrowDownLeft,
  Info,
} from 'lucide-react';
import { getWalletApi, getTransactionsApi } from '../api/wallet';
import { Transaction, Wallet } from '../types';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';

export const WalletPage: React.FC = () => {
  const navigate = useNavigate();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [credits, setCredits] = useState<Transaction[]>([]);
  const [debits, setDebits] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchWalletData = async () => {
      try {
        setIsLoading(true);
        const [walletData, txIncoming, txOutgoing] = await Promise.all([
          getWalletApi(),
          getTransactionsApi({ page: 0, size: 5, direction: 'INCOMING' }),
          getTransactionsApi({ page: 0, size: 5, direction: 'OUTGOING' }),
        ]);

        setWallet(walletData);
        setCredits(txIncoming.content || []);
        setDebits(txOutgoing.content || []);
      } catch (err) {
        console.error('Failed to load wallet:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWalletData();
  }, []);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: wallet?.currency || 'USD',
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
    <div className="space-y-6">
      <div className="p-4 rounded-card bg-[#F4F6F8] border border-[#DFE3E8] flex items-start gap-3">
        <Info className="w-4 h-4 text-[#344563] shrink-0 mt-0.5" />
        <div className="text-xs text-[#344563] leading-relaxed">
          <span className="font-semibold text-[#17212F]">Simulated Fintech Environment:</span>{' '}
          This wallet operates entirely within LedgerPay’s relational ledger system. All balances, transactions, and counterparties are simulated for portfolio and demonstration purposes and are not linked to real external payment rails or bank accounts.
        </div>
      </div>

      <div className="bg-white rounded-card border border-[#DFE3E8] p-6 shadow-card">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#DFE3E8]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded bg-[#172B4D] text-white flex items-center justify-center">
              <WalletIcon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-[#17212F] tracking-tight">
                  Primary USD Wallet
                </h2>
                <Badge variant={wallet?.status || 'ACTIVE'} />
              </div>
              <p className="text-xs text-[#667085] mt-0.5">
                Account Holder: <span className="text-[#17212F] font-medium">{wallet?.ownerName}</span> ({wallet?.ownerEmail})
              </p>
            </div>
          </div>

          <Button
            variant="primary"
            size="md"
            onClick={() => navigate('/send')}
            className="flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            <span>Transfer to Counterparty</span>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-6">
          <div>
            <p className="text-xs font-semibold text-[#667085] uppercase tracking-wider">
              Available Balance
            </p>
            {isLoading ? (
              <Skeleton className="h-9 w-40 mt-1" />
            ) : (
              <p className="text-3xl font-bold text-[#17212F] mt-1 tracking-tight">
                {formatCurrency(wallet?.balance || 0)}
              </p>
            )}
            <p className="text-[11px] text-[#218568] mt-1 font-medium">100% Settled & Available</p>
          </div>

          <div className="border-l border-[#DFE3E8] pl-6">
            <p className="text-xs font-semibold text-[#667085] uppercase tracking-wider">
              Denomination
            </p>
            <p className="text-lg font-bold text-[#17212F] mt-1">
              {wallet?.currency || 'USD'} (US Dollar)
            </p>
            <p className="text-[11px] text-[#667085] mt-1">ISO 4217 Standard</p>
          </div>

          <div className="border-l border-[#DFE3E8] pl-6">
            <p className="text-xs font-semibold text-[#667085] uppercase tracking-wider">
              Wallet Reference ID
            </p>
            <p className="text-lg font-bold text-[#17212F] mt-1 font-mono">
              #{wallet?.id ? String(wallet.id).padStart(6, '0') : '——'}
            </p>
            <p className="text-[11px] text-[#667085] mt-1">Pessimistic Row-Locked</p>
          </div>

          <div className="border-l border-[#DFE3E8] pl-6">
            <p className="text-xs font-semibold text-[#667085] uppercase tracking-wider">
              Accounting Protocol
            </p>
            <div className="flex items-center gap-1.5 mt-1 text-[#218568] font-bold text-sm">
              <Shield className="w-4 h-4" />
              <span>Double-Entry Debit/Credit</span>
            </div>
            <p className="text-[11px] text-[#667085] mt-1">ACID Serializable Integrity</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-card border border-[#DFE3E8] shadow-card">
          <div className="p-4 border-b border-[#DFE3E8] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ArrowDownLeft className="w-4 h-4 text-[#218568]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#17212F]">
                Recent Inflows (Credits)
              </h3>
            </div>
            <Badge variant="INCOMING">CREDIT</Badge>
          </div>

          <div className="divide-y divide-[#DFE3E8]">
            {isLoading ? (
              <div className="p-4 space-y-3">
                <Skeleton className="h-10 w-full" count={3} />
              </div>
            ) : credits.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#667085]">
                No incoming credit transfers yet.
              </div>
            ) : (
              credits.map((c) => (
                <div
                  key={c.id}
                  onClick={() => navigate(`/transactions/${c.id}`)}
                  className="p-3.5 hover:bg-gray-50 flex items-center justify-between cursor-pointer transition-colors"
                >
                  <div>
                    <p className="text-xs font-semibold text-[#17212F]">
                      From {c.counterpartyName}
                    </p>
                    <p className="text-[11px] text-[#667085]">{formatDate(c.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-[#218568]">
                      +{formatCurrency(c.amount)}
                    </p>
                    <Badge variant={c.status} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-card border border-[#DFE3E8] shadow-card">
          <div className="p-4 border-b border-[#DFE3E8] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ArrowUpRight className="w-4 h-4 text-[#C2414B]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#17212F]">
                Recent Outflows (Debits)
              </h3>
            </div>
            <Badge variant="OUTGOING">DEBIT</Badge>
          </div>

          <div className="divide-y divide-[#DFE3E8]">
            {isLoading ? (
              <div className="p-4 space-y-3">
                <Skeleton className="h-10 w-full" count={3} />
              </div>
            ) : debits.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#667085]">
                No outgoing debit transfers yet.
              </div>
            ) : (
              debits.map((d) => (
                <div
                  key={d.id}
                  onClick={() => navigate(`/transactions/${d.id}`)}
                  className="p-3.5 hover:bg-gray-50 flex items-center justify-between cursor-pointer transition-colors"
                >
                  <div>
                    <p className="text-xs font-semibold text-[#17212F]">
                      To {d.counterpartyName}
                    </p>
                    <p className="text-[11px] text-[#667085]">{formatDate(d.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-[#17212F]">
                      -{formatCurrency(d.amount)}
                    </p>
                    <Badge variant={d.status} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
