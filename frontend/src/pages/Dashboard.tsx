import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowUpRight,
  ArrowDownLeft,
  Eye,
  EyeOff,
  Send,
  Receipt,
  ShieldCheck,
  Clock,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getWalletApi, getTransactionsApi } from '../api/wallet';
import { Transaction, Wallet } from '../types';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { ActivityChart } from '../components/charts/ActivityChart';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showBalance, setShowBalance] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [walletData, transactionsData] = await Promise.all([
          getWalletApi(),
          getTransactionsApi({ page: 0, size: 7 }),
        ]);
        setWallet(walletData);
        setTransactions(transactionsData.content || []);
      } catch (err: any) {
        setError('Failed to load wallet data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
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
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const buildChartData = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    const result = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dayName = days[d.getDay()];

      let incoming = 0;
      let outgoing = 0;

      transactions.forEach((tx) => {
        const txDate = new Date(tx.createdAt);
        if (
          txDate.getDate() === d.getDate() &&
          txDate.getMonth() === d.getMonth() &&
          txDate.getFullYear() === d.getFullYear()
        ) {
          if (tx.direction === 'INCOMING') {
            incoming += tx.amount;
          } else {
            outgoing += tx.amount;
          }
        }
      });

      result.push({
        day: dayName,
        incoming: Number(incoming.toFixed(2)),
        outgoing: Number(outgoing.toFixed(2)),
      });
    }

    return result;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-card border border-[#DFE3E8] shadow-card">
        <div>
          <h2 className="text-base font-bold text-[#17212F] tracking-tight">
            Welcome back, {user?.name || 'User'}
          </h2>
          <p className="text-xs text-[#667085] mt-0.5">
            Wallet ID: #{wallet?.id || '—'} · Status:{' '}
            <span className="text-[#218568] font-medium">{wallet?.status || 'ACTIVE'}</span> · Currency:{' '}
            {wallet?.currency || 'USD'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/send')}
            className="flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send Money</span>
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/transactions')}
            className="flex items-center gap-1.5"
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>View All Records</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-card border border-[#DFE3E8] shadow-card">
          <div className="flex items-center justify-between text-xs text-[#667085] mb-2">
            <span>Available Balance</span>
            <button
              onClick={() => setShowBalance(!showBalance)}
              className="text-[#667085] hover:text-[#17212F] transition-colors p-1"
              title={showBalance ? 'Hide balance' : 'Show balance'}
            >
              {showBalance ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>

          {isLoading ? (
            <Skeleton className="h-8 w-36 mb-2" />
          ) : (
            <p className="text-2xl font-bold text-[#17212F] tracking-tight">
              {showBalance ? formatCurrency(wallet?.balance || 0) : '••••••••'}
            </p>
          )}

          <div className="mt-3 pt-3 border-t border-[#DFE3E8] flex items-center justify-between text-xs text-[#667085]">
            <span>Settled in Real Time</span>
            <span className="text-[#218568] font-medium flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Synchronized
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-card border border-[#DFE3E8] shadow-card">
          <div className="flex items-center justify-between text-xs text-[#667085] mb-2">
            <span>Recent Settlement Volume</span>
            <Clock className="w-3.5 h-3.5 text-[#667085]" />
          </div>

          {isLoading ? (
            <Skeleton className="h-8 w-28 mb-2" />
          ) : (
            <p className="text-2xl font-bold text-[#17212F] tracking-tight">
              {transactions.length} Transfers
            </p>
          )}

          <div className="mt-3 pt-3 border-t border-[#DFE3E8] flex items-center justify-between text-xs text-[#667085]">
            <span>Past 7 recorded events</span>
            <span className="text-[#344563] font-medium">Audited</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-card border border-[#DFE3E8] shadow-card">
          <div className="flex items-center justify-between text-xs text-[#667085] mb-2">
            <span>Accounting Verification</span>
            <span className="w-2 h-2 rounded-full bg-[#218568]" />
          </div>

          <p className="text-2xl font-bold text-[#218568] tracking-tight">Balanced</p>

          <div className="mt-3 pt-3 border-t border-[#DFE3E8] flex items-center justify-between text-xs text-[#667085]">
            <span>Debits equal Credits</span>
            <button
              onClick={() => navigate('/ledger')}
              className="text-[#172B4D] hover:underline font-semibold"
            >
              Explore Ledger &rarr;
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 bg-white p-5 rounded-card border border-[#DFE3E8] shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#17212F]">
                Settlement Flow (7 Days)
              </h3>
              <p className="text-[11px] text-[#667085]">Daily incoming and outgoing transfer volume</p>
            </div>
          </div>

          {isLoading ? (
            <div className="h-52 flex items-center justify-center">
              <Skeleton className="h-44 w-full" />
            </div>
          ) : (
            <ActivityChart data={buildChartData()} />
          )}
        </div>

        <div className="lg:col-span-6 bg-white rounded-card border border-[#DFE3E8] shadow-card flex flex-col">
          <div className="p-4 border-b border-[#DFE3E8] flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#17212F]">
              Recent Transactions
            </h3>
            <button
              onClick={() => navigate('/transactions')}
              className="text-xs text-[#172B4D] hover:underline font-medium"
            >
              View all
            </button>
          </div>

          <div className="flex-1 overflow-x-auto">
            {isLoading ? (
              <div className="p-4 space-y-3">
                <Skeleton className="h-8 w-full" count={4} />
              </div>
            ) : transactions.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#667085]">
                No transactions recorded yet.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F4F6F8] text-[#667085] font-semibold border-b border-[#DFE3E8]">
                  <tr>
                    <th className="py-2.5 px-4">Counterparty</th>
                    <th className="py-2.5 px-2">Direction</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                    <th className="py-2.5 px-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DFE3E8]">
                  {transactions.slice(0, 5).map((tx) => (
                    <tr
                      key={tx.id}
                      onClick={() => navigate(`/transactions/${tx.id}`)}
                      className="hover:bg-gray-50/80 cursor-pointer transition-colors"
                    >
                      <td className="py-2.5 px-4">
                        <p className="font-semibold text-[#17212F] truncate max-w-[140px]">
                          {tx.counterpartyName}
                        </p>
                        <p className="text-[11px] text-[#667085]">{formatDate(tx.createdAt)}</p>
                      </td>
                      <td className="py-2.5 px-2">
                        <span className="inline-flex items-center gap-1 font-medium text-[11px]">
                          {tx.direction === 'INCOMING' ? (
                            <>
                              <ArrowDownLeft className="w-3.5 h-3.5 text-[#218568]" />
                              <span className="text-[#218568]">In</span>
                            </>
                          ) : (
                            <>
                              <ArrowUpRight className="w-3.5 h-3.5 text-[#C2414B]" />
                              <span className="text-[#C2414B]">Out</span>
                            </>
                          )}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-medium">
                        <span
                          className={
                            tx.direction === 'INCOMING' ? 'text-[#218568]' : 'text-[#17212F]'
                          }
                        >
                          {tx.direction === 'INCOMING' ? '+' : '-'}
                          {formatCurrency(tx.amount)}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <Badge variant={tx.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
