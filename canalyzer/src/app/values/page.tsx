'use client';

import { useDBCContext } from '@/contexts/DBCContext';
import { useRealtimeData } from '@/contexts/RealtimeDataContext';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import TabNavigation from '@/components/TabNavigation';
import CANValuesDisplay from '@/components/CANValuesDisplay';
import { RealtimeControl } from '@/components/RealtimeControl';
import { CANParser } from '@/lib/can-parser';
import { CANValue, CANFrame } from '@/types/can';

export default function ValuesPage() {
  const { dbcData, fileName: dbcFileName } = useDBCContext();
  const { currentData, isConnected, isStreaming } = useRealtimeData();
  const [canValues, setCanValues] = useState<CANValue[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dataMode, setDataMode] = useState<'static' | 'realtime'>('static');
  const [unmappedFrames, setUnmappedFrames] = useState<Map<number, CANFrame>>(
    new Map()
  );

  // 使用するDBCデータを決定
  const activeDBCData = useMemo(() => {
    return dbcData;
  }, [dbcData]);

  // 静的データからCANシグナル値を抽出
  useEffect(() => {
    if (!activeDBCData || dataMode !== 'static') {
      if (dataMode === 'static') {
        setCanValues([]);
      }
      return;
    }

    // 静的データモードではデータをクリア
    setCanValues([]);
    setIsLoading(false);
  }, [activeDBCData, dataMode]);

  // リアルタイムデータからCANシグナル値を抽出
  useEffect(() => {
    if (!activeDBCData || dataMode !== 'realtime' || !isConnected) {
      return;
    }

    try {
      const parser = new CANParser(activeDBCData);
      const realtimeValues: CANValue[] = [];

      // デバッグ用: DBCに定義されているメッセージIDを取得
      const dbcMessageIds = Array.from(activeDBCData.messages.keys());
      console.log(
        'DBC定義メッセージID:',
        dbcMessageIds.map((id) => `0x${id.toString(16).toUpperCase()}`)
      );

      // デバッグ用: 受信フレームのIDを取得
      const receivedIds = Array.from(currentData.keys());
      console.log(
        '受信フレームID:',
        receivedIds.map((id) => `0x${id.toString(16).toUpperCase()}`)
      );

      // 現在のフレームデータを解析
      const newUnmappedFrames = new Map<number, CANFrame>();

      currentData.forEach((frame) => {
        const analysis = parser.parseFrame(frame);

        // デバッグ用: 各フレームの解析結果を出力
        if (analysis.error) {
          console.warn(
            `フレーム解析エラー (ID: 0x${frame.id.toString(16).toUpperCase()}):`,
            analysis.error
          );
          // DBCに定義されていないフレームを記録
          newUnmappedFrames.set(frame.id, frame);
        } else {
          console.log(
            `フレーム解析成功 (ID: 0x${frame.id.toString(16).toUpperCase()}, メッセージ: ${analysis.messageName}, シグナル数: ${analysis.signals.length})`
          );
        }

        if (!analysis.error && analysis.signals.length > 0) {
          realtimeValues.push(...analysis.signals);
        }
      });

      console.log(`解析されたシグナル値の総数: ${realtimeValues.length}`);
      setCanValues(realtimeValues);
      setUnmappedFrames(newUnmappedFrames);
    } catch (error) {
      console.error('リアルタイムCANデータの解析に失敗しました:', error);
    }
  }, [activeDBCData, dataMode, currentData, isConnected]);

  // データモードの切り替え
  useEffect(() => {
    if (isStreaming && dataMode === 'static') {
      setDataMode('realtime');
    } else if (!isStreaming && dataMode === 'realtime') {
      setDataMode('static');
    }
  }, [isStreaming, dataMode]);

  if (!activeDBCData) {
    return (
      <main className="min-h-screen bg-gray-50">
        <TabNavigation />
        <div className="container mx-auto px-4 py-8">
          <div className="flex min-h-[60vh] flex-col items-center justify-center">
            <div className="text-center max-w-md">
              <div className="w-16 h-16 mx-auto mb-6 text-gray-400">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                CAN値表示
              </h1>
              <p className="text-gray-600 mb-8">
                CANシグナル値を表示するには、DBCファイルが必要です
              </p>

              <div className="space-y-4">
                <Link
                  href="/"
                  className="w-full inline-flex items-center justify-center px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                    />
                  </svg>
                  DBCファイルをアップロード
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <TabNavigation />

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">CAN値表示</h1>
            <p className="text-gray-600 mt-1">
              {dataMode === 'realtime'
                ? 'リアルタイムCANデータを表示中'
                : 'アップロードされたDBCを使用してCANフレームを解析'}
            </p>
          </div>

          <div className="flex items-center space-x-4">
            {/* リアルタイムモード表示 */}
            {dataMode === 'realtime' && (
              <span className="inline-flex items-center px-3 py-2 rounded-full text-sm font-medium bg-green-100 text-green-800">
                <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
                リアルタイム
              </span>
            )}

            <Link
              href="/"
              className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              ← ホームに戻る
            </Link>
          </div>
        </div>

        {/* リアルタイム制御パネル */}
        <RealtimeControl className="mb-8" />

        {/* DBC情報パネル（リアルタイムモード時のみ表示） */}
        {dataMode === 'realtime' && activeDBCData && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              DBC情報
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* DBCファイル情報 */}
              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-3">
                  使用中のDBCファイル
                </h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-2">ファイル名:</p>
                  <p className="font-mono text-sm bg-white px-2 py-1 rounded border">
                    {dbcFileName || 'アップロードされたDBC'}
                  </p>

                  <p className="text-sm text-gray-600 mb-2 mt-4">
                    定義済みメッセージID:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {Array.from(activeDBCData.messages.keys()).map((id) => (
                      <span
                        key={id}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        0x{id.toString(16).toUpperCase().padStart(3, '0')}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* 受信メッセージ情報 */}
              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-3">
                  受信中のメッセージ
                </h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-2">
                    定義済みメッセージ:
                  </p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {Array.from(currentData.keys())
                      .filter((id) => activeDBCData.messages.has(id))
                      .map((id) => (
                        <span
                          key={id}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
                        >
                          0x{id.toString(16).toUpperCase().padStart(3, '0')}
                        </span>
                      ))}
                  </div>

                  {unmappedFrames.size > 0 && (
                    <>
                      <p className="text-sm text-gray-600 mb-2">
                        未定義メッセージ ({unmappedFrames.size}件):
                      </p>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {Array.from(unmappedFrames.keys()).map((id) => (
                          <span
                            key={id}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800"
                          >
                            0x{id.toString(16).toUpperCase().padStart(3, '0')}
                          </span>
                        ))}
                      </div>

                      <div className="mt-4">
                        <p className="text-sm text-gray-600 mb-2">
                          未定義メッセージの詳細:
                        </p>
                        <div className="max-h-40 overflow-y-auto bg-white border rounded p-2">
                          {Array.from(unmappedFrames.entries()).map(
                            ([id, frame]) => (
                              <div
                                key={id}
                                className="text-xs font-mono mb-2 pb-2 border-b border-gray-100 last:border-b-0"
                              >
                                <div className="flex justify-between items-center mb-1">
                                  <span className="font-semibold">
                                    ID: 0x
                                    {id
                                      .toString(16)
                                      .toUpperCase()
                                      .padStart(3, '0')}
                                  </span>
                                  <span className="text-gray-500">
                                    DLC: {frame.dlc}
                                  </span>
                                </div>
                                <div className="text-gray-600">
                                  データ:{' '}
                                  {Array.from(frame.data)
                                    .map((b) =>
                                      b
                                        .toString(16)
                                        .toUpperCase()
                                        .padStart(2, '0')
                                    )
                                    .join(' ')}
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  {unmappedFrames.size === 0 &&
                    Array.from(currentData.keys()).length === 0 && (
                      <p className="text-sm text-gray-500 italic">
                        メッセージを受信していません
                      </p>
                    )}
                </div>
              </div>
            </div>

            {/* 問題解決のガイダンス */}
            {unmappedFrames.size > 0 && (
              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-yellow-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      未定義メッセージが検出されました
                    </h3>
                    <p className="mt-1 text-sm text-yellow-700">
                      上記の未定義メッセージIDをDBCファイルに追加することで、これらのCANフレームも解析・表示できるようになります。
                      または、WebSocketサーバーから送信されるメッセージIDがDBCファイルの定義と一致するように調整してください。
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 統計情報 */}
        {canValues.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg card-shadow border">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg
                    className="h-8 w-8 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">
                    総シグナル数
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {canValues.length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg card-shadow border">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg
                    className="h-8 w-8 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">
                    ユニークシグナル
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {new Set(canValues.map((v) => v.signalName)).size}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg card-shadow border">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg
                    className="h-8 w-8 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                    />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">時間範囲</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {canValues.length > 0
                      ? `${Math.max(...canValues.map((v) => v.timestamp)) - Math.min(...canValues.map((v) => v.timestamp))}ms`
                      : '0ms'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg card-shadow border">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg
                    className="h-8 w-8 text-orange-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
                    />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">
                    データソース
                  </p>
                  <p className="text-lg font-semibold text-gray-900">
                    {dataMode === 'realtime' ? 'リアルタイム' : 'アップロード'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CANValuesDisplayコンポーネント */}
        <CANValuesDisplay values={canValues} isLoading={isLoading} />
      </div>
    </main>
  );
}
