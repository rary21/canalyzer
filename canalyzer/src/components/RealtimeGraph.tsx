'use client';

import React, { useMemo, useCallback } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { SelectableSignal, GraphDataPoint, GraphConfig } from '@/types/graph';

interface RealtimeGraphProps {
  /** グラフデータ */
  data: GraphDataPoint[];
  /** 選択されたシグナル */
  selectedSignals: SelectableSignal[];
  /** グラフ設定 */
  config: GraphConfig;
  /** ローディング状態 */
  isLoading?: boolean;
}

// メモ化されたリアルタイムグラフコンポーネント
const RealtimeGraph = React.memo(
  ({
    data,
    selectedSignals,
    config,
    isLoading = false,
  }: RealtimeGraphProps) => {
    // グラフデータの前処理
    const chartData = useMemo(() => {
      if (!data.length || !selectedSignals.length) return [];

      // 現在時刻から指定時間範囲のデータをフィルター
      const now = Date.now();
      const startTime = now - config.timeRange;

      return data
        .filter((point) => point.timestamp >= startTime)
        .map((point) => ({
          ...point,
          // タイムスタンプを相対時間（秒）に変換
          time: (point.timestamp - startTime) / 1000,
        }))
        .sort((a, b) => a.timestamp - b.timestamp);
    }, [data, config.timeRange, selectedSignals.length]);

    // Y軸の範囲計算
    const yAxisDomain = useMemo(() => {
      if (config.autoScale && chartData.length > 0) {
        const values: number[] = [];

        selectedSignals.forEach((signal) => {
          chartData.forEach((point) => {
            const value = point[signal.name as keyof typeof point];
            if (typeof value === 'number' && !isNaN(value)) {
              values.push(value);
            }
          });
        });

        if (values.length > 0) {
          const min = Math.min(...values);
          const max = Math.max(...values);
          const padding = (max - min) * 0.1; // 10%のパディング
          return [min - padding, max + padding];
        }
      }

      if (
        !config.autoScale &&
        typeof config.yAxisMin === 'number' &&
        typeof config.yAxisMax === 'number'
      ) {
        return [config.yAxisMin, config.yAxisMax];
      }

      return ['auto', 'auto'];
    }, [
      chartData,
      selectedSignals,
      config.autoScale,
      config.yAxisMin,
      config.yAxisMax,
    ]);

    // カスタムツールチップ（メモ化）
    const CustomTooltip = useCallback(
      ({
        active,
        payload,
        label,
      }: {
        active?: boolean;
        payload?: Array<{
          dataKey: string;
          value: number;
          color: string;
        }>;
        label?: string | number;
      }) => {
        if (!active || !payload || !payload.length) return null;

        return (
          <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
            <p className="text-sm font-medium text-gray-900 mb-2">
              時刻: {typeof label === 'number' ? label.toFixed(2) : label}秒
            </p>
            {payload.map((entry, index: number) => {
              const signal = selectedSignals.find(
                (s) => s.name === entry.dataKey
              );
              return (
                <p
                  key={index}
                  className="text-sm"
                  style={{ color: entry.color }}
                >
                  <span className="font-medium">{entry.dataKey}:</span>{' '}
                  {typeof entry.value === 'number'
                    ? entry.value.toFixed(3)
                    : entry.value}
                  {signal?.unit && ` ${signal.unit}`}
                </p>
              );
            })}
          </div>
        );
      },
      [selectedSignals]
    );

    // ローディング状態
    if (isLoading) {
      return (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">グラフデータを読み込み中...</p>
          </div>
        </div>
      );
    }

    // データなし
    if (!chartData.length || !selectedSignals.length) {
      return (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 text-gray-300">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <p className="text-lg font-medium text-gray-900 mb-2">
              グラフデータなし
            </p>
            <p className="text-gray-600">
              {!selectedSignals.length
                ? 'シグナルを選択してください'
                : 'データが存在しないか、指定された時間範囲にデータがありません'}
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-lg shadow-sm border">
        {/* ヘッダー */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                リアルタイムグラフ
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                過去{config.timeRange / 1000}秒間のデータ（{chartData.length}
                ポイント）
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-600">リアルタイム更新中</span>
            </div>
          </div>
        </div>

        {/* グラフ */}
        <div className="p-4">
          <div style={{ width: '100%', height: '400px' }}>
            <ResponsiveContainer>
              <LineChart
                data={chartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                {config.showGrid && (
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                )}
                <XAxis
                  dataKey="time"
                  stroke="#6b7280"
                  fontSize={12}
                  tickFormatter={(value) => `${value.toFixed(1)}s`}
                  domain={[0, config.timeRange / 1000]}
                />
                <YAxis
                  stroke="#6b7280"
                  fontSize={12}
                  domain={yAxisDomain}
                  tickFormatter={(value) => {
                    if (typeof value === 'number') {
                      return value.toFixed(1);
                    }
                    return value;
                  }}
                />
                {config.showTooltip && <Tooltip content={<CustomTooltip />} />}
                {config.showLegend && (
                  <Legend
                    wrapperStyle={{
                      paddingTop: '20px',
                      fontSize: '14px',
                    }}
                  />
                )}
                {selectedSignals.map((signal) => (
                  <Line
                    key={signal.name}
                    type="monotone"
                    dataKey={signal.name}
                    stroke={signal.color}
                    strokeWidth={2}
                    dot={false}
                    connectNulls={false}
                    animationDuration={300}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 統計情報 */}
        {selectedSignals.length > 0 && chartData.length > 0 && (
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <h4 className="text-sm font-medium text-gray-700 mb-2">現在値</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {selectedSignals.map((signal) => {
                const latestDataPoint = chartData[chartData.length - 1];
                const currentValue = latestDataPoint
                  ? latestDataPoint[signal.name as keyof typeof latestDataPoint]
                  : undefined;

                return (
                  <div
                    key={signal.name}
                    className="flex items-center space-x-2 text-sm"
                  >
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: signal.color }}
                    />
                    <span className="font-medium text-gray-700">
                      {signal.name}:
                    </span>
                    <span className="text-gray-900">
                      {typeof currentValue === 'number'
                        ? currentValue.toFixed(3)
                        : 'N/A'}
                    </span>
                    <span className="text-gray-500">{signal.unit}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }
);

RealtimeGraph.displayName = 'RealtimeGraph';

export default RealtimeGraph;
