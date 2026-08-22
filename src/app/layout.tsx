import type { Metadata } from 'next';
import { DM_Sans } from 'next/font/google';
import './globals.css';
import Link from 'next/link';
import Image from 'next/image';
import { Footer } from '@/components/Footer';

const dmSans = DM_Sans({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL('https://gotop.lol'),
  title: 'gotop - Discover products worth knowing about',
  description: 'Where products compete for attention. Bid for visibility. Climb the leaderboard.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${dmSans.className} min-h-screen bg-gray-50 text-gray-900 dark:bg-black dark:text-gray-100 flex flex-col font-sans antialiased`} suppressHydrationWarning>
        {/* Header */}
        <header className="w-full">
          <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-4 px-4 pt-5 pb-4">
            <Link href="/" className="inline-flex items-center gap-1.5 font-medium tracking-tight text-[22px]">
              <Image src="/gotop-logo.svg" alt="gotop logo" width={120} height={40} className="h-8 w-auto dark:invert" />
            </Link>
            
            <div className="flex items-center gap-3 sm:gap-4">
              <nav aria-label="Main">
                <ul className="flex items-center gap-4 text-sm sm:gap-5">
                  <li>
                    <Link href="/leaderboard" className="font-medium transition-colors hover:text-gray-900 dark:hover:text-white text-gray-500 dark:text-gray-400">
                      Leaderboard
                    </Link>
                  </li>
                  <li>
                    <Link href="/trending" className="font-medium transition-colors hover:text-gray-900 dark:hover:text-white text-gray-500 dark:text-gray-400">
                      Trending
                    </Link>
                  </li>
                  <li>
                    <Link href="/category" className="font-medium transition-colors hover:text-gray-900 dark:hover:text-white text-gray-500 dark:text-gray-400">
                      Categories
                    </Link>
                  </li>
                  <li>
                    <Link href="/new" className="font-medium transition-colors hover:text-gray-900 dark:hover:text-white text-gray-500 dark:text-gray-400">
                      New
                    </Link>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex flex-col">
          {children}
        </main>
        
      </body>
    </html>
  );
}

