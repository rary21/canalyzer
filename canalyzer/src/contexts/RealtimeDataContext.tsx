'use client';

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from 'react';
import { CANFrame } from '@/types/can';
import { useWebSocket } from '@/hooks/useWebSocket';
import { RealtimeDataContextType, RealtimeStats } from '@/types/websocket';

const RealtimeDataContext = createContext<RealtimeDataContextType | null>(null);

interface RealtimeDataProviderProps {
  children: React.ReactNode;
}

const MAX_HISTORICAL_POINTS = 1000; // メッセージIDごとの最大履歴保持数

export function RealtimeDataProvider({ children }: RealtimeDataProviderProps) {
  // WebSocket接続
  const {
    status,
    isConnected,
    lastFrame,
    connect,
    startStreaming,
    stopStreaming,
    subscribe,
    unsubscribe,
  } = useWebSocket();

  // ローカル状態
  const [isStreaming, setIsStreaming] = useState(false);
  const [pendingStart, setPendingStart] = useState(false); // 接続待ちフラグ
  const [currentData, setCurrentData] = useState<Map<number, CANFrame>>(
    new Map()
  );
  const [historicalData, setHistoricalData] = useState<Map<number, CANFrame[]>>(
    new Map()
  );
  const [stats, setStats] = useState<RealtimeStats>({
    totalFrames: 0,
    framesPerSecond: 0,
    uniqueMessages: 0,
    connectionUptime: 0,
    lastUpdate: 0,
    dataPoints: {},
  });

  // フレーム受信時の処理
  useEffect(() => {
    if (!lastFrame) return;

    const messageId = lastFrame.id;
    const timestamp = Date.now();

    // 現在のデータを更新
    setCurrentData((prev) => {
      const newMap = new Map(prev);
      newMap.set(messageId, lastFrame);
      return newMap;
    });

    // 履歴データを更新
    setHistoricalData((prev) => {
      const newMap = new Map(prev);
      const existing = newMap.get(messageId) || [];
      const updated = [...existing, lastFrame];

      // 最大履歴数を超える場合は古いデータを削除
      const trimmed =
        updated.length > MAX_HISTORICAL_POINTS
          ? updated.slice(-MAX_HISTORICAL_POINTS)
          : updated;

      newMap.set(messageId, trimmed);
      return newMap;
    });

    // 統計情報を更新
    setStats((prev) => {
      const newDataPoints = { ...prev.dataPoints };
      newDataPoints[messageId] = (newDataPoints[messageId] || 0) + 1;

      const totalFrames = prev.totalFrames + 1;
      const uniqueMessages = Object.keys(newDataPoints).length;

      // FPS計算（直近1秒間のフレーム数）
      const now = timestamp;
      const timeDiff = (now - prev.lastUpdate) / 1000;
      const framesPerSecond = timeDiff > 0 ? Math.round(1 / timeDiff) : 0;

      return {
        totalFrames,
        framesPerSecond,
        uniqueMessages,
        connectionUptime: prev.connectionUptime,
        lastUpdate: now,
        dataPoints: newDataPoints,
      };
    });
  }, [lastFrame]);

  // 接続状態変更時の処理（ストリーミング開始の待機処理）
  useEffect(() => {
    if (isConnected && pendingStart) {
      // 接続完了時にストリーミングを開始
      startStreaming();
      setIsStreaming(true);
      setPendingStart(false);
    }
  }, [isConnected, pendingStart, startStreaming]);

  // 接続時間の更新
  useEffect(() => {
    if (!isConnected) return;

    const startTime = Date.now();
    const interval = setInterval(() => {
      setStats((prev) => ({
        ...prev,
        connectionUptime: Date.now() - startTime,
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [isConnected]);

  // リアルタイム開始
  const startRealtime = useCallback(async () => {
    if (!isConnected) {
      // 接続を開始し、完了時にストリーミングを開始するフラグを設定
      setPendingStart(true);
      connect();
    } else {
      // 既に接続済みの場合は即座にストリーミング開始
      startStreaming();
      setIsStreaming(true);
    }
  }, [isConnected, connect, startStreaming]);

  // リアルタイム停止
  const stopRealtime = useCallback(() => {
    stopStreaming();
    setIsStreaming(false);
    setPendingStart(false); // 待機フラグもリセット
  }, [stopStreaming]);

  const contextValue: RealtimeDataContextType = {
    // 接続状態
    isConnected,
    isStreaming,
    status,

    // データ
    currentData,
    historicalData,

    // 制御関数
    startRealtime,
    stopRealtime,
    subscribe,
    unsubscribe,

    // 統計情報
    stats,
  };

  return (
    <RealtimeDataContext.Provider value={contextValue}>
      {children}
    </RealtimeDataContext.Provider>
  );
}

export function useRealtimeData(): RealtimeDataContextType {
  const context = useContext(RealtimeDataContext);
  if (!context) {
    throw new Error(
      'useRealtimeData must be used within a RealtimeDataProvider'
    );
  }
  return context;
}
