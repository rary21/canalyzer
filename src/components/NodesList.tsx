import { CANNode } from '@/types/dbc';

interface NodesListProps {
  nodes: CANNode[];
}

export default function NodesList({ nodes }: NodesListProps) {
  if (nodes.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">ノードが定義されていません</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">ノード一覧</h2>
        <span className="text-sm text-gray-500">{nodes.length} 件</span>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {nodes.map((node, index) => (
          <div
            key={node.name}
            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-gray-900">{node.name}</h3>
              <span className="text-xs text-gray-400">#{index + 1}</span>
            </div>

            {node.comment && (
              <p className="text-sm text-gray-600 mt-2">{node.comment}</p>
            )}

            {!node.comment && (
              <p className="text-sm text-gray-400 italic">コメントなし</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
