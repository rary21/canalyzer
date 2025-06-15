import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { DBCProvider } from '@/contexts/DBCContext';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CANalyzer - CAN信号解析ツール",
  description: "DBCファイルを読み込んでCAN信号を解析・可視化するブラウザアプリケーション",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        <DBCProvider>
          {children}
        </DBCProvider>
      </body>
    </html>
  );
}
