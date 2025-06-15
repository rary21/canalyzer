'use client'

import { useDBCContext } from '@/contexts/DBCContext'
import Link from 'next/link'
import DBCInfoDisplay from '@/components/DBCInfoDisplay'
import TabNavigation from '@/components/TabNavigation'

export default function InfoPage() {
  const { dbcData, fileName } = useDBCContext()

  if (!dbcData) {
    return (
      <main className="min-h-screen bg-gray-50">
        <TabNavigation />
        <div className="container mx-auto px-4 py-8">
          <div className="flex min-h-[60vh] flex-col items-center justify-center">
            <div className="text-center max-w-md">
              <div className="w-16 h-16 mx-auto mb-6 text-gray-400">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">DBC情報</h1>
              <p className="text-gray-600 mb-8">
                DBC情報を表示するには、DBCファイルが必要です
              </p>
              <Link 
                href="/"
                className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
                DBCファイルをアップロード
              </Link>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <TabNavigation />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">DBC情報</h1>
            {fileName && (
              <p className="text-gray-600 mt-1">ファイル: {fileName}</p>
            )}
          </div>
          <Link 
            href="/"
            className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            ← ホームに戻る
          </Link>
        </div>
        
        <DBCInfoDisplay data={dbcData} />
      </div>
    </main>
  )
}