import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 mt-auto">
      <div className="container mx-auto px-4 py-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="text-gray-900 dark:text-white font-semibold">gotop.</span>
          <span className="text-sm text-gray-500 dark:text-gray-400">© {new Date().getFullYear()} gotop.</span>
        </div>
        
        <div className="flex items-center gap-6 text-sm font-medium text-gray-500 dark:text-gray-400">
          <Link href="/leaderboard" className="hover:text-gray-900 dark:hover:text-white transition-colors">Leaderboard</Link>
          <Link href="/submit" className="hover:text-gray-900 dark:hover:text-white transition-colors">Submit</Link>
        </div>
      </div>
    </footer>
  );
}
