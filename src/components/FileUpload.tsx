'use client';

import { useState } from 'react';
import Link from 'next/link';
import { DBCParser } from '@/lib/dbc-parser';
import { ParseResult } from '@/types/dbc';
import { useDBCContext } from '@/contexts/DBCContext';
import { useNavigation } from '@/hooks/useNavigation';
import {
  InvalidFileFormatError,
  getUserFriendlyMessage,
  ErrorMessages,
} from '@/utils/errors';

export default function FileUpload() {
  const [fileName, setFileName] = useState<string>('');
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [loading, setLoading] = useState(false);
  const {
    setDBCData,
    setParseResult: setContextParseResult,
    setFileName: setContextFileName,
  } = useDBCContext();
  const {
    autoNavigate,
    setAutoNavigate,
    isNavigating,
    navigateWithDelay,
    resetNavigation,
  } = useNavigation();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // DBCファイルかチェック
    if (!file.name.toLowerCase().endsWith('.dbc')) {
      const error = new InvalidFileFormatError(
        'DBC',
        file.name.split('.').pop(),
        file.name
      );
      setParseResult({
        success: false,
        errors: [
          {
            line: 0,
            message: getUserFriendlyMessage(error),
            type: 'FILE_FORMAT_ERROR',
          },
        ],
        warnings: [],
      });
      return;
    }

    // ファイルサイズチェック（10MB以下）
    const maxFileSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxFileSize) {
      setParseResult({
        success: false,
        errors: [
          {
            line: 0,
            message: ErrorMessages.FILE_TOO_LARGE,
            type: 'FILE_SIZE_ERROR',
          },
        ],
        warnings: [],
      });
      return;
    }

    // ナビゲーション状態をリセット
    resetNavigation();
    setFileName(file.name);
    setLoading(true);

    try {
      // ファイル内容を読み込む
      const content = await file.text();

      // DBCファイルをパース
      const parser = new DBCParser();
      const result = parser.parse(content);
      setParseResult(result);
      setContextParseResult(result);
      setContextFileName(file.name);

      // パース成功時はDBCデータをコンテキストに保存
      if (result.success && result.database) {
        setDBCData(result.database);

        // 自動遷移が有効な場合、グラフページへ遷移
        if (autoNavigate) {
          navigateWithDelay('/graph');
        }
      }

      console.log('パース結果:', result);
    } catch (error) {
      console.error('ファイル読み込みエラー:', error);

      let errorMessage: string = ErrorMessages.FILE_READ_ERROR;
      if (error instanceof Error) {
        errorMessage = getUserFriendlyMessage(error);
      }

      setParseResult({
        success: false,
        errors: [
          {
            line: 0,
            message: errorMessage,
            type: 'FILE_READ_ERROR',
          },
        ],
        warnings: [],
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl">
      <label className="block">
        <span className="text-gray-700 text-sm font-medium mb-2 block">
          DBCファイルを選択
        </span>
        <input
          type="file"
          accept=".dbc"
          onChange={handleFileChange}
          disabled={loading}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100
            cursor-pointer
            disabled:opacity-50"
        />
      </label>

      {loading && (
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">読み込み中...</p>
        </div>
      )}

      {parseResult && (
        <div className="mt-6 space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-2">パース結果</h3>
            <p className="text-sm text-gray-700">
              <span className="font-medium">ファイル:</span> {fileName}
            </p>
            <p className="text-sm text-gray-700">
              <span className="font-medium">ステータス:</span>{' '}
              {parseResult.success ? (
                <span className="text-green-600">成功</span>
              ) : (
                <span className="text-red-600">エラーあり</span>
              )}
            </p>
          </div>

          {parseResult.database && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold mb-2">データベース情報</h3>
              <p className="text-sm text-gray-700">
                <span className="font-medium">メッセージ数:</span>{' '}
                {parseResult.database.messages.size}
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-medium">ノード数:</span>{' '}
                {parseResult.database.nodes.length}
              </p>

              {/* 自動遷移設定 */}
              {!isNavigating ? (
                <div className="mt-3 flex items-center">
                  <input
                    type="checkbox"
                    id="autoNavigate"
                    checked={autoNavigate}
                    onChange={(e) => setAutoNavigate(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  />
                  <label
                    htmlFor="autoNavigate"
                    className="ml-2 text-sm text-gray-700"
                  >
                    アップロード後、自動的にグラフページへ移動
                  </label>
                </div>
              ) : (
                <div className="mt-3 p-3 bg-green-50 rounded-lg flex items-center">
                  <svg
                    className="animate-spin h-5 w-5 text-green-600 mr-3"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span className="text-sm text-green-700">
                    グラフページへ移動中...
                  </span>
                </div>
              )}

              {parseResult.database.messages.size > 0 && (
                <div className="mt-3">
                  <h4 className="text-sm font-medium mb-1">
                    メッセージ一覧（最初の5件）:
                  </h4>
                  <ul className="text-xs space-y-1 mb-3">
                    {Array.from(parseResult.database.messages.values())
                      .slice(0, 5)
                      .map((msg) => (
                        <li key={msg.id} className="text-gray-600">
                          ID: {msg.id} - {msg.name} ({msg.signals.length}{' '}
                          シグナル)
                        </li>
                      ))}
                  </ul>

                  <div className="flex space-x-2">
                    <Link
                      href="/info"
                      className="inline-flex items-center px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                    >
                      DBC情報を表示 →
                    </Link>
                    <Link
                      href="/values"
                      className="inline-flex items-center px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                    >
                      CAN値を表示 →
                    </Link>
                    <Link
                      href="/graph"
                      className="inline-flex items-center px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 transition-colors"
                    >
                      グラフ表示 →
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}

          {parseResult.errors.length > 0 && (
            <div className="p-4 bg-red-50 rounded-lg">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    エラーが発生しました
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    <ul className="list-disc pl-5 space-y-1">
                      {parseResult.errors.map((error, index) => (
                        <li key={index}>
                          {error.line > 0 ? `行 ${error.line}: ` : ''}
                          {error.message}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
