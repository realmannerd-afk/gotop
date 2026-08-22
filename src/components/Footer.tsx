import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 mt-auto">
      <div className="container mx-auto px-4 py-8 md:py-12 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-col gap-1 items-center md:items-start text-gray-900 dark:text-white font-semibold">
          <span>gotop.</span>
          <span className="text-xs text-gray-400 font-normal">
            Inspired by <a href="https://outbid.lol" target="_blank" rel="noopener noreferrer" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors underline decoration-gray-300">outbid.lol</a> by <a href="https://x.com/jonathan_wilke" target="_blank" rel="noopener noreferrer" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors underline decoration-gray-300">Jonathan Wilke</a>
          </span>
        </div>
        
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center md:text-left">
          Where products compete for attention. © {new Date().getFullYear()} gotop.
        </p>

        <div className="flex items-center gap-6 text-sm font-medium text-gray-500 dark:text-gray-400">
                    <Link href="/about" className="hover:text-gray-900 dark:hover:text-white transition-colors">About</Link>
          <Link href="/rules" className="hover:text-gray-900 dark:hover:text-white transition-colors">Rules</Link>
          <Link href="/leaderboard" className="hover:text-gray-900 dark:hover:text-white transition-colors">Leaderboard</Link>
          <Link href="/submit" className="hover:text-gray-900 dark:hover:text-white transition-colors">Submit</Link>
        </div>
      </div>
    </footer>
  );
}
