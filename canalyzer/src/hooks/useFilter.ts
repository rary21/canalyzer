import { useState, useMemo, useCallback } from 'react';

interface UseFilterProps<T> {
  /** フィルター対象のデータ */
  data: T[];
  /** 検索対象のフィールド（文字列の場合はネストされたプロパティも可） */
  searchFields?: (keyof T | string)[];
  /** カスタムフィルター関数 */
  customFilter?: (item: T, query: string) => boolean;
  /** 大文字小文字を区別するか */
  caseSensitive?: boolean;
  /** 初期検索クエリ */
  initialQuery?: string;
}

interface UseFilterReturn<T> {
  /** フィルター済みデータ */
  filteredData: T[];
  /** 現在の検索クエリ */
  searchQuery: string;
  /** 検索クエリを設定 */
  setSearchQuery: (query: string) => void;
  /** フィルターをリセット */
  resetFilter: () => void;
  /** フィルターがアクティブか */
  isFiltering: boolean;
  /** フィルター結果の件数 */
  resultCount: number;
}

/**
 * フィルター機能を提供するカスタムフック
 * @param props - フィルター設定
 * @returns フィルター済みデータと操作関数
 */
export function useFilter<T>({
  data,
  searchFields = [],
  customFilter,
  caseSensitive = false,
  initialQuery = '',
}: UseFilterProps<T>): UseFilterReturn<T> {
  const [searchQuery, setSearchQuery] = useState(initialQuery);

  // ネストされたプロパティへのアクセス
  const getValue = useCallback((obj: unknown, path: string): unknown => {
    return path.split('.').reduce((current: unknown, key) => {
      if (current && typeof current === 'object' && key in current) {
        return (current as Record<string, unknown>)[key];
      }
      return undefined;
    }, obj);
  }, []);

  // デフォルトのフィルター関数
  const defaultFilter = useCallback(
    (item: T, query: string): boolean => {
      const normalizedQuery = caseSensitive ? query : query.toLowerCase();

      // 検索フィールドが指定されていない場合は、全フィールドを検索
      if (searchFields.length === 0) {
        const itemStr = JSON.stringify(item);
        const normalizedItemStr = caseSensitive
          ? itemStr
          : itemStr.toLowerCase();
        return normalizedItemStr.includes(normalizedQuery);
      }

      // 指定されたフィールドのみを検索
      return searchFields.some((field) => {
        const value =
          typeof field === 'string'
            ? getValue(item as unknown, field)
            : item[field];

        if (value == null) return false;

        const valueStr = String(value);
        const normalizedValue = caseSensitive
          ? valueStr
          : valueStr.toLowerCase();
        return normalizedValue.includes(normalizedQuery);
      });
    },
    [searchFields, caseSensitive, getValue]
  );

  // フィルター済みデータ
  const filteredData = useMemo(() => {
    const trimmedQuery = searchQuery.trim();
    if (!trimmedQuery) return data;

    const filterFunction = customFilter || defaultFilter;
    return data.filter((item) => filterFunction(item, trimmedQuery));
  }, [data, searchQuery, customFilter, defaultFilter]);

  // フィルターリセット関数
  const resetFilter = useCallback(() => {
    setSearchQuery(initialQuery);
  }, [initialQuery]);

  // フィルター状態
  const isFiltering = searchQuery.trim().length > 0;
  const resultCount = filteredData.length;

  return {
    filteredData,
    searchQuery,
    setSearchQuery,
    resetFilter,
    isFiltering,
    resultCount,
  };
}

/**
 * 複数条件でのフィルター機能を提供するカスタムフック
 */
interface UseAdvancedFilterProps<T> {
  /** フィルター対象のデータ */
  data: T[];
  /** フィルター条件 */
  filters: {
    [K in keyof T]?: (value: T[K]) => boolean;
  };
}

interface UseAdvancedFilterReturn<T> {
  /** フィルター済みデータ */
  filteredData: T[];
  /** フィルター条件を追加/更新 */
  setFilter: <K extends keyof T>(
    field: K,
    filterFn: ((value: T[K]) => boolean) | null
  ) => void;
  /** 特定のフィルターを削除 */
  removeFilter: (field: keyof T) => void;
  /** すべてのフィルターをクリア */
  clearFilters: () => void;
  /** アクティブなフィルターの数 */
  activeFilterCount: number;
}

/**
 * 複数条件でのフィルター機能を提供するカスタムフック
 * @param props - フィルター設定
 * @returns フィルター済みデータと操作関数
 */
export function useAdvancedFilter<T extends Record<string, unknown>>({
  data,
  filters: initialFilters = {},
}: UseAdvancedFilterProps<T>): UseAdvancedFilterReturn<T> {
  const [filters, setFilters] = useState(initialFilters);

  // フィルター済みデータ
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      return Object.entries(filters).every(([field, filterFn]) => {
        const value = item[field as keyof T];
        return (filterFn as (value: unknown) => boolean)(value);
      });
    });
  }, [data, filters]);

  // フィルター設定関数
  const setFilter = useCallback(
    <K extends keyof T>(
      field: K,
      filterFn: ((value: T[K]) => boolean) | null
    ) => {
      setFilters((prev) => {
        if (filterFn === null) {
          const newFilters = { ...prev };
          delete newFilters[field];
          return newFilters;
        }
        return { ...prev, [field]: filterFn };
      });
    },
    []
  );

  // フィルター削除関数
  const removeFilter = useCallback((field: keyof T) => {
    setFilters((prev) => {
      const newFilters = { ...prev };
      delete newFilters[field];
      return newFilters;
    });
  }, []);

  // 全フィルタークリア関数
  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  // アクティブなフィルター数
  const activeFilterCount = Object.keys(filters).length;

  return {
    filteredData,
    setFilter,
    removeFilter,
    clearFilters,
    activeFilterCount,
  };
}
