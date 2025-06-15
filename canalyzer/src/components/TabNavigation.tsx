'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useDBCContext } from '@/contexts/DBCContext'

interface TabItem {
  id: string
  label: string
  href: string
  icon?: React.ReactNode
}

export default function TabNavigation() {
  const pathname = usePathname()
  // DBCコンテキストは利用可能だが、タブ表示には影響しない
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { dbcData } = useDBCContext()

  // DBCデータの有無に関係なく常にタブを表示
  // DBCファイルを読み込んだらすぐにタブ切り替えができるようにする

  const tabs: TabItem[] = [
    {
      id: 'info',
      label: 'DBC情報',
      href: '/info',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      id: 'values',
      label: 'CAN値表示',
      href: '/values',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    {
      id: 'graph',
      label: 'グラフ表示',
      href: '/graph',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    }
  ]

  return (
    <div className="border-b border-gray-200 bg-white">
      <nav className="container mx-auto px-4" aria-label="タブナビゲーション">
        <div className="flex space-x-8" role="tablist">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href
            
            return (
              <Link
                key={tab.id}
                href={tab.href}
                role="tab"
                aria-selected={isActive}
                className={`
                  flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200
                  ${isActive
                    ? 'border-blue-500 text-blue-600 tab-active'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}