'use client'

import { CANMessage } from '@/types/dbc'

interface MessageDetailProps {
  message: CANMessage
  onClose: () => void
}

export default function MessageDetail({ message, onClose }: MessageDetailProps) {
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              メッセージ詳細: {message.name}
            </h3>
            <p className="text-sm text-gray-500">
              ID: 0x{message.id.toString(16).toUpperCase().padStart(3, '0')} ({message.id})
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* メッセージ基本情報 */}
        <div className="mb-6">
          <h4 className="text-md font-medium text-gray-900 mb-3">基本情報</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <span className="text-sm font-medium text-gray-500">サイズ</span>
              <p className="text-lg text-gray-900">{message.length} バイト</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">送信ノード</span>
              <p className="text-lg text-gray-900">{message.sendingNode || '未指定'}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">シグナル数</span>
              <p className="text-lg text-gray-900">{message.signals.length}</p>
            </div>
          </div>
          {message.comment && (
            <div className="mt-3">
              <span className="text-sm font-medium text-gray-500">コメント</span>
              <p className="text-gray-700 mt-1">{message.comment}</p>
            </div>
          )}
        </div>

        {/* シグナル一覧 */}
        <div className="mb-6">
          <h4 className="text-md font-medium text-gray-900 mb-3">
            シグナル一覧 ({message.signals.length})
          </h4>
          {message.signals.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      シグナル名
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      開始ビット
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      長さ
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      エンディアン
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      符号
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      ファクター
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      オフセット
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      範囲
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      単位
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {message.signals.map((signal, index) => (
                    <tr key={signal.name} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {signal.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 font-mono">
                        {signal.startBit}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 font-mono">
                        {signal.length}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {signal.endianness === 'little' ? 'リトル' : 'ビッグ'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {signal.signed ? '符号付き' : '符号なし'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 font-mono">
                        {signal.factor}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 font-mono">
                        {signal.offset}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 font-mono">
                        [{signal.min}, {signal.max}]
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {signal.unit || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">シグナルが定義されていません</p>
          )}
        </div>

        {/* シグナルの値定義がある場合 */}
        {message.signals.some(signal => signal.values) && (
          <div className="mb-6">
            <h4 className="text-md font-medium text-gray-900 mb-3">値定義</h4>
            <div className="space-y-4">
              {message.signals
                .filter(signal => signal.values)
                .map(signal => (
                  <div key={signal.name} className="border border-gray-200 rounded-lg p-4">
                    <h5 className="font-medium text-gray-900 mb-2">{signal.name}</h5>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                      {signal.values && Object.entries(signal.values).map(([value, description]) => (
                        <div key={value} className="bg-gray-50 p-2 rounded">
                          <span className="font-mono text-gray-600">{value}:</span>
                          <span className="ml-1 text-gray-900">{description}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* フッター */}
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  )
}