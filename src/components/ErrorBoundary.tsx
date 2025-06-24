'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { formatErrorForLogging, getUserFriendlyMessage } from '@/utils/errors';

interface Props {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
}

/**
 * エラーバウンダリコンポーネント
 * 子コンポーネントで発生したエラーをキャッチし、フォールバックUIを表示する
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // エラーIDを生成
    const errorId = `error-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    return {
      hasError: true,
      error,
      errorId,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // エラーログを記録
    const logData = formatErrorForLogging(error);
    console.error('ErrorBoundary caught an error:', logData);
    console.error('Error Info:', errorInfo);

    // エラー情報を状態に保存
    this.setState({
      errorInfo,
    });

    // TODO: エラー追跡サービスに送信
    // sendErrorToTrackingService(error, errorInfo);
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      // カスタムフォールバックUIが提供されている場合
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.resetError);
      }

      // デフォルトのエラーUI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8">
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mx-auto">
                <svg
                  className="h-6 w-6 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>

              <div className="mt-3 text-center">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  エラーが発生しました
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    {getUserFriendlyMessage(this.state.error)}
                  </p>
                </div>

                {process.env.NODE_ENV === 'development' && (
                  <details className="mt-4 text-left">
                    <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                      詳細情報（開発環境のみ）
                    </summary>
                    <div className="mt-2 space-y-2">
                      <div className="bg-gray-100 rounded p-2">
                        <p className="text-xs font-mono text-gray-700">
                          エラーID: {this.state.errorId}
                        </p>
                      </div>
                      <div className="bg-gray-100 rounded p-2">
                        <p className="text-xs font-semibold text-gray-700 mb-1">
                          エラーメッセージ:
                        </p>
                        <p className="text-xs font-mono text-gray-600">
                          {this.state.error.message}
                        </p>
                      </div>
                      {this.state.error.stack && (
                        <div className="bg-gray-100 rounded p-2">
                          <p className="text-xs font-semibold text-gray-700 mb-1">
                            スタックトレース:
                          </p>
                          <pre className="text-xs text-gray-600 overflow-x-auto">
                            {this.state.error.stack}
                          </pre>
                        </div>
                      )}
                      {this.state.errorInfo && (
                        <div className="bg-gray-100 rounded p-2">
                          <p className="text-xs font-semibold text-gray-700 mb-1">
                            コンポーネントスタック:
                          </p>
                          <pre className="text-xs text-gray-600 overflow-x-auto">
                            {this.state.errorInfo.componentStack}
                          </pre>
                        </div>
                      )}
                    </div>
                  </details>
                )}

                <div className="mt-5 space-y-2">
                  <button
                    type="button"
                    onClick={this.resetError}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm"
                  >
                    再試行
                  </button>
                  <button
                    type="button"
                    onClick={() => (window.location.href = '/')}
                    className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm"
                  >
                    ホームに戻る
                  </button>
                </div>
              </div>
            </div>

            <div className="text-center">
              <p className="text-xs text-gray-500">
                問題が続く場合は、サポートにお問い合わせください
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * エラーバウンダリフック
 * 関数コンポーネントでエラーバウンダリを使用するためのフック
 */
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const captureError = React.useCallback((error: Error) => {
    setError(error);
  }, []);

  return { resetError, captureError };
}
