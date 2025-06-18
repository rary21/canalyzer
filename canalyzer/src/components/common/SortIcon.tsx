import React from 'react';

interface SortIconProps {
  /** 現在のソートフィールド */
  sortField: string;
  /** 対象フィールド */
  field: string;
  /** ソート方向 */
  sortDirection: 'asc' | 'desc';
  /** アイコンのサイズクラス */
  size?: string;
  /** アクティブ時の色クラス */
  activeColor?: string;
  /** 非アクティブ時の色クラス */
  inactiveColor?: string;
}

/**
 * 共通ソートアイコンコンポーネント
 */
export default function SortIcon({
  sortField,
  field,
  sortDirection,
  size = 'w-4 h-4',
  activeColor = 'text-blue-500',
  inactiveColor = 'text-gray-400',
}: SortIconProps) {
  const isActive = sortField === field;

  if (!isActive) {
    // 両方向矢印（非アクティブ）
    return (
      <svg
        className={`${size} ${inactiveColor}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
        />
      </svg>
    );
  }

  // アクティブな矢印
  return sortDirection === 'asc' ? (
    <svg
      className={`${size} ${activeColor}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 15l7-7 7 7"
      />
    </svg>
  ) : (
    <svg
      className={`${size} ${activeColor}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 9l-7 7-7-7"
      />
    </svg>
  );
}
