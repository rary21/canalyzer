#!/usr/bin/env node

/**
 * WebSocket CAN送信サンプル
 * 固定のCANフレームを定期的に送信するシンプルなクライアント
 */

const WebSocket = require('ws');

// 接続設定
const WS_URL = 'ws://localhost:3000/ws';
const SEND_INTERVAL = 1000; // 1秒間隔

// 送信するサンプルCANフレーム
const SAMPLE_FRAMES = [
  {
    id: 0x123,
    data: new Uint8Array([0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08]),
    extended: false,
    dlc: 8,
  },
  {
    id: 0x456,
    data: new Uint8Array([0xff, 0xee, 0xdd, 0xcc]),
    extended: false,
    dlc: 4,
  },
  {
    id: 0x789,
    data: new Uint8Array([0xaa, 0xbb]),
    extended: false,
    dlc: 2,
  },
];

class CANSender {
  constructor(url) {
    this.url = url;
    this.ws = null;
    this.sendInterval = null;
    this.frameIndex = 0;
  }

  connect() {
    console.log(`WebSocketに接続中: ${this.url}`);

    this.ws = new WebSocket(this.url);

    this.ws.on('open', () => {
      console.log('✓ WebSocket接続が確立されました');
      this.startSending();
    });

    this.ws.on('message', (data) => {
      try {
        const response = JSON.parse(data.toString());
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

    this.ws.on('error', (error) => {
      console.error('✗ WebSocketエラー:', error.message);
    });
  }

  startSending() {
    console.log(`CANフレーム送信を開始 (${SEND_INTERVAL}ms間隔)`);

    this.sendInterval = setInterval(() => {
      this.sendNextFrame();
    }, SEND_INTERVAL);
  }

  stopSending() {
    if (this.sendInterval) {
      clearInterval(this.sendInterval);
      this.sendInterval = null;
      console.log('CANフレーム送信を停止');
    }
  }

  sendNextFrame() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.log('⚠ WebSocket未接続のため送信をスキップ');
      return;
    }

    // サンプルフレームから順番に送信
    const frame = SAMPLE_FRAMES[this.frameIndex];
    this.frameIndex = (this.frameIndex + 1) % SAMPLE_FRAMES.length;

    // タイムスタンプを追加
    const frameWithTimestamp = {
      ...frame,
      timestamp: Date.now(),
    };

    // WebSocketメッセージとして送信
    const message = {
      type: 'send_frame',
      frame: frameWithTimestamp,
    };

    try {
      this.ws.send(JSON.stringify(message));
      console.log(
        `→ 送信: ID=0x${frame.id.toString(16).toUpperCase().padStart(3, '0')}, データ=[${Array.from(
          frame.data
        )
          .map((b) => '0x' + b.toString(16).toUpperCase().padStart(2, '0'))
          .join(', ')}], DLC=${frame.dlc}`
      );
    } catch (error) {
      console.error('✗ 送信エラー:', error.message);
    }
  }

  disconnect() {
    this.stopSending();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

// メイン実行
function main() {
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

module.exports = { CANSender };
