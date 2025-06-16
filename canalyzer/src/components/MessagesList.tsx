'use client';

import { useState } from 'react';
import { CANMessage } from '@/types/dbc';
import MessageDetail from './MessageDetail';

interface MessagesListProps {
  messages: Map<number, CANMessage>;
}

export default function MessagesList({ messages }: MessagesListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<CANMessage | null>(
    null
  );
  const [sortBy, setSortBy] = useState<'id' | 'name' | 'signals'>('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const messagesArray = Array.from(messages.values());

  // 検索フィルタリング
  const filteredMessages = messagesArray.filter(
    (message) =>
      message.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.id.toString().includes(searchTerm) ||
      message.sendingNode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ソート
  const sortedMessages = [...filteredMessages].sort((a, b) => {
    let aValue: string | number;
    let bValue: string | number;

    switch (sortBy) {
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

    if (sortOrder === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  const handleSort = (field: 'id' | 'name' | 'signals') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (field: 'id' | 'name' | 'signals') => {
    if (sortBy !== field) return '↕️';
    return sortOrder === 'asc' ? '↑' : '↓';
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
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>
            表示中: {sortedMessages.length} / {messagesArray.length} 件
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
                onClick={() => handleSort('id')}
              >
                ID {getSortIcon('id')}
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('name')}
              >
                メッセージ名 {getSortIcon('name')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                サイズ (バイト)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                送信ノード
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('signals')}
              >
                シグナル数 {getSortIcon('signals')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedMessages.map((message, index) => (
              <tr
                key={message.id}
                className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                  0x{message.id.toString(16).toUpperCase().padStart(3, '0')}
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
