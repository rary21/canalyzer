'use client'

import { useDBCContext } from '@/contexts/DBCContext'
import Link from 'next/link'
import DBCInfoDisplay from '@/components/DBCInfoDisplay'

export default function InfoPage() {
  const { dbcData, fileName } = useDBCContext()

  if (!dbcData) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">DBC情報</h1>
          <p className="text-gray-600 mb-8">
            DBCファイルが読み込まれていません
          </p>
          <Link 
            href="/"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            ← ホームに戻る
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50">
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