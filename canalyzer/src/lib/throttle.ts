/**
 * 関数の実行を指定された間隔でスロットリングする
 * @param func 実行する関数
 * @param delay スロットリング間隔（ミリ秒）
 * @returns スロットリングされた関数
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCallTime = 0;
  let timeoutId: NodeJS.Timeout | null = null;
  let lastArgs: Parameters<T> | null = null;

  return function (...args: Parameters<T>) {
    const now = Date.now();
    const timeSinceLastCall = now - lastCallTime;

    if (timeSinceLastCall >= delay) {
      // 即座に実行
      lastCallTime = now;
      func(...args);
    } else {
      // 次の実行をスケジュール
      lastArgs = args;
      if (!timeoutId) {
        timeoutId = setTimeout(() => {
          lastCallTime = Date.now();
          if (lastArgs) {
            func(...lastArgs);
          }
          timeoutId = null;
          lastArgs = null;
        }, delay - timeSinceLastCall);
      }
    }
  };
}

/**
 * キャンセル可能なスロットル関数を作成する
 * @param func 実行する関数
 * @param delay スロットリング間隔（ミリ秒）
 * @returns スロットリングされた関数とキャンセル関数
 */
export function throttleWithCancel<T extends (...args: unknown[]) => unknown>(
  func: T,
  delay: number
): {
  throttled: (...args: Parameters<T>) => void;
  cancel: () => void;
} {
  let lastCallTime = 0;
  let timeoutId: NodeJS.Timeout | null = null;
  let lastArgs: Parameters<T> | null = null;

  const throttled = function (...args: Parameters<T>) {
    const now = Date.now();
    const timeSinceLastCall = now - lastCallTime;

    if (timeSinceLastCall >= delay) {
      // 即座に実行
      lastCallTime = now;
      func(...args);
    } else {
      // 次の実行をスケジュール
      lastArgs = args;
      if (!timeoutId) {
        timeoutId = setTimeout(() => {
          lastCallTime = Date.now();
          if (lastArgs) {
            func(...lastArgs);
          }
          timeoutId = null;
          lastArgs = null;
        }, delay - timeSinceLastCall);
      }
    }
  };

  const cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
      lastArgs = null;
    }
  };

  return { throttled, cancel };
}
