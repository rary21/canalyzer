import { CANFrame } from '@/types/can';

// WebSocketメッセージの型定義
export interface WebSocketMessage {
  type: 'subscribe' | 'unsubscribe' | 'start' | 'stop' | 'heartbeat';
  messageIds?: number[];
}

export interface WebSocketResponse {
  type: 'frame' | 'status' | 'error' | 'heartbeat';
  data?: WebSocketResponseData;
  error?: string;
}

export interface WebSocketResponseData {
  connected?: boolean;
  interface?: string;
  streaming?: boolean;
  frame?: CANFrame;
}

// WebSocket接続の状態
export type WebSocketStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

// WebSocketフックの設定
export interface WebSocketConfig {
  url: string;
  reconnectInterval: number;
  maxReconnectAttempts: number;
  heartbeatInterval: number;
}

// WebSocketフックの戻り値
export interface WebSocketHookReturn {
  // 接続状態
  status: WebSocketStatus;
  isConnected: boolean;
  
  // データ
  lastFrame: CANFrame | null;
  frames: CANFrame[];
  
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
  };
}

// リアルタイムデータコンテキストの型
export interface RealtimeDataContextType {
  // 接続状態
  isConnected: boolean;
  isStreaming: boolean;
  status: WebSocketStatus;
  
  // データ
  currentData: Map<number, CANFrame>;
  historicalData: Map<number, CANFrame[]>;
  
  // 制御関数
  startRealtime: () => void;
  stopRealtime: () => void;
  subscribe: (messageIds: number[]) => void;
  unsubscribe: (messageIds: number[]) => void;
  
  // 統計情報
  stats: RealtimeStats;
}

export interface RealtimeStats {
  totalFrames: number;
  framesPerSecond: number;
  uniqueMessages: number;
  connectionUptime: number;
  lastUpdate: number;
  dataPoints: { [messageId: number]: number };
}