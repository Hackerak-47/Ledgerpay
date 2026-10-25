import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Shield, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      const message =
        err.response?.data?.message || 'Authentication failed. Please check your credentials.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemoAccount = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('demo1234');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#F4F6F8] flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white rounded-card shadow-card border border-[#DFE3E8] overflow-hidden grid grid-cols-1 md:grid-cols-12">
        <div className="md:col-span-7 p-8 md:p-10 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-8">
              <div className="w-8 h-8 rounded bg-[#172B4D] flex items-center justify-center text-white">
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="4" width="13" height="11" rx="1.5" />
                  <rect x="8" y="9" width="13" height="11" rx="1.5" strokeOpacity="0.75" />
                </svg>
              </div>
              <div>
                <span className="font-bold text-lg text-[#17212F] tracking-tight">LedgerPay</span>
                <span className="text-[10px] uppercase font-semibold text-[#667085] ml-2 tracking-wider">
                  Enterprise
                </span>
              </div>
            </div>

            <div className="mb-6">
              <h2 className="text-xl font-bold text-[#17212F] tracking-tight">Sign in to your account</h2>
              <p className="text-xs text-[#667085] mt-1">
                Access your wallet balance, transactions, and audit ledger entries.
              </p>
            </div>

            {error && (
              <Alert
                type="error"
                message={error}
                className="mb-5"
              />
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email address"
                type="email"
                placeholder="alice@ledgerpay.demo"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <div className="relative">
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-7 text-[#667085] hover:text-[#17212F]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isLoading}
                className="w-full mt-2"
              >
                Sign In
              </Button>
            </form>
          </div>

          <div className="mt-8 pt-6 border-t border-[#DFE3E8]">
            <p className="text-xs font-semibold text-[#17212F] mb-2">
              Development Sandbox Accounts:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {[
                { name: 'Alice Chen', email: 'alice@ledgerpay.demo' },
                { name: 'Bob Martinez', email: 'bob@ledgerpay.demo' },
                { name: 'Carol Singh', email: 'carol@ledgerpay.demo' },
              ].map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => fillDemoAccount(acc.email)}
                  className="px-2.5 py-1 text-xs bg-[#F4F6F8] hover:bg-gray-200 border border-[#DFE3E8] rounded text-[#17212F] transition-colors"
                >
                  {acc.name}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-[#667085] mt-2">
              Default password for all demo accounts is <span className="font-mono font-semibold">demo1234</span>
            </p>
          </div>
        </div>

        <div className="hidden md:flex md:col-span-5 bg-[#172B4D] p-8 text-white flex-col justify-between border-l border-[#172B4D]">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-white/10 text-[11px] font-medium text-slate-200 mb-6">
              <Shield className="w-3.5 h-3.5 text-[#218568]" />
              <span>Payment Infrastructure</span>
            </div>

            <h3 className="text-lg font-bold leading-snug tracking-tight mb-3">
              Guaranteed Correctness & Double-Entry Accounting
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed mb-6">
              Every fund transfer executes inside an atomic PostgreSQL transaction with pessimistic locking, idempotency guarantees, and two matching debit/credit ledger records.
            </p>

            <div className="space-y-4">
              <div className="border-l-2 border-[#218568] pl-3">
                <p className="text-xs font-semibold text-white">Strict Double-Entry</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Debits and credits are immutable and mathematically guaranteed to balance.
                </p>
              </div>

              <div className="border-l-2 border-white/40 pl-3">
                <p className="text-xs font-semibold text-white">Idempotency Protection</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Client-provided idempotency keys prevent duplicate payments across retries.
                </p>
              </div>

              <div className="border-l-2 border-white/40 pl-3">
                <p className="text-xs font-semibold text-white">Concurrency Safety</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Deadlock-free row locking protects against race conditions and balance overdrafts.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-white/10 text-[11px] text-slate-400">
            Fictional internal payment ledger simulation. Not affiliated with Visa Inc.
          </div>
        </div>
      </div>
    </div>
  );
};
