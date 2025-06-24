# CANalyzer サンプル集

このディレクトリには、CANalyzerの様々な機能を実演するサンプルプログラムが含まれています。

## 📂 サンプル一覧

- **websocket-can-sender.ts**: WebSocketでCANフレームを送信
- **openpilot-can-example.ts**: openpilotからリアルタイムCANデータを受信

---

# WebSocket CAN送信サンプル

WebSocketを使用してCANフレームを送信するシンプルなサンプルプログラムです。

## websocket-can-sender.js

固定のCANフレームを定期的に送信するシンプルなクライアントです。

### 使用方法

1. **CANalyzerサーバーを起動**

   ```bash
   npm run dev
   ```

2. **送信サンプルを実行**
   ```bash
   cd examples
   npx tsx websocket-can-sender.ts
   ```

### 送信されるCANフレーム

| CAN ID | データ                  | DLC | 説明            |
| ------ | ----------------------- | --- | --------------- |
| 0x123  | 01 02 03 04 05 06 07 08 | 8   | テストフレーム1 |
| 0x456  | FF EE DD CC             | 4   | テストフレーム2 |
| 0x789  | AA BB                   | 2   | テストフレーム3 |

### 実行例

```
=== WebSocket CAN送信サンプル ===

WebSocketに接続中: ws://localhost:3000/ws
✓ WebSocket接続が確立されました
CANフレーム送信を開始 (1000ms間隔)
→ 送信: ID=0x123, データ=[0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08], DLC=8
← 受信: send_frame_response {"success":true,"frame":{"id":291,"data":{},"timestamp":1702876543210,"extended":false,"dlc":8}}
→ 送信: ID=0x456, データ=[0xFF, 0xEE, 0xDD, 0xCC], DLC=4
← 受信: send_frame_response {"success":true,"frame":{"id":1110,"data":{},"timestamp":1702876544210,"extended":false,"dlc":4}}
...
```

### 終了方法

`Ctrl+C`で終了します。

### 送信間隔の変更

`SEND_INTERVAL`定数を変更することで送信間隔を調整できます（ミリ秒単位）。

```javascript
const SEND_INTERVAL = 500; // 500ms間隔
```

### カスタムフレームの送信

`SAMPLE_FRAMES`配列を編集することで、送信するCANフレームをカスタマイズできます。

```javascript
const SAMPLE_FRAMES = [
  {
    id: 0x100, // CAN ID
    data: new Uint8Array([0x12, 0x34]), // データ
    extended: false, // 拡張フレーム
    dlc: 2, // データ長
  },
];
```

## ライブデモ

1. 一つのターミナルでCANalyzerサーバーを起動
2. ブラウザで`http://localhost:3000/values`を開き、「リアルタイム開始」をクリック
3. 別のターミナルで送信サンプルを実行
4. ブラウザでカスタムCANフレームがリアルタイム表示されることを確認

送信されたフレームは、WebSocketサーバーを通じて他の全てのクライアント（ブラウザを含む）にブロードキャストされます。

---

# openpilot CAN統合サンプル

openpilotからリアルタイムCANデータを受信し、解析・表示するサンプルプログラムです。

## openpilot-can-example.ts

openpilotのZMQ配信からCANデータを受信し、リアルタイムで解析・表示します。

### 前提条件

1. **openpilotが動作している環境**

   - openpilotがZMQでCANデータを配信していること
   - 必要な依存関係がインストールされていること

2. **依存関係のインストール**

   ```bash
   # ZMQライブラリ
   npm install zeromq

   # CapnProtoライブラリ
   npm install capnp
   ```

### 使用方法

1. **環境変数を設定**

   ```bash
   export OPENPILOT_ZMQ_ENDPOINT=tcp://192.168.1.100:8001
   export OPENPILOT_DEBUG_LOGGING=true
   ```

2. **サンプルを実行**
   ```bash
   cd examples
   npx tsx openpilot-can-example.ts
   ```

### 実行例

```
🚀 Starting openpilot CAN Monitor
   Endpoint: tcp://192.168.1.100:8001
   Topic: can
   Press Ctrl+C to stop

✅ Connected to openpilot
📡 Waiting for CAN messages...

📊 0x025 [8] 0x80 0x00 0x12 0x34 0x00 0x00 0x00 0x00 | ステアリング角度
   └─ 角度: -12.5°
📊 0x3BC [8] 0x1E 0x00 0x00 0x00 0x00 0x00 0x00 0x00 | 車両速度
   └─ 速度: 30.0 km/h
📊 0x224 [8] 0x40 0x00 0x00 0x00 0x00 0x00 0x00 0x00 | ブレーキペダル
   └─ ブレーキ圧: 64

📈 === Statistics ===
Runtime: 10.2s
Total frames: 1,245
Frame rate: 122.1 fps
Active message IDs: 7

Message Details:
  0x025 ステアリング角度     |   204 frames |   20.0 Hz
  0x3BC 車両速度           |   102 frames |   10.0 Hz
  0x224 ブレーキペダル      |    51 frames |    5.0 Hz
  0x399 カメラ物体検知      |   408 frames |   40.0 Hz
  0x3B6 アクセルペダル      |   204 frames |   20.0 Hz
  0x1C4 エンジン情報        |   204 frames |   20.0 Hz
  0x412 バッテリー電圧      |    72 frames |    7.1 Hz
```

### 機能

- **リアルタイム受信**: openpilotからのZMQ配信を受信
- **データ解析**: 主要なメッセージの物理値変換
- **統計情報**: フレーム率、メッセージ頻度の表示
- **フィルタリング**: 重要なメッセージIDのみ表示
- **DBC統合**: DBCファイルがある場合は自動読み込み

### 設定のカスタマイズ

コード内の`config`オブジェクトを編集することで設定を変更できます：

```typescript
const config = {
  zmqEndpoint: 'tcp://192.168.1.100:8001', // openpilotのアドレス
  zmqTopic: 'can', // ZMQトピック
  enableDebugLogging: true, // デバッグログ有効化
  idFilter: [0x025, 0x3bc, 0x224], // 監視対象のメッセージID
};
```

### 終了方法

`Ctrl+C`で終了します。統計情報が最後に表示されます。

### トラブルシューティング

1. **接続エラー**

   - openpilotが動作しているか確認
   - IPアドレスとポート番号が正しいか確認

2. **データが来ない**

   - ZMQトピック名が正しいか確認
   - openpilot側でCANデータが配信されているか確認

3. **依存関係エラー**
   - `npm install zeromq capnp`で依存関係をインストール
   - システムレベルのライブラリが必要な場合があります

詳細なセットアップ手順は`docs/openpilot-setup-guide.md`を参照してください。
