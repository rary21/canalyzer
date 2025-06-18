import React from 'react';

interface LoadingSpinnerProps {
  /** スピナーのサイズ */
  size?: 'sm' | 'md' | 'lg';
  /** ローディングメッセージ */
  message?: string;
  /** 追加のクラス名 */
  className?: string;
  /** 中央配置するかどうか */
  center?: boolean;
}

/**
 * 共通ローディングスピナーコンポーネント
 */
export default function LoadingSpinner({
  size = 'md',
  message,
  className = '',
  center = true,
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  const spinnerElement = (
    <>
      <div
        className={`animate-spin rounded-full border-b-2 border-blue-600 ${sizeClasses[size]} ${
          center ? 'mx-auto' : ''
        } ${message ? 'mb-4' : ''}`}
      />
      {message && <p className="text-gray-600">{message}</p>}
    </>
  );

  if (center) {
    return <div className={`text-center ${className}`}>{spinnerElement}</div>;
  }

  return <div className={className}>{spinnerElement}</div>;
}
