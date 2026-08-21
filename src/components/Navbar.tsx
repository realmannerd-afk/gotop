"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { TrendingUp, Trophy, Sparkles, LayoutGrid, Plus } from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Leaderboard', href: '/leaderboard', icon: Trophy },
    { name: 'Trending', href: '/trending', icon: TrendingUp },
    { name: 'Categories', href: '/category', icon: LayoutGrid },
    { name: 'New', href: '/new', icon: Sparkles },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="font-bold text-xl tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-900 dark:bg-white rounded flex items-center justify-center">
              <Trophy className="w-4 h-4 text-white dark:text-gray-900" />
            </div>
            gotop.
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2",
                    isActive 
                      ? "bg-gray-100 text-gray-900 dark:bg-gray-900 dark:text-white" 
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-900/50"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/submit"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg text-white bg-gray-900 hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 dark:focus:ring-white dark:focus:ring-offset-gray-950"
          >
            <Plus className="w-4 h-4" />
            Submit Product
          </Link>
        </div>
      </div>
      
      {/* Mobile Nav */}
      <div className="md:hidden border-t border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md overflow-x-auto">
        <nav className="flex items-center p-2 min-w-max">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "px-3 py-2 mx-1 rounded-md text-sm font-medium transition-colors flex items-center gap-2",
                  isActive 
                    ? "bg-gray-100 text-gray-900 dark:bg-gray-900 dark:text-white" 
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-900/50"
                )}
              >
                <Icon className="w-4 h-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
