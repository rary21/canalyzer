'use client';

import { useState } from 'react';
import { DBCDatabase } from '@/types/dbc';
import DBCOverview from './DBCOverview';
import NodesList from './NodesList';
import MessagesList from './MessagesList';

interface DBCInfoDisplayProps {
  data: DBCDatabase;
}

export default function DBCInfoDisplay({ data }: DBCInfoDisplayProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'nodes' | 'messages'>(
    'overview'
  );

  const tabs = [
    { id: 'overview' as const, label: '概要', count: null },
    { id: 'nodes' as const, label: 'ノード', count: data.nodes.length },
    { id: 'messages' as const, label: 'メッセージ', count: data.messages.size },
  ];

  return (
    <div className="bg-white rounded-lg shadow-lg">
      {/* タブナビゲーション */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
              {tab.count !== null && (
                <span
                  className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* タブコンテンツ */}
      <div className="p-6">
        {activeTab === 'overview' && <DBCOverview data={data} />}
        {activeTab === 'nodes' && <NodesList nodes={data.nodes} />}
        {activeTab === 'messages' && <MessagesList messages={data.messages} />}
      </div>
    </div>
  );
}
