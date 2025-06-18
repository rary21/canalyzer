'use client';

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import { CANFrame } from '@/types/can';
import { useWebSocket } from '@/hooks/useWebSocket';
import { RealtimeDataContextType, RealtimeStats } from '@/types/websocket';
import { throttleWithCancel } from '@/lib/throttle';

const RealtimeDataContext = createContext<RealtimeDataContextType | null>(null);

interface RealtimeDataProviderProps {
  children: React.ReactNode;
}

const MAX_HISTORICAL_POINTS = 1000; // メッセージIDごとの最大履歴保持数
const STATS_UPDATE_INTERVAL = 100; // 統計情報の更新間隔（ms）
const DATA_UPDATE_INTERVAL = 50; // データ更新のスロットル間隔（ms）

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

  // バッファリング用のrefs
  const frameBufferRef = useRef<Map<number, CANFrame>>(new Map());
  const throttledUpdateRef = useRef<ReturnType<
    typeof throttleWithCancel
  > | null>(null);
  const throttledStatsUpdateRef = useRef<ReturnType<
    typeof throttleWithCancel
  > | null>(null);

  // スロットルされたデータ更新処理
  const updateDataThrottled = useCallback(() => {
    const bufferedFrames = frameBufferRef.current;
    if (bufferedFrames.size === 0) return;

    // 現在のデータを一括更新
    setCurrentData((prev) => {
      const newMap = new Map(prev);
      bufferedFrames.forEach((frame, messageId) => {
        newMap.set(messageId, frame);
      });
      return newMap;
    });

    // 履歴データを一括更新
    setHistoricalData((prev) => {
      const newMap = new Map(prev);
      bufferedFrames.forEach((frame, messageId) => {
        const existing = newMap.get(messageId) || [];
        const updated = [...existing, frame];
        const trimmed =
          updated.length > MAX_HISTORICAL_POINTS
            ? updated.slice(-MAX_HISTORICAL_POINTS)
            : updated;
        newMap.set(messageId, trimmed);
      });
      return newMap;
    });

    // バッファをクリア
    frameBufferRef.current = new Map();
  }, []);

  // スロットルされた統計情報更新処理
  const updateStatsThrottled = useCallback((...args: unknown[]) => {
    const frameCount = args[0] as number;
    const timestamp = Date.now();
    setStats((prev) => {
      const totalFrames = prev.totalFrames + frameCount;
      const timeDiff = (timestamp - prev.lastUpdate) / 1000;
      const framesPerSecond =
        timeDiff > 0 ? Math.round(frameCount / timeDiff) : 0;

      return {
        ...prev,
        totalFrames,
        framesPerSecond,
        lastUpdate: timestamp,
      };
    });
  }, []);

  // スロットル関数の初期化
  useEffect(() => {
    throttledUpdateRef.current = throttleWithCancel(
      updateDataThrottled,
      DATA_UPDATE_INTERVAL
    );
    throttledStatsUpdateRef.current = throttleWithCancel(
      updateStatsThrottled,
      STATS_UPDATE_INTERVAL
    );

    return () => {
      throttledUpdateRef.current?.cancel();
      throttledStatsUpdateRef.current?.cancel();
    };
  }, [updateDataThrottled, updateStatsThrottled]);

  // フレーム受信時の処理
  useEffect(() => {
    if (!lastFrame) return;

    const messageId = lastFrame.id;

    // バッファに追加
    frameBufferRef.current.set(messageId, lastFrame);

    // スロットルされた更新を実行
    throttledUpdateRef.current?.throttled();
    throttledStatsUpdateRef.current?.throttled(1);

    // データポイントの更新（スロットルなし）
    setStats((prev) => {
      const newDataPoints = { ...prev.dataPoints };
      newDataPoints[messageId] = (newDataPoints[messageId] || 0) + 1;
      const uniqueMessages = Object.keys(newDataPoints).length;

      return {
        ...prev,
        uniqueMessages,
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

    // スロットルされた更新を即座に実行
    if (frameBufferRef.current.size > 0) {
      updateDataThrottled();
    }
  }, [stopStreaming, updateDataThrottled]);

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
