/**
 * 共通フォーマッター関数
 */

/**
 * タイムスタンプを日本語のローカル時刻文字列にフォーマット
 * @param timestamp - Unix タイムスタンプ（ミリ秒）
 * @param options - フォーマットオプション
 * @returns フォーマットされた日時文字列
 */
export function formatTimestamp(
  timestamp: number,
  options?: {
    showMilliseconds?: boolean;
    format?: 'full' | 'time' | 'date';
  }
): string {
  const { showMilliseconds = true, format = 'full' } = options || {};

  const dateOptions: Intl.DateTimeFormatOptions = {
    hour12: false,
  };

  switch (format) {
    case 'date':
      dateOptions.year = 'numeric';
      dateOptions.month = '2-digit';
      dateOptions.day = '2-digit';
      break;
    case 'time':
      dateOptions.hour = '2-digit';
      dateOptions.minute = '2-digit';
      dateOptions.second = '2-digit';
      if (showMilliseconds) {
        dateOptions.fractionalSecondDigits = 3;
      }
      break;
    case 'full':
    default:
      dateOptions.year = 'numeric';
      dateOptions.month = '2-digit';
      dateOptions.day = '2-digit';
      dateOptions.hour = '2-digit';
      dateOptions.minute = '2-digit';
      dateOptions.second = '2-digit';
      if (showMilliseconds) {
        dateOptions.fractionalSecondDigits = 3;
      }
      break;
  }

  return new Date(timestamp).toLocaleString('ja-JP', dateOptions);
}

/**
 * 数値を指定された桁数でフォーマット
 * @param value - フォーマットする数値
 * @param decimals - 小数点以下の桁数（デフォルト: 3）
 * @returns フォーマットされた文字列
 */
export function formatNumber(value: number, decimals: number = 3): string {
  if (Number.isInteger(value)) {
    return value.toString();
  }
  return value.toFixed(decimals);
}

/**
 * 相対時間を人間が読みやすい形式にフォーマット
 * @param milliseconds - ミリ秒単位の時間
 * @returns フォーマットされた時間文字列
 */
export function formatRelativeTime(milliseconds: number): string {
  const seconds = milliseconds / 1000;

  if (seconds < 60) {
    return `${seconds.toFixed(1)}秒`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes < 60) {
    return `${minutes}分${Math.round(remainingSeconds)}秒`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return `${hours}時間${remainingMinutes}分`;
}

/**
 * バイト数を人間が読みやすい形式にフォーマット
 * @param bytes - バイト数
 * @returns フォーマットされたサイズ文字列
 */
export function formatBytes(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(unitIndex > 0 ? 2 : 0)} ${units[unitIndex]}`;
}

/**
 * 16進数のIDを標準的なCAN ID形式にフォーマット
 * @param id - CAN ID（10進数）
 * @param padding - パディングの桁数（デフォルト: 3）
 * @returns フォーマットされたID文字列
 */
export function formatCANId(id: number, padding: number = 3): string {
  return `0x${id.toString(16).toUpperCase().padStart(padding, '0')}`;
}
