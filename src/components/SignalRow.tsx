'use client';

import React from 'react';
import { CANValue } from '@/types/can';

interface SignalRowProps {
  signal: CANValue;
  isSelected: boolean;
  canSelect: boolean;
  onToggle: (signalName: string) => void;
}

// メモ化されたシグナル行コンポーネント
const SignalRow = React.memo(
  ({ signal, isSelected, canSelect, onToggle }: SignalRowProps) => {
    return (
      <div
        className={`p-4 hover:bg-gray-50 transition-colors ${
          !canSelect && !isSelected ? 'opacity-50' : ''
        }`}
      >
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggle(signal.signalName)}
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
  },
  // カスタム比較関数
  (prevProps, nextProps) => {
    return (
      prevProps.signal.signalName === nextProps.signal.signalName &&
      prevProps.isSelected === nextProps.isSelected &&
      prevProps.canSelect === nextProps.canSelect
    );
  }
);

SignalRow.displayName = 'SignalRow';

export default SignalRow;
