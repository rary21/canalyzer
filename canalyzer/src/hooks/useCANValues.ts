'use client';

import { useState, useMemo } from 'react';
import { CANValue } from '@/types/can';

export type SortField =
  | 'signalName'
  | 'messageName'
  | 'timestamp'
  | 'physicalValue'
  | 'rawValue';
export type SortDirection = 'asc' | 'desc';

interface UseCANValuesParams {
  values: CANValue[];
  itemsPerPage?: number;
}

/**
 * CAN値の表示に関するロジックを管理するカスタムフック
 */
export function useCANValues({
  values,
  itemsPerPage = 50,
}: UseCANValuesParams) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('timestamp');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);

  // フィルタリングとソート
  const filteredAndSortedValues = useMemo(() => {
    let filtered = values;

    // 検索フィルター
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (value) =>
          value.signalName.toLowerCase().includes(query) ||
          value.messageName.toLowerCase().includes(query) ||
          value.unit.toLowerCase().includes(query) ||
          (value.description && value.description.toLowerCase().includes(query))
      );
    }

    // ソート
    const sorted = [...filtered].sort((a, b) => {
      let valueA: string | number = a[sortField];
      let valueB: string | number = b[sortField];

      // 文字列の場合は小文字で比較
      if (typeof valueA === 'string' && typeof valueB === 'string') {
        valueA = valueA.toLowerCase();
        valueB = valueB.toLowerCase();
      }

      if (valueA < valueB) return sortDirection === 'asc' ? -1 : 1;
      if (valueA > valueB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [values, searchQuery, sortField, sortDirection]);

  // ページネーション
  const totalPages = Math.ceil(filteredAndSortedValues.length / itemsPerPage);
  const paginatedValues = filteredAndSortedValues.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // ソート処理
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  // 検索クエリ更新
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  // ページ変更
  const handlePageChange = (page: number) => {
    setCurrentPage(Math.min(Math.max(1, page), totalPages));
  };

  return {
    // 状態
    searchQuery,
    sortField,
    sortDirection,
    currentPage,
    // 計算値
    filteredAndSortedValues,
    paginatedValues,
    totalPages,
    itemsPerPage,
    // ハンドラー
    handleSort,
    handleSearchChange,
    handlePageChange,
  };
}
