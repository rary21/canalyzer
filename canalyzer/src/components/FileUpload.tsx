'use client'

import { useState } from 'react'
import { DBCParser } from '@/lib/dbc-parser'
import { ParseResult } from '@/types/dbc'

export default function FileUpload() {
  const [fileName, setFileName] = useState<string>('')
  const [parseResult, setParseResult] = useState<ParseResult | null>(null)
  const [loading, setLoading] = useState(false)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // DBCファイルかチェック
    if (!file.name.toLowerCase().endsWith('.dbc')) {
      alert('DBCファイルを選択してください')
      return
    }

    setFileName(file.name)
    setLoading(true)

    try {
      // ファイル内容を読み込む
      const content = await file.text()
      
      // DBCファイルをパース
      const parser = new DBCParser()
      const result = parser.parse(content)
      setParseResult(result)
      
      console.log('パース結果:', result)
    } catch (error) {
      console.error('ファイル読み込みエラー:', error)
      alert('ファイルの読み込みに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-2xl">
      <label className="block">
        <span className="text-gray-700 text-sm font-medium mb-2 block">
          DBCファイルを選択
        </span>
        <input
          type="file"
          accept=".dbc"
          onChange={handleFileChange}
          disabled={loading}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100
            cursor-pointer
            disabled:opacity-50"
        />
      </label>
      
      {loading && (
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">読み込み中...</p>
        </div>
      )}
      
      {parseResult && (
        <div className="mt-6 space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-2">パース結果</h3>
            <p className="text-sm text-gray-700">
              <span className="font-medium">ファイル:</span> {fileName}
            </p>
            <p className="text-sm text-gray-700">
              <span className="font-medium">ステータス:</span>{' '}
              {parseResult.success ? (
                <span className="text-green-600">成功</span>
              ) : (
                <span className="text-red-600">エラーあり</span>
              )}
            </p>
          </div>

          {parseResult.database && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold mb-2">データベース情報</h3>
              <p className="text-sm text-gray-700">
                <span className="font-medium">メッセージ数:</span>{' '}
                {parseResult.database.messages.size}
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-medium">ノード数:</span>{' '}
                {parseResult.database.nodes.length}
              </p>
              
              {parseResult.database.messages.size > 0 && (
                <div className="mt-3">
                  <h4 className="text-sm font-medium mb-1">メッセージ一覧（最初の5件）:</h4>
                  <ul className="text-xs space-y-1">
                    {Array.from(parseResult.database.messages.values())
                      .slice(0, 5)
                      .map((msg) => (
                        <li key={msg.id} className="text-gray-600">
                          ID: {msg.id} - {msg.name} ({msg.signals.length} シグナル)
                        </li>
                      ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {parseResult.errors.length > 0 && (
            <div className="p-4 bg-red-50 rounded-lg">
              <h3 className="font-semibold mb-2 text-red-800">エラー</h3>
              <ul className="text-sm space-y-1">
                {parseResult.errors.map((error, index) => (
                  <li key={index} className="text-red-600">
                    行 {error.line}: {error.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}