'use client';

import React, { useState, useMemo } from 'react';
import { SelectableSignal, GRAPH_COLORS } from '@/types/graph';
import { CANValue } from '@/types/can';

interface SignalSelectorProps {
  /** 利用可能なCANシグナル値 */
  availableSignals: CANValue[];
  /** 選択されたシグナル */
  selectedSignals: SelectableSignal[];
  /** シグナル選択変更時のコールバック */
  onSelectionChange: (signals: SelectableSignal[]) => void;
  /** 最大選択可能数 */
  maxSelection?: number;
}

export default function SignalSelector({
  availableSignals,
  selectedSignals,
  onSelectionChange,
  maxSelection = 5,
}: SignalSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // ユニークなシグナル一覧を作成
  const uniqueSignals = useMemo(() => {
    const signalMap = new Map<string, CANValue>();

    availableSignals.forEach((signal) => {
      if (!signalMap.has(signal.signalName)) {
        signalMap.set(signal.signalName, signal);
      }
    });

    return Array.from(signalMap.values());
  }, [availableSignals]);

  // 検索フィルター
  const filteredSignals = useMemo(() => {
    if (!searchQuery.trim()) return uniqueSignals;

    const query = searchQuery.toLowerCase();
    return uniqueSignals.filter(
      (signal) =>
        signal.signalName.toLowerCase().includes(query) ||
        signal.unit.toLowerCase().includes(query) ||
        (signal.description && signal.description.toLowerCase().includes(query))
    );
  }, [uniqueSignals, searchQuery]);

  // シグナル選択の切り替え
  const toggleSignalSelection = (signalName: string) => {
    const existingSignal = selectedSignals.find((s) => s.name === signalName);

    if (existingSignal) {
      // 選択解除
      const newSignals = selectedSignals.filter((s) => s.name !== signalName);
      onSelectionChange(newSignals);
    } else {
      // 新規選択
      if (selectedSignals.length >= maxSelection) {
        return; // 最大選択数に達している場合は追加しない
      }

      const signal = uniqueSignals.find((s) => s.signalName === signalName);
      if (!signal) return;

      const colorIndex = selectedSignals.length % GRAPH_COLORS.length;
      const newSignal: SelectableSignal = {
        name: signal.signalName,
        unit: signal.unit,
        description: signal.description,
        selected: true,
        color: GRAPH_COLORS[colorIndex],
      };

      onSelectionChange([...selectedSignals, newSignal]);
    }
  };

  // 全て選択解除
  const clearSelection = () => {
    onSelectionChange([]);
  };

  // 選択中のシグナル名のセット
  const selectedSignalNames = new Set(selectedSignals.map((s) => s.name));

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* ヘッダー */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              シグナル選択
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              グラフに表示するシグナルを選択してください（最大{maxSelection}個）
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">
              {selectedSignals.length}/{maxSelection} 選択中
            </span>
            {selectedSignals.length > 0 && (
              <button
                onClick={clearSelection}
                className="text-sm text-red-600 hover:text-red-700 underline"
              >
                全て解除
              </button>
            )}
          </div>
        </div>

        {/* 検索フィールド */}
        <div className="mt-4 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg
              className="h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <input
            type="text"
            placeholder="シグナル名、単位、説明で検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
          />
        </div>
      </div>

      {/* 選択済みシグナル表示 */}
      {selectedSignals.length > 0 && (
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            選択中のシグナル
          </h4>
          <div className="flex flex-wrap gap-2">
            {selectedSignals.map((signal) => (
              <div
                key={signal.name}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-white border"
                style={{ borderColor: signal.color }}
              >
                <div
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: signal.color }}
                />
                <span className="font-medium">{signal.name}</span>
                <span className="ml-1 text-gray-500">({signal.unit})</span>
                <button
                  onClick={() => toggleSignalSelection(signal.name)}
                  className="ml-2 text-gray-400 hover:text-gray-600"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* シグナル一覧 */}
      <div className="max-h-96 overflow-y-auto">
        {filteredSignals.length === 0 ? (
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
            <p className="text-gray-500">
              {searchQuery
                ? '検索条件に一致するシグナルがありません'
                : '利用可能なシグナルがありません'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredSignals.map((signal) => {
              const isSelected = selectedSignalNames.has(signal.signalName);
              const canSelect =
                !isSelected && selectedSignals.length < maxSelection;

              return (
                <div
                  key={signal.signalName}
                  className={`p-4 hover:bg-gray-50 transition-colors ${
                    !canSelect && !isSelected ? 'opacity-50' : ''
                  }`}
                >
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSignalSelection(signal.signalName)}
                      disabled={!canSelect && !isSelected}
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    />
                    <div className="ml-3 flex-1">
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-gray-900">
                          {signal.signalName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {signal.unit || '単位なし'}
                        </div>
                      </div>
                      {signal.description && (
                        <div className="text-sm text-gray-600 mt-1">
                          {signal.description}
                        </div>
                      )}
                    </div>
                  </label>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* フッター */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            {filteredSignals.length} / {uniqueSignals.length} 件のシグナル
          </span>
          {selectedSignals.length >= maxSelection && (
            <span className="text-amber-600">最大選択数に達しています</span>
          )}
        </div>
      </div>
    </div>
  );
}
