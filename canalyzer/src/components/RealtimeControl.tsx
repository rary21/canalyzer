'use client';

import React from 'react';
import { useRealtimeData } from '@/contexts/RealtimeDataContext';

interface RealtimeControlProps {
  className?: string;
}

export function RealtimeControl({ className = '' }: RealtimeControlProps) {
  const {
    isConnected,
    isStreaming,
    status,
    stats,
    startRealtime,
    stopRealtime,
  } = useRealtimeData();

  const getStatusColor = () => {
    switch (status) {
      case 'connected':
        return 'text-green-600';
      case 'connecting':
        return 'text-yellow-600';
      case 'disconnected':
        return 'text-gray-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'connected':
        return '●';
      case 'connecting':
        return '◐';
      case 'disconnected':
        return '○';
      case 'error':
        return '✕';
      default:
        return '○';
    }
  };

  const formatUptime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}:${(minutes % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
    }
    return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          リアルタイム制御
        </h2>
        <div className="flex items-center space-x-2">
          <span className={`text-sm font-medium ${getStatusColor()}`}>
            {getStatusIcon()}{' '}
            {status === 'connected'
              ? '接続中'
              : status === 'connecting'
                ? '接続中...'
                : status === 'disconnected'
                  ? '切断'
                  : 'エラー'}
          </span>
        </div>
      </div>

      {/* 制御ボタン */}
      <div className="flex space-x-3 mb-6">
        {!isStreaming ? (
          <button
            onClick={startRealtime}
            disabled={status === 'connecting'}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {status === 'connecting' ? '接続中...' : 'リアルタイム開始'}
          </button>
        ) : (
          <button
            onClick={stopRealtime}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            リアルタイム停止
          </button>
        )}
      </div>

      {/* 統計情報 */}
      {isConnected && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-600">
              {stats.totalFrames}
            </div>
            <div className="text-sm text-gray-600">総フレーム数</div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-600">
              {stats.framesPerSecond}
            </div>
            <div className="text-sm text-gray-600">FPS</div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-purple-600">
              {stats.uniqueMessages}
            </div>
            <div className="text-sm text-gray-600">メッセージ種類</div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-orange-600">
              {formatUptime(stats.connectionUptime)}
            </div>
            <div className="text-sm text-gray-600">接続時間</div>
          </div>
        </div>
      )}

      {/* メッセージ別統計 */}
      {isConnected && Object.keys(stats.dataPoints).length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-3">
            メッセージ別受信数
          </h3>
          <div className="space-y-2">
            {Object.entries(stats.dataPoints)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 5)
              .map(([messageId, count]) => (
                <div
                  key={messageId}
                  className="flex justify-between items-center"
                >
                  <span className="text-sm text-gray-600">
                    0x
                    {parseInt(messageId)
                      .toString(16)
                      .toUpperCase()
                      .padStart(3, '0')}
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    {count}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* エラー状態の場合の説明 */}
      {status === 'error' && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-sm text-red-800">
            WebSocket接続でエラーが発生しました。サーバーが起動しているか確認してください。
          </div>
        </div>
      )}

      {/* 未接続状態の場合の説明 */}
      {status === 'disconnected' && !isStreaming && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-sm text-blue-800">
            「リアルタイム開始」ボタンをクリックして、仮想CANデータの受信を開始してください。
          </div>
        </div>
      )}
    </div>
  );
}
