# WebSocket統合ガイド

## 概要

このドキュメントでは、CANalyzerにおけるWebSocket統合の設計と実装について説明します。

## アーキテクチャ

### 全体構成

```
┌─────────────────┐     WebSocket      ┌──────────────────┐
│                 │ ◄────────────────► │                  │
│  Next.js Client │                    │ WebSocket Server │
│   (React App)   │                    │   (Node.js)      │
│                 │                    │                  │
└─────────────────┘                    └────────┬─────────┘
                                                 │
                                                 │
                                       ┌─────────▼─────────┐
                                       │                   │
                                       │  CAN Interface    │
                                       │  (Virtual/Real)   │
                                       │                   │
                                       └───────────────────┘
```

### コンポーネント構成

1. **WebSocketサーバー** (`/src/server/websocket-server.ts`)
   - WebSocket接続の管理
   - CANフレームのブロードキャスト
   - クライアントの購読管理

2. **CANインターフェース** (`/src/lib/can-interface.ts`)
   - 抽象CANインターフェース定義
   - 仮想CANインターフェース（開発用）
   - 実ハードウェアインターフェース（将来実装）

3. **クライアントフック** (`/src/hooks/useWebSocket.ts`)
   - WebSocket接続管理
   - 自動再接続
   - メッセージ送受信

4. **リアルタイムデータコンテキスト** (`/src/contexts/RealtimeDataContext.tsx`)
   - リアルタイムデータの状態管理
   - データ履歴の保持
   - 統計情報の計算

## 使用方法

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 開発サーバーの起動

```bash
npm run dev
```

これにより、WebSocketサーバーとNext.jsアプリケーションが同時に起動します。

### 3. コンポーネントでの使用例

```tsx
import { useRealtimeData } from '@/contexts/RealtimeDataContext';
import RealtimeControl from '@/components/RealtimeControl';

export default function MyComponent() {
  const {
    isRealtimeEnabled,
    latestValues,
    subscribeCANIds
  } = useRealtimeData();

  // 特定のCAN IDを購読
  useEffect(() => {
    if (isRealtimeEnabled) {
      subscribeCANIds([0x100, 0x101, 0x102]);
    }
  }, [isRealtimeEnabled]);

  return (
    <div>
      <RealtimeControl />
      {/* リアルタイムデータの表示 */}
      {Array.from(latestValues.entries()).map(([key, value]) => (
        <div key={key}>
          {value.signalName}: {value.physicalValue} {value.unit}
        </div>
      ))}
    </div>
  );
}
```

## WebSocketメッセージフォーマット

### サーバー → クライアント

#### 接続確立
```json
{
  "type": "connection",
  "status": "connected",
  "timestamp": 1234567890
}
```

#### CANフレーム
```json
{
  "type": "can_frame",
  "payload": {
    "id": 256,
    "data": [1, 2, 3, 4, 5, 6, 7, 8],
    "timestamp": 1234567890,
    "extended": false,
    "dlc": 8
  },
  "timestamp": 1234567890
}
```

### クライアント → サーバー

#### 購読リクエスト
```json
{
  "type": "subscribe",
  "payload": {
    "canIds": [256, 257, 258],
    "signals": ["EngineSpeed", "VehicleSpeed"]
  },
  "timestamp": 1234567890
}
```

## 設定オプション

### 環境変数

`.env.local`ファイルで以下の設定が可能です：

```env
# WebSocket接続URL
NEXT_PUBLIC_WS_URL=ws://localhost:3000/api/ws

# CANインターフェース設定
CAN_INTERFACE_TYPE=virtual
CAN_DEVICE_NAME=can0
CAN_BITRATE=500000
```

### WebSocket接続オプション

```typescript
const options = {
  url: 'ws://localhost:3000/api/ws',
  reconnectAttempts: 5,
  reconnectInterval: 3000,
  heartbeatInterval: 30000,
  timeout: 5000
};
```

## 拡張ポイント

### 新しいCANインターフェースの追加

```typescript
export class MyCANInterface extends CANInterface {
  readonly name = 'My CAN Interface';
  
  async open(): Promise<void> {
    // 実装
  }
  
  async close(): Promise<void> {
    // 実装
  }
  
  async send(frame: CANFrame): Promise<void> {
    // 実装
  }
}
```

### カスタムメッセージタイプの追加

1. `src/types/websocket.ts`に新しいメッセージタイプを定義
2. `src/server/websocket-server.ts`にハンドラーを追加
3. `src/hooks/useWebSocket.ts`にクライアント側の処理を追加

## トラブルシューティング

### WebSocket接続エラー

1. サーバーが起動しているか確認
   ```bash
   npm run dev
   ```

2. ポート3000が使用されていないか確認
   ```bash
   lsof -i :3000
   ```

3. ブラウザのコンソールでエラーメッセージを確認

### CANデータが受信されない

1. リアルタイムモードが有効か確認
2. 購読設定が正しいか確認
3. CANインターフェースのログを確認

## パフォーマンス考慮事項

- フレーム履歴は最大1000件まで保持
- シグナル値履歴は各シグナル最大500件まで保持
- WebSocketメッセージは100ms間隔でバッチ処理
- 購読フィルタリングによる不要なデータ転送の削減