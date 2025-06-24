'use client';

import React from 'react';
import { CANValue } from '@/types/can';
import { useCANValues } from '@/hooks/useCANValues';
import FilterControls from './FilterControls';
import CANValuesTable from './CANValuesTable';
import Pagination from './Pagination';

interface CANValuesDisplayProps {
  values: CANValue[];
  isLoading?: boolean;
}

/**
 * CAN値の表示を管理するコンテナコンポーネント
 */
export default function CANValuesDisplay({
  values,
  isLoading = false,
}: CANValuesDisplayProps) {
  const {
    searchQuery,
    sortField,
    sortDirection,
    currentPage,
    filteredAndSortedValues,
    paginatedValues,
    totalPages,
    itemsPerPage,
    handleSort,
    handleSearchChange,
    handlePageChange,
  } = useCANValues({ values });

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">CANデータを解析中...</p>
        </div>
      </div>
    );
  }

  if (values.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 text-center">
          <div className="w-16 h-16 mx-auto mb-4 text-gray-400">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <p className="text-lg font-medium text-gray-900 mb-2">
            CANデータがありません
          </p>
          <p className="text-gray-600">
            サンプルデータを読み込むか、CANフレームをパースしてください
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* フィルターコントロール */}
      <FilterControls
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        totalItems={values.length}
        filteredItems={filteredAndSortedValues.length}
      />

      {/* テーブル */}
      <CANValuesTable
        values={paginatedValues}
        sortField={sortField}
        sortDirection={sortDirection}
        onSort={handleSort}
      />

      {/* ページネーション */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        itemsPerPage={itemsPerPage}
        totalItems={filteredAndSortedValues.length}
        onPageChange={handlePageChange}
      />
    </div>
  );
}
