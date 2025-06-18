import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { DBCProvider } from '@/contexts/DBCContext';
import { RealtimeDataProvider } from '@/contexts/RealtimeDataContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'CANalyzer - CAN信号解析ツール',
  description:
    'DBCファイルを読み込んでCAN信号を解析・可視化するブラウザアプリケーション',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        <ErrorBoundary>
          <DBCProvider>
            <RealtimeDataProvider>{children}</RealtimeDataProvider>
          </DBCProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
