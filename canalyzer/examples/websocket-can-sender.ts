#!/usr/bin/env node

/**
 * WebSocket CAN送信サンプル
 * 固定のCANフレームを定期的に送信するシンプルなクライアント
 */

import WebSocket from 'ws';

// 接続設定
const WS_URL = 'ws://localhost:3000/ws';
const SEND_INTERVAL = 1000; // 1秒間隔

// CANフレーム型定義
interface CANFrame {
  id: number;
  data: Uint8Array;
  extended: boolean;
  dlc: number;
  timestamp?: number;
}

// WebSocketメッセージ型定義
interface WebSocketMessage {
  type: string;
  frame?: CANFrame;
}

interface WebSocketResponse {
  type: string;
  data?: any;
  error?: string;
}

// 送信するサンプルCANフレーム
const SAMPLE_FRAMES: CANFrame[] = [
  {
    id: 170,
    data: new Uint8Array([0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08]),
    extended: false,
    dlc: 8,
  },
  {
    id: 170,
    data: new Uint8Array([0x01, 0x82, 0x03, 0x84, 0x05, 0x86, 0x07, 0x88]),
    extended: false,
    dlc: 8,
  },
];

class CANSender {
  private url: string;
  private ws: WebSocket | null = null;
  private sendInterval: NodeJS.Timeout | null = null;
  private frameIndex: number = 0;

  constructor(url: string) {
    this.url = url;
  }

  connect(): void {
    console.log(`WebSocketに接続中: ${this.url}`);

    this.ws = new WebSocket(this.url);

    this.ws.on('open', () => {
      console.log('✓ WebSocket接続が確立されました');
      this.startSending();
    });

    this.ws.on('message', (data: WebSocket.Data) => {
      try {
        const response: WebSocketResponse = JSON.parse(data.toString());
        console.log(
          '← 受信:',
          response.type,
          response.data || response.error || ''
        );
      } catch (error) {
        console.log('← 受信 (生データ):', data.toString());
      }
    });

    this.ws.on('close', () => {
      console.log('✗ WebSocket接続が閉じられました');
      this.stopSending();
    });

    this.ws.on('error', (error: Error) => {
      console.error('✗ WebSocketエラー:', error.message);
    });
  }

  private startSending(): void {
    console.log(`CANフレーム送信を開始 (${SEND_INTERVAL}ms間隔)`);

    this.sendInterval = setInterval(() => {
      this.sendNextFrame();
    }, SEND_INTERVAL);
  }

  private stopSending(): void {
    if (this.sendInterval) {
      clearInterval(this.sendInterval);
      this.sendInterval = null;
      console.log('CANフレーム送信を停止');
    }
  }

  private sendNextFrame(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.log('⚠ WebSocket未接続のため送信をスキップ');
      return;
    }

    // サンプルフレームから順番に送信
    const frame = SAMPLE_FRAMES[this.frameIndex];
    this.frameIndex = (this.frameIndex + 1) % SAMPLE_FRAMES.length;

    // タイムスタンプを追加
    const frameWithTimestamp: CANFrame = {
      ...frame,
      timestamp: Date.now(),
    };

    // WebSocketメッセージとして送信
    const message: WebSocketMessage = {
      type: 'send_frame',
      frame: frameWithTimestamp,
    };

    try {
      this.ws.send(JSON.stringify(message));
      console.log(
        `→ 送信: ID=0x${frame.id
          .toString(16)
          .toUpperCase()
          .padStart(3, '0')}, データ=[${Array.from(frame.data)
          .map((b) => '0x' + b.toString(16).toUpperCase().padStart(2, '0'))
          .join(', ')}], DLC=${frame.dlc}`
      );
    } catch (error) {
      console.error('✗ 送信エラー:', (error as Error).message);
    }
  }

  disconnect(): void {
    this.stopSending();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

// メイン実行
function main(): void {
  console.log('=== WebSocket CAN送信サンプル ===\n');

  const sender = new CANSender(WS_URL);

  // Ctrl+Cで終了
  process.on('SIGINT', () => {
    console.log('\n終了中...');
    sender.disconnect();
    process.exit(0);
  });

  // 接続開始
  sender.connect();
}

// コマンドライン引数の処理
if (require.main === module) {
  main();
}

export { CANSender };