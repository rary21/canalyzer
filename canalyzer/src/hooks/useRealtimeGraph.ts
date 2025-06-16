'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  SelectableSignal,
  GraphDataPoint,
  GraphConfig,
  GraphState,
  DEFAULT_GRAPH_CONFIG,
} from '@/types/graph';
import { CANValue } from '@/types/can';

interface UseRealtimeGraphProps {
  /** 利用可能なCANシグナル値 */
  canValues: CANValue[];
  /** グラフの初期設定 */
  initialConfig?: Partial<GraphConfig>;
}

export function useRealtimeGraph({
  canValues,
  initialConfig = {},
}: UseRealtimeGraphProps) {
  // グラフ状態
  const [graphState, setGraphState] = useState<GraphState>({
    selectedSignals: [],
    data: [],
    config: { ...DEFAULT_GRAPH_CONFIG, ...initialConfig },
    realTimeEnabled: false,
    isLoading: false,
  });

  // リアルタイム更新用のタイマー参照
  const updateTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateTimeRef = useRef<number>(0);

  // データポイントのマップ（高速検索用）
  const dataPointsMapRef = useRef<Map<number, GraphDataPoint>>(new Map());

  // シグナル選択の変更
  const updateSelectedSignals = useCallback((signals: SelectableSignal[]) => {
    setGraphState((prev) => ({
      ...prev,
      selectedSignals: signals,
    }));
  }, []);

  // グラフ設定の変更
  const updateGraphConfig = useCallback((config: GraphConfig) => {
    setGraphState((prev) => ({
      ...prev,
      config,
    }));
  }, []);

  // リアルタイム更新の切り替え
  const toggleRealTimeUpdate = useCallback((enabled: boolean) => {
    setGraphState((prev) => ({
      ...prev,
      realTimeEnabled: enabled,
    }));
  }, []);

  // CANデータからグラフデータポイントを生成
  const generateGraphDataPoints = useCallback(
    (
      values: CANValue[],
      selectedSignals: SelectableSignal[]
    ): GraphDataPoint[] => {
      if (!selectedSignals.length || !values.length) return [];

      const signalNames = new Set(selectedSignals.map((s) => s.name));
      const dataMap = new Map<number, GraphDataPoint>();

      // タイムスタンプごとにデータをグループ化
      values.forEach((value) => {
        if (!signalNames.has(value.signalName)) return;

        const timestamp = value.timestamp;
        const existingPoint = dataMap.get(timestamp) || { timestamp };
        existingPoint[value.signalName] = value.physicalValue;
        dataMap.set(timestamp, existingPoint);
      });

      return Array.from(dataMap.values()).sort(
        (a, b) => a.timestamp - b.timestamp
      );
    },
    []
  );

  // データの更新処理
  const updateGraphData = useCallback(() => {
    if (!graphState.selectedSignals.length) {
      setGraphState((prev) => ({ ...prev, data: [] }));
      return;
    }

    const newDataPoints = generateGraphDataPoints(
      canValues,
      graphState.selectedSignals
    );

    setGraphState((prev) => ({
      ...prev,
      data: newDataPoints,
    }));

    lastUpdateTimeRef.current = Date.now();
  }, [canValues, graphState.selectedSignals, generateGraphDataPoints]);

  // 初回データ読み込み
  useEffect(() => {
    updateGraphData();
  }, [updateGraphData]);

  // リアルタイム更新の制御
  useEffect(() => {
    if (updateTimerRef.current) {
      clearInterval(updateTimerRef.current);
      updateTimerRef.current = null;
    }

    if (graphState.realTimeEnabled && graphState.selectedSignals.length > 0) {
      updateTimerRef.current = setInterval(() => {
        updateGraphData();
      }, graphState.config.updateInterval);
    }

    return () => {
      if (updateTimerRef.current) {
        clearInterval(updateTimerRef.current);
        updateTimerRef.current = null;
      }
    };
  }, [
    graphState.realTimeEnabled,
    graphState.config.updateInterval,
    graphState.selectedSignals.length,
    updateGraphData,
  ]);

  // データの手動更新
  const refreshData = useCallback(() => {
    setGraphState((prev) => ({ ...prev, isLoading: true }));

    setTimeout(() => {
      updateGraphData();
      setGraphState((prev) => ({ ...prev, isLoading: false }));
    }, 100);
  }, [updateGraphData]);

  // グラフデータのクリア
  const clearGraphData = useCallback(() => {
    setGraphState((prev) => ({
      ...prev,
      data: [],
      selectedSignals: [],
    }));
    dataPointsMapRef.current.clear();
  }, []);

  // 統計情報の取得
  const getStatistics = useCallback(() => {
    const { data, selectedSignals } = graphState;

    if (!data.length || !selectedSignals.length) {
      return null;
    }

    const stats: Record<
      string,
      {
        min: number;
        max: number;
        avg: number;
        current: number | null;
        count: number;
      }
    > = {};

    selectedSignals.forEach((signal) => {
      const values = data
        .map((point) => point[signal.name])
        .filter(
          (value) => typeof value === 'number' && !isNaN(value)
        ) as number[];

      if (values.length > 0) {
        const min = Math.min(...values);
        const max = Math.max(...values);
        const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
        const latestPoint = data[data.length - 1];
        const current = latestPoint ? latestPoint[signal.name] : null;

        stats[signal.name] = {
          min,
          max,
          avg,
          current: typeof current === 'number' ? current : null,
          count: values.length,
        };
      }
    });

    return stats;
  }, [graphState]);

  return {
    // 状態
    graphState,
    statistics: getStatistics(),

    // 更新関数
    updateSelectedSignals,
    updateGraphConfig,
    toggleRealTimeUpdate,
    refreshData,
    clearGraphData,

    // ヘルパー関数
    isDataAvailable:
      graphState.data.length > 0 && graphState.selectedSignals.length > 0,
    lastUpdateTime: lastUpdateTimeRef.current,
  };
}
