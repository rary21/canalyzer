import React from 'react';

interface EmptyStateProps {
  /** アイコンSVGパス */
  iconPath?: string;
  /** タイトル */
  title: string;
  /** 説明文 */
  description?: string;
  /** アクションボタン */
  action?: React.ReactNode;
  /** 追加のクラス名 */
  className?: string;
}

/**
 * 共通の空状態表示コンポーネント
 */
export default function EmptyState({
  iconPath,
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) {
  const defaultIconPath =
    'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z';

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      <div className="p-6 text-center">
        {iconPath !== null && (
          <div className="w-16 h-16 mx-auto mb-4 text-gray-400">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d={iconPath || defaultIconPath}
              />
            </svg>
          </div>
        )}
        <p className="text-lg font-medium text-gray-900 mb-2">{title}</p>
        {description && <p className="text-gray-600 mb-4">{description}</p>}
        {action && <div className="mt-4">{action}</div>}
      </div>
    </div>
  );
}
