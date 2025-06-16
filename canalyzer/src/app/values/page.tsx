'use client'

import { useDBCContext } from '@/contexts/DBCContext'
import { useRealtimeData } from '@/contexts/RealtimeDataContext'
import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import TabNavigation from '@/components/TabNavigation'
import CANValuesDisplay from '@/components/CANValuesDisplay'
import { RealtimeControl } from '@/components/RealtimeControl'
import { CANParser } from '@/lib/can-parser'
import { sampleDBCDatabase, sampleCANFrames } from '@/data/sample-can-data'
import { CANValue } from '@/types/can'

export default function ValuesPage() {
  const { dbcData } = useDBCContext()
  const { currentData, isConnected, isStreaming } = useRealtimeData()
  const [canValues, setCanValues] = useState<CANValue[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [useSampleData, setUseSampleData] = useState(!dbcData)
  const [dataMode, setDataMode] = useState<'static' | 'realtime'>('static')

  // 使用するDBCデータを決定
  const activeDBCData = useMemo(() => {
    if (useSampleData) {
      return sampleDBCDatabase
    }
    return dbcData
  }, [dbcData, useSampleData])

  // 静的データからCANシグナル値を抽出
  useEffect(() => {
    if (!activeDBCData || dataMode !== 'static') {
      if (dataMode === 'static') {
        setCanValues([])
      }
      return
    }

    setIsLoading(true)
    
    try {
      const parser = new CANParser(activeDBCData)
      
      // サンプルフレームデータを解析
      const dataSet = parser.parseDataSet(sampleCANFrames, {
        excludeInvalidValues: true
      })
      
      setCanValues(dataSet.values)
    } catch (error) {
      console.error('CANデータの解析に失敗しました:', error)
      setCanValues([])
    } finally {
      setIsLoading(false)
    }
  }, [activeDBCData, dataMode])

  // リアルタイムデータからCANシグナル値を抽出
  useEffect(() => {
    if (!activeDBCData || dataMode !== 'realtime' || !isConnected) {
      return
    }

    try {
      const parser = new CANParser(activeDBCData)
      const realtimeValues: CANValue[] = []
      
      // 現在のフレームデータを解析
      currentData.forEach((frame) => {
        const analysis = parser.parseFrame(frame)
        if (!analysis.error && analysis.signals.length > 0) {
          realtimeValues.push(...analysis.signals)
        }
      })
      
      setCanValues(realtimeValues)
    } catch (error) {
      console.error('リアルタイムCANデータの解析に失敗しました:', error)
    }
  }, [activeDBCData, dataMode, currentData, isConnected])

  // データモードの切り替え
  useEffect(() => {
    if (isStreaming && dataMode === 'static') {
      setDataMode('realtime')
    } else if (!isStreaming && dataMode === 'realtime') {
      setDataMode('static')
    }
  }, [isStreaming, dataMode])

  if (!activeDBCData) {
    return (
      <main className="min-h-screen bg-gray-50">
        <TabNavigation />
        <div className="container mx-auto px-4 py-8">
          <div className="flex min-h-[60vh] flex-col items-center justify-center">
            <div className="text-center max-w-md">
              <div className="w-16 h-16 mx-auto mb-6 text-gray-400">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">CAN値表示</h1>
              <p className="text-gray-600 mb-8">
                CANシグナル値を表示するには、DBCファイルが必要です
              </p>
              
              <div className="space-y-4">
                <button
                  onClick={() => setUseSampleData(true)}
                  className="w-full inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  サンプルデータを使用
                </button>
                
                <Link 
                  href="/"
                  className="w-full inline-flex items-center justify-center px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                  </svg>
                  DBCファイルをアップロード
                </Link>
              </div>
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
            <h1 className="text-3xl font-bold text-gray-900">CAN値表示</h1>
            <p className="text-gray-600 mt-1">
              {dataMode === 'realtime' 
                ? 'リアルタイムCANデータを表示中' 
                : `${useSampleData ? 'サンプルデータ' : 'アップロードされたDBC'} を使用してCANフレームを解析`
              }
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* データソース切り替え（静的データモードの場合のみ表示） */}
            {dbcData && dataMode === 'static' && (
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={useSampleData}
                  onChange={(e) => setUseSampleData(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
                <span className="ml-2 text-sm text-gray-700">サンプルデータを使用</span>
              </label>
            )}
            
            {/* リアルタイムモード表示 */}
            {dataMode === 'realtime' && (
              <span className="inline-flex items-center px-3 py-2 rounded-full text-sm font-medium bg-green-100 text-green-800">
                <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
                リアルタイム
              </span>
            )}
            
            <Link 
              href="/"
              className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              ← ホームに戻る
            </Link>
          </div>
        </div>

        {/* リアルタイム制御パネル */}
        <RealtimeControl className="mb-8" />

        {/* 統計情報 */}
        {canValues.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg card-shadow border">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">総シグナル数</p>
                  <p className="text-2xl font-semibold text-gray-900">{canValues.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg card-shadow border">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">ユニークシグナル</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {new Set(canValues.map(v => v.signalName)).size}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg card-shadow border">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">時間範囲</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {canValues.length > 0 
                      ? `${Math.max(...canValues.map(v => v.timestamp)) - Math.min(...canValues.map(v => v.timestamp))}ms`
                      : '0ms'
                    }
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg card-shadow border">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">データソース</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {dataMode === 'realtime' ? 'リアルタイム' : useSampleData ? 'サンプル' : 'アップロード'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CANValuesDisplayコンポーネント */}
        <CANValuesDisplay values={canValues} isLoading={isLoading} />
      </div>
    </main>
  )
}