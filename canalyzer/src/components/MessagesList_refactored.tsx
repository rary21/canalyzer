'use client';

import { useState } from 'react';
import { CANMessage } from '@/types/dbc';
import MessageDetail from './MessageDetail';
import { useSort } from '@/hooks/useSort';
import { useFilter } from '@/hooks/useFilter';
import { formatCANId } from '@/utils/formatters';

interface MessagesListProps {
  messages: Map<number, CANMessage>;
}

type SortField = 'id' | 'name' | 'signals';

export default function MessagesList({ messages }: MessagesListProps) {
  const [selectedMessage, setSelectedMessage] = useState<CANMessage | null>(
    null
  );

  const messagesArray = Array.from(messages.values());

  // カスタムフックを使用してフィルタリング
  const { filteredData, searchQuery, setSearchQuery } = useFilter<CANMessage>({
    data: messagesArray,
    searchFields: ['name', 'sendingNode'],
    customFilter: (message, query) => {
      const lowerQuery = query.toLowerCase();
      return (
        message.name.toLowerCase().includes(lowerQuery) ||
        message.id.toString().includes(query) ||
        message.sendingNode.toLowerCase().includes(lowerQuery)
      );
    },
  });

  // カスタムフックを使用してソート
  const { sortedData, sortField, sortDirection, toggleSort } =
    useSort<CANMessage>({
      data: filteredData,
      initialSortField: 'id',
      initialSortDirection: 'asc',
      customSort: (a, b, field, direction) => {
        let aValue: string | number;
        let bValue: string | number;

        switch (field) {
          case 'id':
            aValue = a.id;
            bValue = b.id;
            break;
          case 'name':
            aValue = a.name.toLowerCase();
            bValue = b.name.toLowerCase();
            break;
          case 'signals':
            aValue = a.signals.length;
            bValue = b.signals.length;
            break;
          default:
            return 0;
        }

        if (direction === 'asc') {
          return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        } else {
          return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
        }
      },
    });

  const getSortIconText = (field: SortField) => {
    if (sortField !== field) return '↕️';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  if (messagesArray.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">メッセージが定義されていません</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 検索とコントロール */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 max-w-md">
          <input
            type="text"
            placeholder="メッセージ名、ID、送信ノードで検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>
            表示中: {sortedData.length} / {messagesArray.length} 件
          </span>
        </div>
      </div>

      {/* メッセージ一覧テーブル */}
      <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => toggleSort('id')}
              >
                <div className="flex items-center space-x-1">
                  <span>ID</span>
                  <span className="text-xs">{getSortIconText('id')}</span>
                </div>
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => toggleSort('name')}
              >
                <div className="flex items-center space-x-1">
                  <span>メッセージ名</span>
                  <span className="text-xs">{getSortIconText('name')}</span>
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                サイズ (バイト)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                送信ノード
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => toggleSort('signals')}
              >
                <div className="flex items-center space-x-1">
                  <span>シグナル数</span>
                  <span className="text-xs">{getSortIconText('signals')}</span>
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedData.map((message, index) => (
              <tr
                key={message.id}
                className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                  {formatCANId(message.id)}
                  <span className="text-gray-500 ml-2">({message.id})</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {message.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {message.length}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {message.sendingNode || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {message.signals.length}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <button
                    onClick={() => setSelectedMessage(message)}
                    className="text-blue-600 hover:text-blue-900 font-medium"
                  >
                    詳細表示
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* メッセージ詳細モーダル */}
      {selectedMessage && (
        <MessageDetail
          message={selectedMessage}
          onClose={() => setSelectedMessage(null)}
        />
      )}
    </div>
  );
}
