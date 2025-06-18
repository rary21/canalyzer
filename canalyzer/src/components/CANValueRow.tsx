'use client';

import React from 'react';
import { CANValue } from '@/types/can';

interface CANValueRowProps {
  value: CANValue;
  formatTimestamp: (timestamp: number) => string;
  formatValue: (value: number, decimals?: number) => string;
}

// メモ化されたテーブル行コンポーネント
const CANValueRow = React.memo(
  ({ value, formatTimestamp, formatValue }: CANValueRowProps) => {
    return (
      <tr className="hover:bg-gray-50">
        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
          {value.messageName}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
          {value.signalName}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
          <span className="font-mono">{formatValue(value.physicalValue)}</span>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          <span className="font-mono">{formatValue(value.rawValue, 0)}</span>
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
    );
  },
  // カスタム比較関数で再レンダリングを最小化
  (prevProps, nextProps) => {
    return (
      prevProps.value.signalName === nextProps.value.signalName &&
      prevProps.value.timestamp === nextProps.value.timestamp &&
      prevProps.value.physicalValue === nextProps.value.physicalValue &&
      prevProps.value.rawValue === nextProps.value.rawValue
    );
  }
);

CANValueRow.displayName = 'CANValueRow';

export default CANValueRow;
