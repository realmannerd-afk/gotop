'use client';
import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { refreshLeaderboard } from '@/app/actions';

export function RefreshButton() {
  const [loading, setLoading] = useState(false);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      await refreshLeaderboard();
    } finally {
      // Small delay so the user sees the spinner
      setTimeout(() => setLoading(false), 500);
    }
  };

  return (
    <button
      onClick={handleRefresh}
      disabled={loading}
      className="p-1.5 text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors disabled:opacity-50"
      title="Refresh Leaderboard"
    >
      <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-500' : ''}`} />
    </button>
  );
}
