import { CANFrame } from '@/types/can';

// WebSocketメッセージの基本型
export type WebSocketMessageType =
  | 'subscribe'
  | 'unsubscribe'
  | 'start'
  | 'stop'
  | 'heartbeat';

// WebSocketメッセージの型定義（ジェネリクス対応）
export interface WebSocketMessage<T = WebSocketMessageType> {
  type: T;
  messageIds?: number[];
  payload?: Record<string, unknown>;
}

// WebSocketレスポンスの基本型
export type WebSocketResponseType = 'frame' | 'status' | 'error' | 'heartbeat';

// WebSocketレスポンスの型定義（ジェネリクス対応）
export interface WebSocketResponse<T = WebSocketResponseData> {
  type: WebSocketResponseType;
  data?: T;
  error?: string;
  timestamp?: number;
}

export interface WebSocketResponseData {
  connected?: boolean;
  interface?: string;
  streaming?: boolean;
  frame?: CANFrame;
}

// WebSocket接続の状態
export type WebSocketStatus =
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'error';

// WebSocketフックの設定
export interface WebSocketConfig {
  url: string;
  reconnectInterval: number;
  maxReconnectAttempts: number;
  heartbeatInterval: number;
  connectionTimeout?: number;
}

// WebSocketフックの戻り値
export interface WebSocketHookReturn {
  // 接続状態
  status: WebSocketStatus;
  isConnected: boolean;

  // データ
  lastFrame: CANFrame | null;
  frames: CANFrame[];

  // エラー
  error: Error | null;

  // 制御関数
  connect: () => void;
  disconnect: () => void;
  startStreaming: () => void;
  stopStreaming: () => void;
  subscribe: (messageIds: number[]) => void;
  unsubscribe: (messageIds: number[]) => void;

  // 統計情報
  stats: {
    framesReceived: number;
    reconnectAttempts: number;
    lastHeartbeat: number | null;
    bytesReceived: number;
    lastError: string | null;
    lastErrorTime: number | null;
  };
}

// データマップのジェネリクス型
export type DataMap<K, V> = Map<K, V>;
export type FrameDataMap = DataMap<number, CANFrame>;
export type HistoricalDataMap = DataMap<number, CANFrame[]>;

// リアルタイムデータコンテキストの型
export interface RealtimeDataContextType {
  // 接続状態
  isConnected: boolean;
  isStreaming: boolean;
  status: WebSocketStatus;

  // データ
  currentData: FrameDataMap;
  historicalData: HistoricalDataMap;

  // 制御関数
  startRealtime: () => void;
  stopRealtime: () => void;
  subscribe: (messageIds: number[]) => void;
  unsubscribe: (messageIds: number[]) => void;

  // 統計情報
  stats: RealtimeStats;
}

// 統計情報のジェネリクス型
export interface RealtimeStats {
  totalFrames: number;
  framesPerSecond: number;
  uniqueMessages: number;
  connectionUptime: number;
  lastUpdate: number;
  dataPoints: Record<number, number>;
}

// WebSocketイベントの型定義
export interface WebSocketEvent<T = Record<string, unknown>> {
  type: string;
  data: T;
  timestamp: number;
}

// WebSocketエラーの型定義
export interface WebSocketError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}
