'use client';

import React from 'react';

interface FilterControlsProps {
  /** 検索クエリ */
  searchQuery: string;
  /** 検索クエリ変更時のコールバック */
  onSearchChange: (query: string) => void;
  /** 合計アイテム数 */
  totalItems: number;
  /** フィルター後のアイテム数 */
  filteredItems: number;
}

/**
 * フィルタリングUIコンポーネント
 */
export default function FilterControls({
  searchQuery,
  onSearchChange,
  totalItems,
  filteredItems,
}: FilterControlsProps) {
  return (
    <div className="p-6 border-b border-gray-200">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">CAN信号値</h2>
          <p className="text-sm text-gray-600 mt-1">
            {filteredItems} / {totalItems} 件のシグナル値
          </p>
        </div>

        {/* 検索フィールド */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg
              className="h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <input
            type="text"
            placeholder="シグナル名、メッセージ名、単位、説明で検索..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-80"
          />
        </div>
      </div>
    </div>
  );
}
