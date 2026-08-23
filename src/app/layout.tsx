import type { Metadata } from 'next';
import { DM_Sans } from 'next/font/google';
import './globals.css';

const dmSans = DM_Sans({ subsets: ['latin'], weight: ['400', '500', '700'] });

export const metadata: Metadata = {
  title: 'THE INTERNET IS RUNNING OUT',
  description: 'Once it\'s gone, it\'s gone. 1,000,000 spaces.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${dmSans.className} bg-[#FAFAFA] text-[#111111] antialiased selection:bg-[#FF3300] selection:text-white h-screen w-screen overflow-hidden flex flex-col`}>
        {children}
      </body>
    </html>
  );
}
