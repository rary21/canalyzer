'use client';

import { useState } from 'react';
import { GraphConfig } from '@/types/graph';

interface UseGraphSettingsParams {
  /** 現在のグラフ設定 */
  config: GraphConfig;
  /** 設定変更時のコールバック */
  onConfigChange: (config: GraphConfig) => void;
}

/**
 * グラフ設定のUI状態を管理するカスタムフック
 */
export function useGraphSettings({
  config,
  onConfigChange,
}: UseGraphSettingsParams) {
  const [isExpanded, setIsExpanded] = useState(false);

  /**
   * 設定値を更新するヘルパー関数
   */
  const updateConfig = (updates: Partial<GraphConfig>) => {
    onConfigChange({ ...config, ...updates });
  };

  /**
   * 時間範囲を更新する
   */
  const updateTimeRange = (timeRange: number) => {
    updateConfig({ timeRange });
  };

  /**
   * 更新間隔を更新する
   */
  const updateUpdateInterval = (updateInterval: number) => {
    updateConfig({ updateInterval });
  };

  /**
   * 自動スケールの切り替え
   */
  const toggleAutoScale = (autoScale: boolean) => {
    updateConfig({ autoScale });
  };

  /**
   * Y軸の最小値を更新する
   */
  const updateYAxisMin = (value: string) => {
    updateConfig({
      yAxisMin: value ? parseFloat(value) : undefined,
    });
  };

  /**
   * Y軸の最大値を更新する
   */
  const updateYAxisMax = (value: string) => {
    updateConfig({
      yAxisMax: value ? parseFloat(value) : undefined,
    });
  };

  /**
   * 表示オプションを更新する
   */
  const updateDisplayOption = (
    option: 'showGrid' | 'showLegend' | 'showTooltip',
    value: boolean
  ) => {
    updateConfig({ [option]: value });
  };

  /**
   * デフォルト設定にリセットする
   */
  const resetToDefaults = () => {
    const defaultConfig: GraphConfig = {
      timeRange: 10000,
      updateInterval: 100,
      autoScale: true,
      showGrid: true,
      showLegend: true,
      showTooltip: true,
    };
    onConfigChange(defaultConfig);
  };

  /**
   * 展開状態を切り替える
   */
  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return {
    // 状態
    isExpanded,
    // アクション
    updateConfig,
    updateTimeRange,
    updateUpdateInterval,
    toggleAutoScale,
    updateYAxisMin,
    updateYAxisMax,
    updateDisplayOption,
    resetToDefaults,
    toggleExpanded,
  };
}
