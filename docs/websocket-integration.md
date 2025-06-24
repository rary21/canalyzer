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

1. **WebSocketサーバー** (`/src/server/websocket-server.js`)

   - WebSocket接続の管理
   - CANフレームのブロードキャスト
   - クライアントの購読管理
   - 自動ストリーミング開始/停止制御

2. **CANインターフェース** (`/src/lib/can-interface.ts`)

   - 抽象CANインターフェース定義
   - 仮想CANインターフェース（開発用）
   - NullCANインターフェース（データ生成なし）
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
  const { isRealtimeEnabled, latestValues, subscribeCANIds } =
    useRealtimeData();

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

#### 接続ステータス

```json
{
  "type": "status",
  "data": {
    "connected": true,
    "interface": "Virtual CAN Interface",
    "streaming": false
  }
}
```

#### CANフレーム

```json
{
  "type": "frame",
  "data": {
    "frame": {
      "id": 256,
      "data": [1, 2, 3, 4, 5, 6, 7, 8],
      "timestamp": 1234567890,
      "extended": false,
      "dlc": 8
    }
  }
}
```

#### エラー通知

```json
{
  "type": "error",
  "error": "Connection failed"
}
```

### クライアント → サーバー

#### ストリーミング開始

```json
{
  "type": "start"
}
```

#### ストリーミング停止

```json
{
  "type": "stop"
}
```

#### メッセージ購読

```json
{
  "type": "subscribe",
  "messageIds": [256, 257, 258]
}
```

#### フレーム送信

```json
{
  "type": "send_frame",
  "frame": {
    "id": 256,
    "data": [1, 2, 3, 4, 5, 6, 7, 8],
    "extended": false,
    "dlc": 8
  }
}
```

#### ハートビート

```json
{
  "type": "heartbeat"
}
```

## 設定オプション

### 環境変数

`.env.local`ファイルで以下の設定が可能です：

```env
# WebSocket接続URL
NEXT_PUBLIC_WS_URL=ws://localhost:3000/ws

# CANインターフェース設定
CAN_INTERFACE_TYPE=null        # null(デフォルト), virtual, hardware
CAN_DEVICE_NAME=can0
CAN_BITRATE=500000
```

### WebSocket接続オプション

```typescript
const options = {
  url: 'ws://localhost:3000/ws',
  reconnectAttempts: 5,
  reconnectInterval: 3000,
  heartbeatInterval: 30000,
  timeout: 5000,
};
```

## 自動制御機能

### クライアント接続ベースの自動制御

WebSocketサーバーは、クライアントの接続状況に基づいて自動的にストリーミングを制御します：

- **初回接続時**: 自動的にCANストリーミングを開始
- **全クライアント切断時**: 自動的にCANストリーミングを停止
- **手動制御**: クライアントから`start`/`stop`メッセージで明示的に制御可能

### CANインターフェース選択

環境変数`CAN_INTERFACE_TYPE`により、使用するCANインターフェースを制御：

```javascript
// CANInterfaceFactory.create()の動作
switch (type) {
  case 'virtual':
    // VirtualCANInterface: 100ms間隔で仮想データ生成
    return new VirtualCANInterface();
  case 'hardware':
    // SocketCAN対応（将来実装）
    throw new Error('Hardware CAN Interface not implemented yet');
  case 'none':
  default:
    // NullCANInterface: データ生成なし
    return new NullCANInterface();
}
```

## CANフレーム送信機能

WebSocketクライアントからサーバーへCANフレームを送信可能：

### 基本的な送信例

```javascript
const ws = new WebSocket('ws://localhost:3000/ws');

// CANフレーム送信
ws.send(
  JSON.stringify({
    type: 'send_frame',
    frame: {
      id: 0x123,
      data: [0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08],
      extended: false,
      dlc: 8,
    },
  })
);
```

### サンプル送信スクリプト

プロジェクトには簡単なCANフレーム送信スクリプトが含まれています：

```bash
# サンプルファイル作成後
npx tsx examples/websocket-can-sender.ts
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
2. `src/server/websocket-server.js`にハンドラーを追加
3. `src/hooks/useWebSocket.ts`にクライアント側の処理を追加

**注意**: 現在、WebSocketサーバーはJavaScript版（`.js`）が本体として使用されており、TypeScript版（`.ts`）は型定義リファレンスとして残されています。

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
