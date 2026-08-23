import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

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
      <body className={`${inter.className} bg-[#FAFAFA] text-[#111111] antialiased selection:bg-[#FF3300] selection:text-white min-h-screen flex flex-col`}>
        {children}
      </body>
    </html>
  );
}
