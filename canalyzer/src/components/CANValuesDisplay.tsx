'use client'

import React, { useState, useMemo } from 'react'
import { CANValue } from '@/types/can'

interface CANValuesDisplayProps {
  values: CANValue[]
  isLoading?: boolean
}

type SortField = 'signalName' | 'timestamp' | 'physicalValue' | 'rawValue'
type SortDirection = 'asc' | 'desc'

export default function CANValuesDisplay({ values, isLoading = false }: CANValuesDisplayProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [sortField, setSortField] = useState<SortField>('timestamp')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 50

  // フィルタリングとソート
  const filteredAndSortedValues = useMemo(() => {
    let filtered = values

    // 検索フィルター
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(value =>
        value.signalName.toLowerCase().includes(query) ||
        value.unit.toLowerCase().includes(query) ||
        (value.description && value.description.toLowerCase().includes(query))
      )
    }

    // ソート
    const sorted = [...filtered].sort((a, b) => {
      let valueA: string | number = a[sortField]
      let valueB: string | number = b[sortField]

      // 文字列の場合は小文字で比較
      if (typeof valueA === 'string' && typeof valueB === 'string') {
        valueA = valueA.toLowerCase()
        valueB = valueB.toLowerCase()
      }

      if (valueA < valueB) return sortDirection === 'asc' ? -1 : 1
      if (valueA > valueB) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

    return sorted
  }, [values, searchQuery, sortField, sortDirection])

  // ページネーション
  const totalPages = Math.ceil(filteredAndSortedValues.length / itemsPerPage)
  const paginatedValues = filteredAndSortedValues.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // ソート処理
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
    setCurrentPage(1)
  }

  // ソートアイコン
  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      )
    }

    return sortDirection === 'asc' ? (
      <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    )
  }

  // タイムスタンプのフォーマット
  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('ja-JP', {
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3
    })
  }

  // 数値のフォーマット
  const formatValue = (value: number, decimals: number = 3) => {
    if (Number.isInteger(value)) {
      return value.toString()
    }
    return value.toFixed(decimals)
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">CANデータを解析中...</p>
        </div>
      </div>
    )
  }

  if (values.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 text-center">
          <div className="w-16 h-16 mx-auto mb-4 text-gray-400">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-lg font-medium text-gray-900 mb-2">CANデータがありません</p>
          <p className="text-gray-600">
            サンプルデータを読み込むか、CANフレームをパースしてください
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* ヘッダー */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">CAN信号値</h2>
            <p className="text-sm text-gray-600 mt-1">
              {filteredAndSortedValues.length} / {values.length} 件のシグナル値
            </p>
          </div>
          
          {/* 検索フィールド */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="シグナル名、単位、説明で検索..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(1)
              }}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-80"
            />
          </div>
        </div>
      </div>

      {/* テーブル */}
      <div className="overflow-x-auto table-container">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('signalName')}
              >
                <div className="flex items-center space-x-1">
                  <span>シグナル名</span>
                  {getSortIcon('signalName')}
                </div>
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('physicalValue')}
              >
                <div className="flex items-center space-x-1">
                  <span>物理値</span>
                  {getSortIcon('physicalValue')}
                </div>
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('rawValue')}
              >
                <div className="flex items-center space-x-1">
                  <span>生値</span>
                  {getSortIcon('rawValue')}
                </div>
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                単位
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('timestamp')}
              >
                <div className="flex items-center space-x-1">
                  <span>タイムスタンプ</span>
                  {getSortIcon('timestamp')}
                </div>
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                説明
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedValues.map((value, index) => (
              <tr key={`${value.signalName}-${value.timestamp}-${index}`} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {value.signalName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <span className="font-mono">{formatValue(value.physicalValue)}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span className="font-mono">{formatValue(value.rawValue, 0)}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {value.unit || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span className="font-mono text-xs">{formatTimestamp(value.timestamp)}</span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {value.description || '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ページネーション */}
      {totalPages > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              前へ
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              次へ
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                {Math.min((currentPage - 1) * itemsPerPage + 1, filteredAndSortedValues.length)} - {Math.min(currentPage * itemsPerPage, filteredAndSortedValues.length)} / {filteredAndSortedValues.length} 件
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">前のページ</span>
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
                <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">次のページ</span>
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}