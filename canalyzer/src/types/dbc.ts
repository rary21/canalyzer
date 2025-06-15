// DBCファイル関連の型定義

// CANノード
export interface CANNode {
  name: string;
  comment?: string;
}

// CANシグナル
export interface CANSignal {
  name: string;
  startBit: number;
  length: number;
  endianness: 'little' | 'big';  // 1=little, 0=big
  signed: boolean;
  factor: number;
  offset: number;
  min: number;
  max: number;
  unit: string;
  receivingNodes: string[];
  values?: Record<number, string>;  // 値の説明 (例: 0: "Park", 1: "Reverse")
  comment?: string;
}

// CANメッセージ
export interface CANMessage {
  id: number;  // CAN ID (10進数)
  name: string;
  length: number;  // バイト数 (0-8)
  sendingNode: string;
  signals: CANSignal[];
  comment?: string;
}

// DBCデータベース
export interface DBCDatabase {
  version: string;
  nodes: CANNode[];
  messages: Map<number, CANMessage>;  // CAN IDをキーとするマップ
  baudrate?: number;
}

// パースエラー
export interface ParseError {
  line: number;
  message: string;
  type: 'SYNTAX_ERROR' | 'INVALID_VALUE' | 'MISSING_REQUIRED';
}

// パース警告
export interface ParseWarning {
  line: number;
  message: string;
  type: 'UNKNOWN_KEYWORD' | 'DUPLICATE_DEFINITION' | 'UNSUPPORTED_FEATURE';
}

// パース結果
export interface ParseResult {
  success: boolean;
  database?: DBCDatabase;
  errors: ParseError[];
  warnings: ParseWarning[];
}