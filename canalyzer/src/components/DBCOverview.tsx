import { DBCDatabase } from '@/types/dbc'

interface DBCOverviewProps {
  data: DBCDatabase
}

export default function DBCOverview({ data }: DBCOverviewProps) {
  // 統計情報を計算
  const totalSignals = Array.from(data.messages.values()).reduce(
    (total, message) => total + message.signals.length,
    0
  )

  const nodeStats = data.nodes.length > 0 ? data.nodes.map(node => {
    const sentMessages = Array.from(data.messages.values()).filter(
      message => message.sendingNode === node.name
    )
    const receivedSignals = Array.from(data.messages.values()).reduce(
      (count, message) => {
        return count + message.signals.filter(signal => 
          signal.receivingNodes.includes(node.name)
        ).length
      },
      0
    )
    return { ...node, sentMessages: sentMessages.length, receivedSignals }
  }) : []

  const messageStats = {
    totalMessages: data.messages.size,
    averageSignalsPerMessage: data.messages.size > 0 ? (totalSignals / data.messages.size).toFixed(1) : '0',
    maxSignalsInMessage: Math.max(...Array.from(data.messages.values()).map(m => m.signals.length), 0),
    minSignalsInMessage: data.messages.size > 0 ? Math.min(...Array.from(data.messages.values()).map(m => m.signals.length)) : 0
  }

  return (
    <div className="space-y-8">
      {/* 基本情報 */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">基本情報</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{data.nodes.length}</div>
            <div className="text-sm text-gray-600">ノード数</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{data.messages.size}</div>
            <div className="text-sm text-gray-600">メッセージ数</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{totalSignals}</div>
            <div className="text-sm text-gray-600">シグナル数</div>
          </div>
        </div>
      </section>

      {/* DBCファイル情報 */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">DBCファイル詳細</h2>
        <div className="bg-gray-50 p-4 rounded-lg">
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">バージョン</dt>
              <dd className="text-lg text-gray-900">{data.version || '未指定'}</dd>
            </div>
            {data.baudrate && (
              <div>
                <dt className="text-sm font-medium text-gray-500">ボーレート</dt>
                <dd className="text-lg text-gray-900">{data.baudrate.toLocaleString()} bps</dd>
              </div>
            )}
          </dl>
        </div>
      </section>

      {/* メッセージ統計 */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">メッセージ統計</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 border rounded-lg">
            <div className="text-lg font-semibold text-gray-900">{messageStats.totalMessages}</div>
            <div className="text-xs text-gray-500">総メッセージ数</div>
          </div>
          <div className="text-center p-3 border rounded-lg">
            <div className="text-lg font-semibold text-gray-900">{messageStats.averageSignalsPerMessage}</div>
            <div className="text-xs text-gray-500">平均シグナル数</div>
          </div>
          <div className="text-center p-3 border rounded-lg">
            <div className="text-lg font-semibold text-gray-900">{messageStats.maxSignalsInMessage}</div>
            <div className="text-xs text-gray-500">最大シグナル数</div>
          </div>
          <div className="text-center p-3 border rounded-lg">
            <div className="text-lg font-semibold text-gray-900">{messageStats.minSignalsInMessage}</div>
            <div className="text-xs text-gray-500">最小シグナル数</div>
          </div>
        </div>
      </section>

      {/* ノード概要 */}
      {nodeStats.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">ノード概要</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ノード名
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    送信メッセージ数
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    受信シグナル数
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {nodeStats.map((node, index) => (
                  <tr key={node.name} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {node.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {node.sentMessages}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {node.receivedSignals}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}