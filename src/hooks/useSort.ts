import { useState, useMemo, useCallback } from 'react';

type SortDirection = 'asc' | 'desc';

interface UseSortProps<T> {
  /** ソート対象のデータ */
  data: T[];
  /** 初期ソートフィールド */
  initialSortField?: keyof T | string;
  /** 初期ソート方向 */
  initialSortDirection?: SortDirection;
  /** カスタムソート関数 */
  customSort?: (
    a: T,
    b: T,
    field: keyof T | string,
    direction: SortDirection
  ) => number;
}

interface UseSortReturn<T> {
  /** ソート済みデータ */
  sortedData: T[];
  /** 現在のソートフィールド */
  sortField: keyof T | string;
  /** 現在のソート方向 */
  sortDirection: SortDirection;
  /** ソートフィールドと方向を設定 */
  setSort: (field: keyof T | string, direction?: SortDirection) => void;
  /** ソートフィールドを切り替え（同じフィールドなら方向を反転） */
  toggleSort: (field: keyof T | string) => void;
  /** ソートをリセット */
  resetSort: () => void;
}

/**
 * ソート機能を提供するカスタムフック
 * @param props - ソート設定
 * @returns ソート済みデータと操作関数
 */
export function useSort<T>({
  data,
  initialSortField = '',
  initialSortDirection = 'asc',
  customSort,
}: UseSortProps<T>): UseSortReturn<T> {
  const [sortField, setSortField] = useState<keyof T | string>(
    initialSortField
  );
  const [sortDirection, setSortDirection] =
    useState<SortDirection>(initialSortDirection);

  // デフォルトのソート関数
  const defaultSort = useCallback(
    (a: T, b: T, field: keyof T | string, direction: SortDirection): number => {
      if (!field) return 0;

      // ネストされたプロパティへのアクセスをサポート（例: "user.name"）
      const getValue = (obj: unknown, path: string): unknown => {
        return path.split('.').reduce((current: unknown, key) => {
          if (current && typeof current === 'object' && key in current) {
            return (current as Record<string, unknown>)[key];
          }
          return undefined;
        }, obj);
      };

      const aValue =
        typeof field === 'string' ? getValue(a as unknown, field) : a[field];
      const bValue =
        typeof field === 'string' ? getValue(b as unknown, field) : b[field];

      // null/undefinedの処理
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return direction === 'asc' ? 1 : -1;
      if (bValue == null) return direction === 'asc' ? -1 : 1;

      // 文字列の場合は大文字小文字を無視して比較
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const compareResult = aValue
          .toLowerCase()
          .localeCompare(bValue.toLowerCase(), 'ja');
        return direction === 'asc' ? compareResult : -compareResult;
      }

      // 数値の場合
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return direction === 'asc' ? aValue - bValue : bValue - aValue;
      }

      // その他の型の場合は文字列に変換して比較
      const aStr = String(aValue);
      const bStr = String(bValue);
      const compareResult = aStr.localeCompare(bStr, 'ja');
      return direction === 'asc' ? compareResult : -compareResult;
    },
    []
  );

  // ソート済みデータ
  const sortedData = useMemo(() => {
    if (!sortField) return data;

    const sortFunction = customSort || defaultSort;
    return [...data].sort((a, b) =>
      sortFunction(a, b, sortField, sortDirection)
    );
  }, [data, sortField, sortDirection, customSort, defaultSort]);

  // ソート設定関数
  const setSort = useCallback(
    (field: keyof T | string, direction?: SortDirection) => {
      setSortField(field);
      if (direction) {
        setSortDirection(direction);
      }
    },
    []
  );

  // ソートトグル関数
  const toggleSort = useCallback(
    (field: keyof T | string) => {
      if (sortField === field) {
        setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortField(field);
        setSortDirection('asc');
      }
    },
    [sortField]
  );

  // ソートリセット関数
  const resetSort = useCallback(() => {
    setSortField(initialSortField);
    setSortDirection(initialSortDirection);
  }, [initialSortField, initialSortDirection]);

  return {
    sortedData,
    sortField,
    sortDirection,
    setSort,
    toggleSort,
    resetSort,
  };
}
