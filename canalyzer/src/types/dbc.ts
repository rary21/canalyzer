// DBCファイル関連の型定義

// 外部ライブラリ（@montra-connect/dbc-parser）から返されるデータの型定義
export interface DbcDataType {
  version?: string;
  nodes?: string[];
  messages?: SignalMap<DbcMessage>;
}

export interface DbcMessage {
  id: number;
  dlc: number;
  sendingNode?: string;
  description?: string;
  signals?: SignalMap;
}

export interface DbcSignal {
  startBit: number;
  length: number;
  endian: 'Intel' | 'Motorola';
  signed: boolean;
  factor: number;
  offset: number;
  min: number;
  max: number;
  unit?: string;
  receivingNodes?: string[];
  valueTable?: Map<number, string>; // これはMapのまま保持（外部ライブラリとの互換性のため）
  description?: string;
}

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
  endianness: 'little' | 'big'; // 1=little, 0=big
  signed: boolean;
  factor: number;
  offset: number;
  min: number;
  max: number;
  unit: string;
  receivingNodes: string[];
  values?: ValueTable; // 値の説明 (例: 0: "Park", 1: "Reverse")
  comment?: string;
}

// CANメッセージ
export interface CANMessage {
  id: number; // CAN ID (10進数)
  name: string;
  length: number; // バイト数 (0-8)
  sendingNode: string;
  signals: CANSignal[];
  comment?: string;
}

// DBCデータベース
export interface DBCDatabase {
  version: string;
  nodes: CANNode[];
  messages: MessageMap; // CAN IDをキーとするマップ
  baudrate?: number;
}

// パースエラー
export interface ParseError {
  line: number;
  message: string;
  type:
    | 'SYNTAX_ERROR'
    | 'INVALID_VALUE'
    | 'MISSING_REQUIRED'
    | 'FILE_FORMAT_ERROR'
    | 'FILE_SIZE_ERROR'
    | 'FILE_READ_ERROR';
}

// パース警告
export interface ParseWarning {
  line: number;
  message: string;
  type: 'UNKNOWN_KEYWORD' | 'DUPLICATE_DEFINITION' | 'UNSUPPORTED_FEATURE';
}

// パース結果（ジェネリクス対応）
export interface ParseResult<T = DBCDatabase> {
  success: boolean;
  database?: T;
  errors: ParseError[];
  warnings: ParseWarning[];
}

// 値テーブルのジェネリクス型
export type ValueTable<T = string> = Record<number, T>;

// メッセージマップのジェネリクス型
export type MessageMap<T = CANMessage> = Map<number, T>;

// シグナルマップのジェネリクス型
export type SignalMap<T = DbcSignal> = Map<string, T>;
