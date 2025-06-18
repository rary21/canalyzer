# WebSocket CAN送信サンプル

このディレクトリには、WebSocketを使用してCANフレームを送信するシンプルなサンプルプログラムが含まれています。

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
