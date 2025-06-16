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
- **None**: データ生成なし（デフォルト）
- **Hardware**: 実CANハードウェア対応（将来実装予定）

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
CAN_INTERFACE_TYPE=none    # none, virtual, hardware
CAN_DEVICE_NAME=can0       # ハードウェア使用時のデバイス名
CAN_BITRATE=500000         # CANバス通信速度

# WebSocket接続設定
NEXT_PUBLIC_WS_URL=ws://localhost:3000/ws
```

#### CAN_INTERFACE_TYPEの値

- `none` (デフォルト): CANデータを生成しない
- `virtual`: 仮想CANデータを生成（エンジン、車両運動、ボディ情報）
- `hardware`: 実際のCANハードウェアを使用（未実装）

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
# サンプル送信スクリプトの実行
node examples/websocket-can-sender.js
```

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
- **テスト**: Jest, React Testing Library
- **グラフ表示**: Recharts

## 詳細ドキュメント

- [WebSocket統合ガイド](./docs/websocket-integration.md)
- [データ構造設計](./docs/data-structures.md)
- [DBCフォーマット仕様](./docs/dbc-format.md)

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。
