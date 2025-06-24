'use client';

import React from 'react';
import { CANValue } from '@/types/can';
import { SortField, SortDirection } from '@/hooks/useCANValues';

interface CANValuesTableProps {
  /** 表示するCAN値のリスト */
  values: CANValue[];
  /** 現在のソートフィールド */
  sortField: SortField;
  /** 現在のソート方向 */
  sortDirection: SortDirection;
  /** ソート変更時のコールバック */
  onSort: (field: SortField) => void;
}

/**
 * CAN値テーブルのプレゼンテーショナルコンポーネント
 */
export default function CANValuesTable({
  values,
  sortField,
  sortDirection,
  onSort,
}: CANValuesTableProps) {
  // ソートアイコン
  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return (
        <svg
          className="w-4 h-4 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
          />
        </svg>
      );
    }

    return sortDirection === 'asc' ? (
      <svg
        className="w-4 h-4 text-blue-500"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 15l7-7 7 7"
        />
      </svg>
    ) : (
      <svg
        className="w-4 h-4 text-blue-500"
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
    );
  };

  // タイムスタンプのフォーマット
  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('ja-JP', {
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3,
    });
  };

  // 数値のフォーマット
  const formatValue = (value: number, decimals: number = 3) => {
    if (Number.isInteger(value)) {
      return value.toString();
    }
    return value.toFixed(decimals);
  };

  return (
    <div className="overflow-x-auto table-container">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => onSort('messageName')}
            >
              <div className="flex items-center space-x-1">
                <span>メッセージ名</span>
                {getSortIcon('messageName')}
              </div>
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => onSort('signalName')}
            >
              <div className="flex items-center space-x-1">
                <span>シグナル名</span>
                {getSortIcon('signalName')}
              </div>
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => onSort('physicalValue')}
            >
              <div className="flex items-center space-x-1">
                <span>物理値</span>
                {getSortIcon('physicalValue')}
              </div>
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => onSort('rawValue')}
            >
              <div className="flex items-center space-x-1">
                <span>生値</span>
                {getSortIcon('rawValue')}
              </div>
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              単位
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => onSort('timestamp')}
            >
              <div className="flex items-center space-x-1">
                <span>タイムスタンプ</span>
                {getSortIcon('timestamp')}
              </div>
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              説明
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {values.map((value, index) => (
            <tr
              key={`${value.signalName}-${value.timestamp}-${index}`}
              className="hover:bg-gray-50"
            >
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {value.messageName}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {value.signalName}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                <span className="font-mono">
                  {formatValue(value.physicalValue)}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <span className="font-mono">
                  {formatValue(value.rawValue, 0)}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {value.unit || '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <span className="font-mono text-xs">
                  {formatTimestamp(value.timestamp)}
                </span>
              </td>
              <td className="px-6 py-4 text-sm text-gray-500">
                {value.description || '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
