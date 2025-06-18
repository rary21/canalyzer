'use client';

import React from 'react';
import {
  GraphConfig,
  TIME_RANGE_PRESETS,
  UPDATE_INTERVAL_PRESETS,
} from '@/types/graph';
import { useGraphSettings } from '@/hooks/useGraphSettings';

interface GraphSettingsProps {
  /** 現在のグラフ設定 */
  config: GraphConfig;
  /** 設定変更時のコールバック */
  onConfigChange: (config: GraphConfig) => void;
  /** リアルタイム更新の有効状態 */
  realTimeEnabled: boolean;
  /** リアルタイム更新切り替えのコールバック */
  onRealTimeToggle: (enabled: boolean) => void;
}

/**
 * グラフ設定のプレゼンテーショナルコンポーネント
 */
export default function GraphSettings({
  config,
  onConfigChange,
  realTimeEnabled,
  onRealTimeToggle,
}: GraphSettingsProps) {
  const {
    isExpanded,
    updateTimeRange,
    updateUpdateInterval,
    toggleAutoScale,
    updateYAxisMin,
    updateYAxisMax,
    updateDisplayOption,
    resetToDefaults,
    toggleExpanded,
  } = useGraphSettings({ config, onConfigChange });

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* ヘッダー */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">グラフ設定</h3>
            <p className="text-sm text-gray-600 mt-1">
              表示範囲や更新間隔を調整できます
            </p>
          </div>
          <button
            onClick={toggleExpanded}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg
              className={`w-5 h-5 transform transition-transform ${
                isExpanded ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* クイック設定（常に表示） */}
      <div className="p-4 space-y-4">
        {/* リアルタイム更新切り替え */}
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-gray-700">
              リアルタイム更新
            </label>
            <p className="text-xs text-gray-500 mt-1">
              自動的にグラフを更新します
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={realTimeEnabled}
              onChange={(e) => onRealTimeToggle(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* 時間範囲設定 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            表示時間範囲
          </label>
          <div className="grid grid-cols-5 gap-2">
            {TIME_RANGE_PRESETS.map((preset) => (
              <button
                key={preset.value}
                onClick={() => updateTimeRange(preset.value)}
                className={`px-3 py-2 text-sm rounded-md border transition-colors ${
                  config.timeRange === preset.value
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 詳細設定（展開時のみ表示） */}
      {isExpanded && (
        <div className="p-4 border-t border-gray-200 space-y-6">
          {/* 更新間隔設定 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              更新間隔
            </label>
            <div className="grid grid-cols-5 gap-2">
              {UPDATE_INTERVAL_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => updateUpdateInterval(preset.value)}
                  className={`px-3 py-2 text-sm rounded-md border transition-colors ${
                    config.updateInterval === preset.value
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Y軸設定 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Y軸設定
            </label>

            {/* 自動スケール切り替え */}
            <div className="mb-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.autoScale}
                  onChange={(e) => toggleAutoScale(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
                <span className="ml-2 text-sm text-gray-700">自動スケール</span>
              </label>
              <p className="text-xs text-gray-500 mt-1 ml-6">
                データに基づいてY軸の範囲を自動調整
              </p>
            </div>

            {/* 手動スケール設定 */}
            {!config.autoScale && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    最小値
                  </label>
                  <input
                    type="number"
                    value={config.yAxisMin || ''}
                    onChange={(e) => updateYAxisMin(e.target.value)}
                    placeholder="自動"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    最大値
                  </label>
                  <input
                    type="number"
                    value={config.yAxisMax || ''}
                    onChange={(e) => updateYAxisMax(e.target.value)}
                    placeholder="自動"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 表示オプション */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              表示オプション
            </label>
            <div className="space-y-3">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.showGrid}
                  onChange={(e) =>
                    updateDisplayOption('showGrid', e.target.checked)
                  }
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
                <span className="ml-2 text-sm text-gray-700">グリッド表示</span>
              </label>

              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.showLegend}
                  onChange={(e) =>
                    updateDisplayOption('showLegend', e.target.checked)
                  }
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
                <span className="ml-2 text-sm text-gray-700">凡例表示</span>
              </label>

              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.showTooltip}
                  onChange={(e) =>
                    updateDisplayOption('showTooltip', e.target.checked)
                  }
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
                <span className="ml-2 text-sm text-gray-700">
                  ツールチップ表示
                </span>
              </label>
            </div>
          </div>

          {/* リセットボタン */}
          <div className="pt-4 border-t border-gray-200">
            <button
              onClick={resetToDefaults}
              className="w-full px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              設定をリセット
            </button>
          </div>
        </div>
      )}

      {/* 現在の設定サマリー */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
          <div>
            <span className="font-medium">時間範囲:</span>{' '}
            {config.timeRange / 1000}秒
          </div>
          <div>
            <span className="font-medium">更新間隔:</span>{' '}
            {config.updateInterval}ms
          </div>
          <div>
            <span className="font-medium">Y軸:</span>{' '}
            {config.autoScale ? '自動' : '手動'}
          </div>
          <div>
            <span className="font-medium">更新:</span>{' '}
            {realTimeEnabled ? '有効' : '無効'}
          </div>
        </div>
      </div>
    </div>
  );
}
