'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * 自動ナビゲーション機能を提供するカスタムフック
 */
export function useNavigation() {
  const router = useRouter();
  const [autoNavigate, setAutoNavigate] = useState(true);
  const [isNavigating, setIsNavigating] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // クリーンアップ処理
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  /**
   * 指定されたパスへ自動的にナビゲートする
   * @param path - 遷移先のパス
   * @param delay - 遷移までの遅延時間（ミリ秒）
   */
  const navigateWithDelay = (path: string, delay: number = 1500) => {
    // 前回のタイムアウトをクリア
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setIsNavigating(true);
    timeoutRef.current = setTimeout(() => {
      router.push(path);
    }, delay);
  };

  /**
   * ナビゲーションをキャンセルする
   */
  const cancelNavigation = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsNavigating(false);
  };

  /**
   * ナビゲーション状態をリセットする
   */
  const resetNavigation = () => {
    cancelNavigation();
  };

  return {
    autoNavigate,
    setAutoNavigate,
    isNavigating,
    navigateWithDelay,
    cancelNavigation,
    resetNavigation,
  };
}
