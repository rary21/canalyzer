import React from 'react';

interface SearchInputProps {
  /** 検索値 */
  value: string;
  /** 値変更ハンドラー */
  onChange: (value: string) => void;
  /** プレースホルダーテキスト */
  placeholder?: string;
  /** 追加のクラス名 */
  className?: string;
  /** 入力フィールドの幅クラス */
  width?: string;
}

/**
 * 共通検索入力コンポーネント
 */
export default function SearchInput({
  value,
  onChange,
  placeholder = '検索...',
  className = '',
  width = 'w-full sm:w-80',
}: SearchInputProps) {
  return (
    <div className={`relative ${className}`}>
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
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${width}`}
      />
    </div>
  );
}
