# CAN信号データ構造設計

## 概要

DBCファイルから読み込んだCAN通信の定義情報を表現するためのTypeScript型定義を設計します。

## 基本データ型

### 1. CANノード

```typescript
interface CANNode {
  name: string;
  comment?: string;
}
```

### 2. CANシグナル

```typescript
interface CANSignal {
  name: string;
  startBit: number;
  length: number;
  endianness: 'little' | 'big'; // 1=little, 0=big
  signed: boolean;
  factor: number;
  offset: number;
  min: number;
  max: number;
  unit: string;
  receivingNodes: string[];
  values?: Record<number, string>; // 値の説明 (例: 0: "Park", 1: "Reverse")
  comment?: string;
}
```

### 3. CANメッセージ

```typescript
interface CANMessage {
  id: number; // CAN ID (10進数)
  name: string;
  length: number; // バイト数 (0-8)
  sendingNode: string;
  signals: CANSignal[];
  comment?: string;
}
```

### 4. DBCデータベース

```typescript
interface DBCDatabase {
  version: string;
  nodes: CANNode[];
  messages: Map<number, CANMessage>; // CAN IDをキーとするマップ
  baudrate?: number;
}
```

## パース結果とエラー情報

### パース結果

```typescript
interface ParseResult {
  success: boolean;
  database?: DBCDatabase;
  errors: ParseError[];
  warnings: ParseWarning[];
}

interface ParseError {
  line: number;
  message: string;
  type: 'SYNTAX_ERROR' | 'INVALID_VALUE' | 'MISSING_REQUIRED';
}

interface ParseWarning {
  line: number;
  message: string;
  type: 'UNKNOWN_KEYWORD' | 'DUPLICATE_DEFINITION' | 'UNSUPPORTED_FEATURE';
}
```

## リアルタイムデータ表示用

### CANフレーム（実際の通信データ）

```typescript
interface CANFrame {
  timestamp: number; // ミリ秒単位のタイムスタンプ
  id: number; // CAN ID
  data: Uint8Array; // 実際のデータバイト (最大8バイト)
}
```

### デコード済みシグナル値

```typescript
interface DecodedSignal {
  name: string;
  rawValue: number; // ビット値
  physicalValue: number; // factor/offset適用後の物理値
  unit: string;
  valueDescription?: string; // 値の説明がある場合
}

interface DecodedFrame {
  timestamp: number;
  messageId: number;
  messageName: string;
  signals: DecodedSignal[];
}
```

## グラフ表示用データ構造

```typescript
interface SignalTimeSeries {
  signalName: string;
  messageId: number;
  unit: string;
  data: Array<{
    timestamp: number;
    value: number;
  }>;
}

interface GraphDataset {
  signals: SignalTimeSeries[];
  timeRange: {
    start: number;
    end: number;
  };
}
```

## 実装の優先順位

1. **フェーズ1（最小限の実装）**:

   - CANMessage, CANSignal の基本的なパース
   - メッセージIDとシグナル名の取得

2. **フェーズ2（基本機能）**:

   - 物理値への変換（factor/offset）
   - エンディアン対応
   - 値の説明（VAL\_）のパース

3. **フェーズ3（拡張機能）**:
   - コメントのパース
   - 属性定義のサポート
   - マルチプレクスシグナル対応
