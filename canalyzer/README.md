# CANalyzer

リアルタイムCANバス解析ツール - DBCファイルベースのCANメッセージ・シグナル解析とWebSocket統合によるリアルタイムデータ処理

## 主な機能

### 📊 CANデータ解析

- **DBCファイル対応**: 標準DBC形式のアップロードと解析
- **シグナル解析**: CANフレームからシグナル値の自動抽出
- **メッセージ名表示**: 各CANフレームのメッセージ名とシグナル情報を表示
- **リアルタイムグラフ**: 時系列データのリアルタイム可視化

### 🔄 WebSocketリアルタイム通信

- **双方向通信**: WebSocketによるCANフレーム送受信
- **自動再接続**: 接続エラー時の自動復旧機能
- **ストリーミング制御**: クライアント接続状況に基づく自動開始/停止

### ⚙️ 柔軟なCANインターフェース

- **Virtual**: 仮想CANデータ生成（開発・デモ用）
- **Null**: データ生成なし（テスト用）
- **Hardware**: 実CANハードウェア対応（将来実装予定）
- **Openpilot**: openpilot連携によるリアルタイムCANデータ受信

### 🛠️ デバッグ・診断機能

- **未定義メッセージ可視化**: DBCに定義されていないフレームの詳細表示
- **メッセージID比較**: 受信データとDBC定義の比較機能
- **統計情報**: フレーム受信数、接続時間、FPS等の詳細統計

## クイックスタート

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 開発サーバーの起動

```bash
npm run dev
```

サーバーが起動すると以下が利用可能になります：

- **Webアプリケーション**: [http://localhost:3000](http://localhost:3000)
- **WebSocketサーバー**: `ws://localhost:3000/ws`

### 3. CANインターフェース設定（オプション）

環境変数でCANデータ生成を制御できます：

```bash
# .env.localファイルを作成
echo "CAN_INTERFACE_TYPE=virtual" > .env.local
```

## 設定オプション

### 環境変数

`.env.local`ファイルで以下の設定が可能です：

```env
# CANインターフェース設定
CAN_INTERFACE_TYPE=virtual    # null(デフォルト), virtual, hardware, openpilot

# === openpilot設定 ===
OPENPILOT_ZMQ_ENDPOINT=tcp://192.168.1.100:8001
OPENPILOT_ZMQ_TOPIC=can
OPENPILOT_MAX_RECONNECT_ATTEMPTS=10
OPENPILOT_RECONNECT_INTERVAL=5000
OPENPILOT_BUS_FILTER=0,1,2  # 特定バスのみ受信
OPENPILOT_ID_FILTER=0x100,0x200,0x300  # 特定IDのみ受信
OPENPILOT_DEBUG_LOGGING=false

# WebSocket接続設定
NEXT_PUBLIC_WS_URL=ws://localhost:3000/ws
```

#### CAN_INTERFACE_TYPEの値

- `null` (デフォルト): CANデータを生成しない（テスト用）
- `virtual`: 仮想CANデータを生成（エンジン、車両運動、ボディ情報）
- `hardware`: 実際のCANハードウェアを使用（未実装）
- `openpilot`: openpilotからZMQ経由でリアルタイムCANデータを受信

## 使用方法

### 1. DBCファイルのアップロード

1. ホーム画面で「DBCファイルをアップロード」をクリック
2. `.dbc`ファイルを選択してアップロード
3. パース結果を確認

### 2. CANデータの表示

1. **静的解析**: アップロードしたDBCファイルでサンプルデータを解析
2. **リアルタイム表示**: WebSocket経由でリアルタイムデータを受信・表示

### 3. リアルタイムモード

1. 「CAN値表示」ページに移動
2. 「リアルタイム開始」ボタンをクリック
3. WebSocket接続によるリアルタイムデータ受信を開始

### 4. CANフレーム送信

WebSocketクライアントからCANフレームを送信：

```bash
# サンプル送信スクリプトの実行（作成後）
npx tsx examples/websocket-can-sender.ts
```

### 5. openpilot連携

openpilotとの連携を有効にする：

1. `.env.local`ファイルに以下を設定：

   ```env
   CAN_INTERFACE_TYPE=openpilot
   OPENPILOT_ZMQ_ENDPOINT=tcp://192.168.1.100:8001
   ```

2. openpilotデバイスのIPアドレスを正しく設定
3. 開発サーバーを再起動
4. WebSocketクライアントがopenpilotからのリアルタイムCANデータを受信開始

#### openpilot設定のポイント

- **ZMQエンドポイント**: openpilotが動作するデバイスのIPアドレス
- **フィルタリング**: 特定のバスやCANIDのみを受信して負荷を軽減
- **再接続機能**: 接続エラー時の自動復旧
- **デバッグログ**: 詳細なログ出力で問題診断をサポート

## プロジェクト構造

```
canalyzer/
├── src/
│   ├── app/                 # Next.js App Router ページ
│   ├── components/          # Reactコンポーネント
│   ├── contexts/           # React Context（DBC、リアルタイムデータ）
│   ├── hooks/              # カスタムフック（WebSocket等）
│   ├── lib/                # ユーティリティライブラリ
│   ├── server/             # WebSocketサーバー実装
│   └── types/              # TypeScript型定義
├── docs/                   # 詳細技術ドキュメント
├── examples/               # サンプルコード
└── server.js              # メインサーバーエントリーポイント
```

## 開発

### テスト実行

```bash
npm test                    # 全テスト実行
npm run test:watch         # 監視モードでテスト実行
npm run test:coverage      # カバレッジ計測付きテスト
```

### 品質チェック

```bash
npm run lint               # ESLint実行
npx tsc --noEmit          # TypeScript型チェック
npm run build             # プロダクションビルド
```

## 技術スタック

- **フロントエンド**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **バックエンド**: Node.js, WebSocket (ws)
- **CANライブラリ**: @montra-connect/dbc-parser
- **CANインターフェース**: 統一されたICANInterfaceによる抽象化
- **openpilot連携**: ZMQ (zeromq) + CapnProto (将来実装)
- **テスト**: Jest, React Testing Library
- **グラフ表示**: Recharts

## 詳細ドキュメント

- [WebSocket統合ガイド](./docs/websocket-integration.md)
- [データ構造設計](./docs/data-structures.md)
- [DBCフォーマット仕様](./docs/dbc-format.md)
- [openpilot連携ガイド](./docs/openpilot-integration.md)

## パフォーマンス最適化

### 高頻度CANメッセージ処理

- **バックプレッシャー対応**: クライアントのWebSocketバッファ状態を監視
- **メッセージキューイング**: 高負荷時の適切なメッセージ配信制御
- **フィルタリング**: 不要なメッセージの早期除外によるCPU使用率削減

### 複数クライアント対応

- **購読管理**: 各クライアントの個別フィルタリング設定
- **ハートビート監視**: 無効なクライアント接続の自動切断
- **メモリ効率**: WeakMapを使用したクライアント情報管理

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。
