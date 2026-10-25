import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';

export const Layout: React.FC = () => {
  const location = useLocation();

  const getPageInfo = () => {
    const path = location.pathname;
    if (path.startsWith('/dashboard')) {
      return { title: 'Overview', subtitle: 'Account balance and recent settlement activity' };
    }
    if (path.startsWith('/wallet')) {
      return { title: 'Wallet Details', subtitle: 'Simulated currency holding & credit/debit records' };
    }
    if (path.startsWith('/send')) {
      return { title: 'Transfer Funds', subtitle: 'Immediate inter-wallet settlement with idempotency' };
    }
    if (path.startsWith('/transactions')) {
      return { title: 'Transaction Records', subtitle: 'Audited log of all counterparty transfers' };
    }
    if (path.startsWith('/ledger')) {
      return { title: 'Double-Entry Ledger', subtitle: 'Immutable debit & credit balance accounting entries' };
    }
    return { title: 'LedgerPay', subtitle: 'Financial Management System' };
  };

  const { title, subtitle } = getPageInfo();

  return (
    <div className="flex h-screen bg-[#F4F6F8] overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopNav title={title} subtitle={subtitle} />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-6xl mx-auto fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
