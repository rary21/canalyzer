'use client';

import { useDBCContext } from '@/contexts/DBCContext';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import TabNavigation from '@/components/TabNavigation';
import SignalSelector from '@/components/SignalSelector';
import RealtimeGraph from '@/components/RealtimeGraph';
import GraphSettings from '@/components/GraphSettings';
import { useRealtimeGraph } from '@/hooks/useRealtimeGraph';
import { CANParser } from '@/lib/can-parser';
import { CANValue, CANFrame } from '@/types/can';
import { useRealtimeData } from '@/contexts/RealtimeDataContext';

export default function GraphPage() {
  const { dbcData } = useDBCContext();
  const [canValues, setCanValues] = useState<CANValue[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dataMode, setDataMode] = useState<'static' | 'realtime'>('static');

  // リアルタイムデータのフック
  const { historicalData, isConnected, isStreaming } = useRealtimeData();

  // 使用するDBCデータを決定
  const activeDBCData = useMemo(() => {
    console.log('activeDBCData算出:', {
      dbcData: !!dbcData,
    });
    const result = dbcData;
    console.log('activeDBCData結果:', !!result);
    if (result) {
      console.log('Messages count:', result.messages?.size || 0);
    }
    return result;
  }, [dbcData]);

  // リアルタイムグラフのフック
  const {
    graphState,
    statistics,
    updateSelectedSignals,
    updateGraphConfig,
    toggleRealTimeUpdate,
    refreshData,
    // clearGraphData,
    // isDataAvailable
  } = useRealtimeGraph({
    canValues,
    initialConfig: {
      timeRange: 10000, // 10秒
      updateInterval: 250, // 250ms
    },
  });

  // 静的データのパース
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
      const processedTimestamps = new Set<string>();

      // 履歴データから全フレームを収集（最新のデータを含む）
      const allFrames: CANFrame[] = [];

      // historicalDataから全ての履歴フレームを収集
      historicalData.forEach((frames) => {
        allFrames.push(...frames);
      });

      // タイムスタンプでソート（新しい順）
      allFrames.sort((a, b) => b.timestamp - a.timestamp);

      // 重複を避けつつ、各フレームを解析
      for (const frame of allFrames) {
        const frameKey = `${frame.id}-${frame.timestamp}`;
        if (processedTimestamps.has(frameKey)) continue;
        processedTimestamps.add(frameKey);

        const analysis = parser.parseFrame(frame);
        if (!analysis.error && analysis.signals.length > 0) {
          realtimeValues.push(...analysis.signals);
        }
      }

      console.log(`解析されたシグナル値の総数: ${realtimeValues.length}`);
      console.log(`処理されたフレーム数: ${processedTimestamps.size}`);
      setCanValues(realtimeValues);
    } catch (error) {
      console.error('リアルタイムCANデータの解析に失敗しました:', error);
    }
  }, [activeDBCData, dataMode, historicalData, isConnected]);

  // データモードの切り替え
  useEffect(() => {
    if (isStreaming && dataMode === 'static') {
      setDataMode('realtime');
    } else if (!isStreaming && dataMode === 'realtime') {
      setDataMode('static');
    }
  }, [isStreaming, dataMode]);

  // DBCデータがない場合の表示
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
                リアルタイムグラフ
              </h1>
              <p className="text-gray-600 mb-8">
                グラフを表示するには、DBCファイルが必要です
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
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              リアルタイムグラフ
            </h1>
            <p className="text-gray-600 mt-1">
              {dataMode === 'realtime'
                ? 'リアルタイムデータ'
                : 'アップロードされたDBC'}{' '}
              を使用したシグナル時系列表示
            </p>
          </div>

          <div className="flex items-center space-x-4">
            {/* データモード切り替え */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setDataMode('static')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  dataMode === 'static'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                静的データ
              </button>
              <button
                onClick={() => setDataMode('realtime')}
                disabled={!isConnected}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  dataMode === 'realtime'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50'
                }`}
              >
                リアルタイム
                {isStreaming && (
                  <span className="ml-2 inline-block w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                )}
              </button>
            </div>

            {/* データ更新ボタン */}
            <button
              onClick={refreshData}
              disabled={isLoading}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <svg
                className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              データ更新
            </button>

            <Link
              href="/values"
              className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              データ表示
            </Link>
          </div>
        </div>

        {/* 統計情報 */}
        {canValues.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
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

            <div className="bg-white p-6 rounded-lg shadow-sm border">
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
                      d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                    />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">
                    選択中のシグナル
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {graphState.selectedSignals.length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
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
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">
                    データポイント
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {graphState.data.length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      dataMode === 'realtime' && isStreaming
                        ? 'bg-green-500 animate-pulse'
                        : graphState.realTimeEnabled
                          ? 'bg-blue-500'
                          : 'bg-gray-400'
                    }`}
                  ></div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">
                    {dataMode === 'realtime' ? 'WebSocket接続' : 'グラフ更新'}
                  </p>
                  <p className="text-lg font-semibold text-gray-900">
                    {dataMode === 'realtime'
                      ? isStreaming
                        ? 'ストリーミング中'
                        : isConnected
                          ? '接続済み'
                          : '未接続'
                      : graphState.realTimeEnabled
                        ? '有効'
                        : '無効'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* メインコンテンツ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 左側：シグナル選択とグラフ設定 */}
          <div className="space-y-6">
            {/* シグナル選択 */}
            <SignalSelector
              availableSignals={canValues}
              selectedSignals={graphState.selectedSignals}
              onSelectionChange={updateSelectedSignals}
              maxSelection={5}
            />

            {/* グラフ設定 */}
            <GraphSettings
              config={graphState.config}
              onConfigChange={updateGraphConfig}
              realTimeEnabled={graphState.realTimeEnabled}
              onRealTimeToggle={toggleRealTimeUpdate}
            />
          </div>

          {/* 右側：グラフ表示 */}
          <div className="lg:col-span-2">
            <RealtimeGraph
              data={graphState.data}
              selectedSignals={graphState.selectedSignals}
              config={graphState.config}
              isLoading={graphState.isLoading}
            />
          </div>
        </div>

        {/* 統計情報（詳細） */}
        {statistics && Object.keys(statistics).length > 0 && (
          <div className="mt-8">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  シグナル統計
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  選択されたシグナルの詳細統計情報
                </p>
              </div>
              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          シグナル名
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          現在値
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          最小値
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          最大値
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          平均値
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          データ数
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {Object.entries(statistics).map(([signalName, stats]) => {
                        const signal = graphState.selectedSignals.find(
                          (s) => s.name === signalName
                        );
                        return (
                          <tr key={signalName}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              <div className="flex items-center">
                                <div
                                  className="w-3 h-3 rounded-full mr-2"
                                  style={{ backgroundColor: signal?.color }}
                                />
                                {signalName}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <span className="font-mono">
                                {stats.current !== null
                                  ? stats.current.toFixed(3)
                                  : 'N/A'}
                              </span>
                              <span className="ml-1 text-gray-500">
                                {signal?.unit}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <span className="font-mono">
                                {stats.min.toFixed(3)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <span className="font-mono">
                                {stats.max.toFixed(3)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <span className="font-mono">
                                {stats.avg.toFixed(3)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {stats.count}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
