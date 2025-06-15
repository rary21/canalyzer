// CAN受信データ関連の型定義

/**
 * CANフレーム
 * 受信したCANメッセージの基本構造
 */
export interface CANFrame {
  /** CAN ID (11bit標準または29bit拡張) */
  id: number;
  /** データ部分（最大8バイト） */
  data: Uint8Array;
  /** 受信タイムスタンプ */
  timestamp: number;
  /** 拡張フレーム識別子（29bit）かどうか */
  extended: boolean;
  /** データ長（バイト） */
  dlc: number;
}

/**
 * 解析済みCANシグナル値
 * DBCメッセージ定義を使って抽出された物理値
 */
export interface CANValue {
  /** シグナル名 */
  signalName: string;
  /** メッセージ名 */
  messageName: string;
  /** 生の値（スケーリング前） */
  rawValue: number;
  /** 物理値（factor/offset適用後） */
  physicalValue: number;
  /** 単位 */
  unit: string;
  /** タイムスタンプ */
  timestamp: number;
  /** 値の説明（存在する場合） */
  description?: string;
}

/**
 * CANデータセット
 * 複数のCANフレームとその解析結果を格納するコレクション
 */
export interface CANDataSet {
  /** データセット名 */
  name: string;
  /** 作成日時 */
  createdAt: number;
  /** CANフレームのリスト */
  frames: CANFrame[];
  /** 解析済みシグナル値のリスト */
  values: CANValue[];
  /** データセットの説明 */
  description?: string;
}

/**
 * CANフレーム解析結果
 * 1つのフレームから抽出されたシグナル値の集合
 */
export interface CANFrameAnalysis {
  /** 元のフレーム */
  frame: CANFrame;
  /** メッセージ名 */
  messageName: string;
  /** 抽出されたシグナル値 */
  signals: CANValue[];
  /** 解析エラー（存在する場合） */
  error?: string;
}

/**
 * 解析設定
 * CANデータパーサーの動作設定
 */
export interface ParseConfig {
  /** 時間範囲フィルター（開始時間） */
  timeRangeStart?: number;
  /** 時間範囲フィルター（終了時間） */
  timeRangeEnd?: number;
  /** 対象CAN ID一覧（未指定の場合は全て） */
  targetIds?: number[];
  /** シグナル名フィルター */
  signalFilter?: string[];
  /** 無効値を除外するかどうか */
  excludeInvalidValues?: boolean;
}

/**
 * ビットフィールド情報
 * シグナル抽出時のビット操作に使用
 */
export interface BitField {
  /** 開始ビット位置 */
  startBit: number;
  /** ビット長 */
  length: number;
  /** エンディアン */
  endianness: 'little' | 'big';
  /** 符号付きかどうか */
  signed: boolean;
}