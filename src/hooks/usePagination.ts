import { useState, useMemo, useCallback } from 'react';

interface UsePaginationProps<T> {
  /** ページネーションするデータ */
  data: T[];
  /** 1ページあたりのアイテム数 */
  itemsPerPage?: number;
  /** 初期ページ番号（1から始まる） */
  initialPage?: number;
}

interface UsePaginationReturn<T> {
  /** 現在のページのデータ */
  paginatedData: T[];
  /** 現在のページ番号（1から始まる） */
  currentPage: number;
  /** 総ページ数 */
  totalPages: number;
  /** 総アイテム数 */
  totalItems: number;
  /** 現在のページの開始インデックス（1から始まる） */
  startIndex: number;
  /** 現在のページの終了インデックス（1から始まる） */
  endIndex: number;
  /** ページを設定する */
  setPage: (page: number) => void;
  /** 次のページへ移動 */
  nextPage: () => void;
  /** 前のページへ移動 */
  previousPage: () => void;
  /** 最初のページへ移動 */
  firstPage: () => void;
  /** 最後のページへ移動 */
  lastPage: () => void;
  /** 次のページがあるか */
  hasNextPage: boolean;
  /** 前のページがあるか */
  hasPreviousPage: boolean;
}

/**
 * ページネーション機能を提供するカスタムフック
 * @param props - ページネーション設定
 * @returns ページネーションの状態と操作関数
 */
export function usePagination<T>({
  data,
  itemsPerPage = 50,
  initialPage = 1,
}: UsePaginationProps<T>): UsePaginationReturn<T> {
  const [currentPage, setCurrentPage] = useState(initialPage);

  // 総ページ数を計算
  const totalPages = useMemo(
    () => Math.ceil(data.length / itemsPerPage),
    [data.length, itemsPerPage]
  );

  // ページが範囲外の場合は調整
  const adjustedCurrentPage = useMemo(() => {
    if (currentPage < 1) return 1;
    if (currentPage > totalPages && totalPages > 0) return totalPages;
    return currentPage;
  }, [currentPage, totalPages]);

  // 現在のページのデータを取得
  const paginatedData = useMemo(() => {
    const startIdx = (adjustedCurrentPage - 1) * itemsPerPage;
    const endIdx = startIdx + itemsPerPage;
    return data.slice(startIdx, endIdx);
  }, [data, adjustedCurrentPage, itemsPerPage]);

  // インデックス情報
  const startIndex = useMemo(
    () => Math.min((adjustedCurrentPage - 1) * itemsPerPage + 1, data.length),
    [adjustedCurrentPage, itemsPerPage, data.length]
  );

  const endIndex = useMemo(
    () => Math.min(adjustedCurrentPage * itemsPerPage, data.length),
    [adjustedCurrentPage, itemsPerPage, data.length]
  );

  // ページ操作関数
  const setPage = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const nextPage = useCallback(() => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  }, [totalPages]);

  const previousPage = useCallback(() => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  }, []);

  const firstPage = useCallback(() => {
    setCurrentPage(1);
  }, []);

  const lastPage = useCallback(() => {
    setCurrentPage(totalPages);
  }, [totalPages]);

  // ページ遷移可能かどうか
  const hasNextPage = adjustedCurrentPage < totalPages;
  const hasPreviousPage = adjustedCurrentPage > 1;

  return {
    paginatedData,
    currentPage: adjustedCurrentPage,
    totalPages,
    totalItems: data.length,
    startIndex,
    endIndex,
    setPage,
    nextPage,
    previousPage,
    firstPage,
    lastPage,
    hasNextPage,
    hasPreviousPage,
  };
}
