import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Send,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Shield,
  RotateCcw,
  Receipt,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getWalletApi } from '../api/wallet';
import { createTransferApi } from '../api/transfers';
import { Transfer, Wallet } from '../types';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Alert } from '../components/ui/Alert';
import { Badge } from '../components/ui/Badge';

export const SendMoney: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<'form' | 'review' | 'confirmed'>('form');
  const [wallet, setWallet] = useState<Wallet | null>(null);

  const [recipientEmail, setRecipientEmail] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [description, setDescription] = useState('');
  const [idempotencyKey, setIdempotencyKey] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transferResult, setTransferResult] = useState<Transfer | null>(null);

  useEffect(() => {
    getWalletApi()
      .then((data) => setWallet(data))
      .catch((err) => console.error(err));
  }, []);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: wallet?.currency || 'USD',
    }).format(val);
  };

  const handleProceedToReview = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount greater than zero.');
      return;
    }

    if (wallet && amount > wallet.balance) {
      setError(`Amount exceeds your available balance of ${formatCurrency(wallet.balance)}.`);
      return;
    }

    if (recipientEmail.trim().toLowerCase() === user?.email.toLowerCase()) {
      setError('Cannot transfer funds to your own wallet.');
      return;
    }

    const newKey = typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : 'idem-' + Date.now();
    setIdempotencyKey(newKey);
    setStep('review');
  };

  const handleExecuteTransfer = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const amount = parseFloat(amountStr);
      const result = await createTransferApi(
        {
          recipientEmail: recipientEmail.trim(),
          amount,
          description: description.trim() || undefined,
        },
        idempotencyKey
      );

      setTransferResult(result);
      setStep('confirmed');
    } catch (err: any) {
      const message =
        err.response?.data?.message || 'Transfer failed to execute. Please verify counterparty details.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setRecipientEmail('');
    setAmountStr('');
    setDescription('');
    setIdempotencyKey('');
    setError(null);
    setTransferResult(null);
    setStep('form');
    getWalletApi().then((data) => setWallet(data));
  };

  const selectCounterparty = (email: string) => {
    setRecipientEmail(email);
    setError(null);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white p-4 rounded-card border border-[#DFE3E8] shadow-card flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
              step === 'form' ? 'bg-[#172B4D] text-white' : 'bg-[#218568] text-white'
            }`}
          >
            1
          </div>
          <span
            className={`text-xs font-medium ${
              step === 'form' ? 'text-[#17212F] font-bold' : 'text-[#667085]'
            }`}
          >
            Specify Transfer
          </span>
        </div>

        <div className="w-8 h-px bg-[#DFE3E8]" />

        <div className="flex items-center gap-2">
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
              step === 'review'
                ? 'bg-[#172B4D] text-white'
                : step === 'confirmed'
                ? 'bg-[#218568] text-white'
                : 'bg-gray-200 text-[#667085]'
            }`}
          >
            2
          </div>
          <span
            className={`text-xs font-medium ${
              step === 'review' ? 'text-[#17212F] font-bold' : 'text-[#667085]'
            }`}
          >
            Review & Sign
          </span>
        </div>

        <div className="w-8 h-px bg-[#DFE3E8]" />

        <div className="flex items-center gap-2">
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
              step === 'confirmed' ? 'bg-[#218568] text-white' : 'bg-gray-200 text-[#667085]'
            }`}
          >
            3
          </div>
          <span
            className={`text-xs font-medium ${
              step === 'confirmed' ? 'text-[#17212F] font-bold' : 'text-[#667085]'
            }`}
          >
            Settlement Receipt
          </span>
        </div>
      </div>

      {error && <Alert type="error" message={error} />}

      {step === 'form' && (
        <div className="bg-white rounded-card border border-[#DFE3E8] p-6 shadow-card">
          <div className="mb-6 pb-4 border-b border-[#DFE3E8]">
            <h2 className="text-base font-bold text-[#17212F] tracking-tight">New Money Transfer</h2>
            <p className="text-xs text-[#667085] mt-0.5">
              Instant inter-wallet settlement with ACID guarantees and immutable ledger creation.
            </p>
          </div>

          <form onSubmit={handleProceedToReview} className="space-y-4">
            <div>
              <Input
                label="Recipient Email"
                type="email"
                placeholder="bob@ledgerpay.demo"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                required
              />

              <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] text-[#667085] flex items-center gap-1">
                  <UserCheck className="w-3 h-3" /> Quick pick:
                </span>
                {[
                  'bob@ledgerpay.demo',
                  'carol@ledgerpay.demo',
                  'david@ledgerpay.demo',
                  'eve@ledgerpay.demo',
                ]
                  .filter((e) => e !== user?.email)
                  .map((email) => (
                    <button
                      key={email}
                      type="button"
                      onClick={() => selectCounterparty(email)}
                      className="px-2 py-0.5 text-[11px] bg-[#F4F6F8] hover:bg-gray-200 text-[#17212F] border border-[#DFE3E8] rounded transition-colors"
                    >
                      {email.split('@')[0]}
                    </button>
                  ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-[#17212F]">Transfer Amount (USD)</label>
                <span className="text-xs text-[#667085]">
                  Available:{' '}
                  <span className="font-semibold text-[#17212F]">
                    {wallet ? formatCurrency(wallet.balance) : '$0.00'}
                  </span>
                </span>
              </div>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                required
              />
            </div>

            <div>
              <Input
                label="Memo / Description (Optional)"
                placeholder="e.g. Invoice #2026-04, Reimbursement"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={255}
              />
            </div>

            <div className="pt-4 border-t border-[#DFE3E8] flex justify-end">
              <Button type="submit" variant="primary" size="md">
                <span>Continue to Review</span>
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          </form>
        </div>
      )}

      {step === 'review' && (
        <div className="bg-white rounded-card border border-[#DFE3E8] p-6 shadow-card space-y-5">
          <div className="pb-4 border-b border-[#DFE3E8]">
            <h2 className="text-base font-bold text-[#17212F] tracking-tight">Review Transfer Details</h2>
            <p className="text-xs text-[#667085] mt-0.5">
              Confirm the parameters before executing the irreversible ledger settlement.
            </p>
          </div>

          <div className="bg-[#F4F6F8] p-4 rounded border border-[#DFE3E8] space-y-3">
            <div className="flex justify-between text-xs py-1">
              <span className="text-[#667085]">Sender Account</span>
              <span className="font-medium text-[#17212F]">{user?.email}</span>
            </div>
            <div className="flex justify-between text-xs py-1">
              <span className="text-[#667085]">Recipient Account</span>
              <span className="font-bold text-[#17212F]">{recipientEmail}</span>
            </div>
            <div className="flex justify-between text-xs py-1 border-t border-[#DFE3E8]/80 pt-2">
              <span className="text-[#667085]">Transfer Principal</span>
              <span className="font-bold text-base text-[#17212F]">
                {formatCurrency(parseFloat(amountStr))}
              </span>
            </div>
            <div className="flex justify-between text-xs py-1">
              <span className="text-[#667085]">Settlement Fee</span>
              <span className="text-[#218568] font-semibold">$0.00 (Zero Fee)</span>
            </div>
            {description && (
              <div className="flex justify-between text-xs py-1">
                <span className="text-[#667085]">Description</span>
                <span className="text-[#17212F] italic">"{description}"</span>
              </div>
            )}
            <div className="flex justify-between text-[11px] py-1 border-t border-[#DFE3E8]/80 pt-2 text-[#667085]">
              <span>Idempotency Key</span>
              <span className="font-mono text-[10px] text-[#344563] truncate max-w-xs">
                {idempotencyKey}
              </span>
            </div>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded text-xs text-[#B7791F] flex items-start gap-2">
            <Shield className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              Transactions cannot be undone once committed. Dual accounting ledger entries (one debit and one credit) will be generated atomically.
            </span>
          </div>

          <div className="pt-4 border-t border-[#DFE3E8] flex justify-between">
            <Button
              type="button"
              variant="secondary"
              size="md"
              disabled={isLoading}
              onClick={() => setStep('form')}
            >
              Modify Transfer
            </Button>

            <Button
              type="button"
              variant="primary"
              size="md"
              isLoading={isLoading}
              onClick={handleExecuteTransfer}
            >
              Confirm & Settle Funds
            </Button>
          </div>
        </div>
      )}

      {step === 'confirmed' && transferResult && (
        <div className="bg-white rounded-card border border-[#DFE3E8] p-6 shadow-card space-y-6">
          <div className="text-center py-4">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-[#218568] border border-emerald-200 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-[#17212F] tracking-tight">
              Transfer Successfully Settled
            </h2>
            <p className="text-xs text-[#667085] mt-1">
              Ledger entries balanced. Funds debited from your wallet and credited to recipient.
            </p>
          </div>

          {transferResult.status === 'FLAGGED' && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded text-xs text-[#B7791F] space-y-2">
              <div className="flex items-center gap-2 font-bold">
                <AlertTriangle className="w-4 h-4" />
                <span>Security / Fraud Flag Notice</span>
              </div>
              <p className="leading-relaxed">
                This transfer was flagged by the system's rule engine but was permitted to complete under observation:
              </p>
              {transferResult.fraudFlags?.map((flag, idx) => (
                <div key={idx} className="bg-white/80 p-2 rounded border border-amber-200 text-[11px]">
                  <span className="font-mono font-semibold">[{flag.ruleCode}]</span>: {flag.reason}
                </div>
              ))}
            </div>
          )}

          <div className="bg-[#F4F6F8] rounded p-4 border border-[#DFE3E8] space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-[#DFE3E8]">
              <span className="text-[#667085]">Transaction Reference</span>
              <span className="font-mono font-bold text-[#17212F]">
                {transferResult.reference}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[#667085]">Amount Transferred</span>
              <span className="font-bold text-[#17212F]">
                {formatCurrency(transferResult.amount)}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[#667085]">Recipient</span>
              <span className="font-medium text-[#17212F]">{transferResult.recipientEmail}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[#667085]">Status</span>
              <Badge variant={transferResult.status} />
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[#667085]">Timestamp</span>
              <span className="text-[#667085]">
                {new Date(transferResult.createdAt).toLocaleString()}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-[#DFE3E8]">
            <Button
              variant="secondary"
              size="md"
              onClick={handleReset}
              className="flex items-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Send Another Transfer</span>
            </Button>

            <Button
              variant="primary"
              size="md"
              onClick={() => navigate(`/transactions/${transferResult.id}`)}
              className="flex items-center gap-1.5"
            >
              <Receipt className="w-4 h-4" />
              <span>Inspect Ledger Record</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
