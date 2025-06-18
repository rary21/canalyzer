import { Server } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { CANFrame } from '../types/can';

// 何もしないCANインターフェース
class NullCANInterface {
  private isRunning = false;
  private frameListeners: ((frame: CANFrame) => void)[] = [];
  private errorListeners: ((error: Error) => void)[] = [];

  async start(): Promise<void> {
    this.isRunning = true;
    console.log('Null CAN interface started (no data will be generated)');
  }

  async stop(): Promise<void> {
    this.isRunning = false;
    console.log('Null CAN interface stopped');
  }

  onFrame(callback: (frame: CANFrame) => void): void {
    this.frameListeners.push(callback);
  }

  onError(callback: (error: Error) => void): void {
    this.errorListeners.push(callback);
  }

  isConnected(): boolean {
    return this.isRunning;
  }

  getName(): string {
    return 'Null CAN Interface';
  }
}

class VirtualCANInterface {
  private isRunning = false;
  private frameListeners: ((frame: CANFrame) => void)[] = [];
  private errorListeners: ((error: Error) => void)[] = [];
  private intervalId: NodeJS.Timeout | null = null;

  async start(): Promise<void> {
    if (this.isRunning) return;

    this.isRunning = true;
    console.log('Virtual CAN interface started');

    // 100msごとに仮想CANデータを生成
    this.intervalId = setInterval(() => {
      this.generateVirtualFrames();
    }, 100);
  }

  async stop(): Promise<void> {
    if (!this.isRunning) return;

    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    console.log('Virtual CAN interface stopped');
  }

  onFrame(callback: (frame: CANFrame) => void): void {
    this.frameListeners.push(callback);
  }

  onError(callback: (error: Error) => void): void {
    this.errorListeners.push(callback);
  }

  isConnected(): boolean {
    return this.isRunning;
  }

  getName(): string {
    return 'Virtual CAN Interface';
  }

  private generateVirtualFrames(): void {
    const timestamp = Date.now();
    const time = timestamp / 1000;

    // エンジンステータスメッセージ (ID: 0x100)
    const engineFrame: CANFrame = {
      id: 0x100,
      data: new Uint8Array([
        // RPM: 800-6000 (変動)
        Math.floor(800 + Math.sin(time * 0.5) * 2600 + Math.random() * 100) &
          0xff,
        (Math.floor(800 + Math.sin(time * 0.5) * 2600 + Math.random() * 100) >>
          8) &
          0xff,
        // 温度: 20-90°C (徐々に上昇)
        Math.min(90, 20 + time * 0.1) & 0xff,
        // 燃料レベル: 0-100% (徐々に減少)
        Math.max(0, 100 - time * 0.05) & 0xff,
        0,
        0,
        0,
        0,
      ]),
      timestamp,
      extended: false,
      dlc: 8,
    };

    // 車両動作メッセージ (ID: 0x200)
    const motionFrame: CANFrame = {
      id: 0x200,
      data: new Uint8Array([
        // 速度: 0-200 km/h (変動)
        Math.floor(Math.max(0, Math.sin(time * 0.3) * 100 + 50)) & 0xff,
        (Math.floor(Math.max(0, Math.sin(time * 0.3) * 100 + 50)) >> 8) & 0xff,
        // アクセル: 0-100%
        Math.floor(Math.max(0, Math.sin(time * 0.3) * 50 + 50)) & 0xff,
        // ブレーキ: 0-100%
        Math.floor(Math.max(0, -Math.sin(time * 0.3) * 50 + 10)) & 0xff,
        // ステアリング角度: -720 to +720
        Math.floor(Math.sin(time * 0.2) * 360) & 0xff,
        (Math.floor(Math.sin(time * 0.2) * 360) >> 8) & 0xff,
        0,
        0,
      ]),
      timestamp,
      extended: false,
      dlc: 8,
    };

    // ボディステータスメッセージ (ID: 0x300)
    const bodyFrame: CANFrame = {
      id: 0x300,
      data: new Uint8Array([
        // ドア状態とライト状態（ランダムに変化）
        Math.random() > 0.95 ? 0xff : 0x00,
        // バッテリー電圧: 11.5-14.5V
        Math.floor((11.5 + Math.random() * 3) * 10) & 0xff,
        0,
        0,
        0,
        0,
        0,
        0,
      ]),
      timestamp,
      extended: false,
      dlc: 8,
    };

    // フレームをリスナーに通知
    this.frameListeners.forEach((listener) => {
      listener(engineFrame);
      listener(motionFrame);
      listener(bodyFrame);
    });
  }
}

// CANインターフェースファクトリー
class CANInterfaceFactory {
  static create(type = 'none'): NullCANInterface | VirtualCANInterface {
    switch (type.toLowerCase()) {
      case 'virtual':
        console.log('Creating Virtual CAN Interface');
        return new VirtualCANInterface();
      case 'hardware':
        console.log('Creating Hardware CAN Interface (not implemented yet)');
        // TODO: 将来的にSocketCANインターフェースを実装
        throw new Error('Hardware CAN Interface not implemented yet');
      case 'none':
      default:
        console.log('Creating Null CAN Interface');
        return new NullCANInterface();
    }
  }
}

interface WebSocketMessage {
  type:
    | 'subscribe'
    | 'unsubscribe'
    | 'start'
    | 'stop'
    | 'heartbeat'
    | 'send_frame';
  messageIds?: number[];
  frame?: {
    id: number;
    data?: number[] | Uint8Array | Record<string, number>;
    timestamp?: number;
    extended?: boolean;
    dlc?: number;
  };
}

interface WebSocketResponse {
  type: 'frame' | 'status' | 'error' | 'heartbeat' | 'send_frame_response';
  data?: {
    connected?: boolean;
    interface?: string;
    streaming?: boolean;
    frame?: CANFrame;
  };
  error?: string;
  success?: boolean;
  frame?: CANFrame;
}

class CANWebSocketServer {
  private wss: WebSocketServer;
  private canInterface: NullCANInterface | VirtualCANInterface;
  private clients: Map<WebSocket, Set<number>> = new Map();
  private isStreaming = false;

  constructor(server: Server) {
    this.wss = new WebSocketServer({ server, path: '/ws' });

    // 環境変数からCANインターフェースタイプを取得（デフォルト: none）
    const interfaceType = process.env.CAN_INTERFACE_TYPE || 'none';
    console.log(`Initializing CAN interface with type: ${interfaceType}`);

    this.canInterface = CANInterfaceFactory.create(interfaceType);

    this.setupWebSocketServer();
    this.setupCANInterface();
  }

  private setupWebSocketServer(): void {
    this.wss.on('connection', (ws: WebSocket) => {
      console.log('New WebSocket client connected');

      // 新しいクライアントを登録（全メッセージを購読）
      this.clients.set(ws, new Set());

      // 接続状態を送信
      this.sendToClient(ws, {
        type: 'status',
        data: {
          connected: true,
          interface: this.canInterface.getName(),
          streaming: this.isStreaming,
        },
      });

      // メッセージハンドラー
      ws.on('message', (data: Buffer) => {
        try {
          const message: WebSocketMessage = JSON.parse(data.toString());
          this.handleClientMessage(ws, message);
        } catch {
          this.sendToClient(ws, {
            type: 'error',
            error: 'Invalid message format',
          });
        }
      });

      // 初回接続時にストリーミングを自動開始
      if (this.clients.size === 1 && !this.isStreaming) {
        console.log(
          'First client connected, starting CAN streaming automatically'
        );
        this.startStreaming();
      }

      // 切断ハンドラー
      ws.on('close', () => {
        console.log('WebSocket client disconnected');
        this.clients.delete(ws);

        // クライアントがいなくなったらストリーミングを停止
        if (this.clients.size === 0 && this.isStreaming) {
          console.log('Last client disconnected, stopping CAN streaming');
          this.stopStreaming();
        }
      });

      // エラーハンドラー
      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.clients.delete(ws);
      });
    });
  }

  private setupCANInterface(): void {
    // CANフレームを受信したら購読クライアントに転送
    this.canInterface.onFrame((frame: CANFrame) => {
      this.broadcastFrame(frame);
    });

    // エラーを全クライアントに通知
    this.canInterface.onError((error: Error) => {
      this.broadcastError(error.message);
    });
  }

  private handleClientMessage(ws: WebSocket, message: WebSocketMessage): void {
    switch (message.type) {
      case 'subscribe':
        if (message.messageIds) {
          const subscriptions = this.clients.get(ws) || new Set();
          message.messageIds.forEach((id) => subscriptions.add(id));
          this.clients.set(ws, subscriptions);
          console.log(
            `Client subscribed to message IDs: ${message.messageIds.join(', ')}`
          );
        }
        break;

      case 'unsubscribe':
        if (message.messageIds) {
          const subscriptions = this.clients.get(ws) || new Set();
          message.messageIds.forEach((id) => subscriptions.delete(id));
          this.clients.set(ws, subscriptions);
          console.log(
            `Client unsubscribed from message IDs: ${message.messageIds.join(', ')}`
          );
        }
        break;

      case 'start':
        console.log('Client requested start streaming');
        this.startStreaming();
        break;

      case 'stop':
        console.log('Client requested stop streaming');
        this.stopStreaming();
        break;

      case 'heartbeat':
        this.sendToClient(ws, { type: 'heartbeat' });
        break;

      case 'send_frame':
        this.handleSendFrame(ws, message.frame);
        break;

      default:
        this.sendToClient(ws, {
          type: 'error',
          error: `Unknown message type: ${(message as { type: string }).type}`,
        });
    }
  }

  private handleSendFrame(
    ws: WebSocket,
    frame: WebSocketMessage['frame']
  ): void {
    if (!frame || typeof frame.id === 'undefined') {
      this.sendToClient(ws, {
        type: 'send_frame_response',
        success: false,
        error: 'Invalid frame data',
      });
      return;
    }

    try {
      // CANフレームの検証とデータ変換
      let frameData: number[] = [];
      if (frame.data) {
        if (Array.isArray(frame.data)) {
          frameData = frame.data;
        } else if (
          typeof frame.data === 'object' &&
          frame.data.constructor?.name === 'Object'
        ) {
          // Uint8ArrayがObjectとして送信された場合（{0: val1, 1: val2, ...}）
          frameData = Object.values(frame.data as Record<string, number>);
        } else if ('length' in frame.data) {
          // array-likeオブジェクトの場合
          frameData = Array.from(frame.data as ArrayLike<number>);
        }
      }

      const validatedFrame: CANFrame = {
        id: frame.id,
        data: new Uint8Array(frameData),
        timestamp: frame.timestamp || Date.now(),
        extended: frame.extended || false,
        dlc: frame.dlc || frameData.length,
      };

      console.log(
        `Received CAN frame from client: ID=0x${validatedFrame.id
          .toString(16)
          .toUpperCase()
          .padStart(3, '0')}, DLC=${validatedFrame.dlc}, data=[${Array.from(
          validatedFrame.data
        )
          .map((b) => '0x' + b.toString(16).toUpperCase().padStart(2, '0'))
          .join(', ')}]`
      );

      // 送信されたフレームを他のクライアントにブロードキャスト
      // （送信者以外のクライアントに配信）
      this.broadcastFrameExcept(validatedFrame, ws);

      // 送信確認を返す
      this.sendToClient(ws, {
        type: 'send_frame_response',
        success: true,
        frame: validatedFrame,
      });
    } catch (error) {
      console.error('Error processing sent frame:', error);
      this.sendToClient(ws, {
        type: 'send_frame_response',
        success: false,
        error: 'Failed to process frame',
      });
    }
  }

  private broadcastFrameExcept(
    frame: CANFrame,
    excludeClient: WebSocket
  ): void {
    this.clients.forEach((subscriptions, client) => {
      // 送信者は除外
      if (client === excludeClient) return;

      // クライアントが全メッセージを購読しているか、特定のIDを購読しているかチェック
      if (subscriptions.size === 0 || subscriptions.has(frame.id)) {
        if (client.readyState === WebSocket.OPEN) {
          this.sendToClient(client, {
            type: 'frame',
            data: { frame },
          });
        }
      }
    });
  }

  private async startStreaming(): Promise<void> {
    if (this.isStreaming) {
      console.log('CAN streaming is already active');
      return;
    }

    try {
      await this.canInterface.start();
      this.isStreaming = true;
      console.log(
        `CAN streaming started with ${this.clients.size} connected client(s)`
      );

      // 全クライアントに状態を通知
      this.broadcastStatus({
        streaming: true,
        interface: this.canInterface.getName(),
      });
    } catch (error) {
      console.error('Failed to start CAN interface:', error);
      this.broadcastError('Failed to start CAN interface');
    }
  }

  private async stopStreaming(): Promise<void> {
    if (!this.isStreaming) {
      console.log('CAN streaming is already stopped');
      return;
    }

    try {
      await this.canInterface.stop();
      this.isStreaming = false;
      console.log(
        `CAN streaming stopped (${this.clients.size} client(s) remaining)`
      );

      // 全クライアントに状態を通知
      this.broadcastStatus({
        streaming: false,
        interface: this.canInterface.getName(),
      });
    } catch (error) {
      console.error('Failed to stop CAN interface:', error);
      this.broadcastError('Failed to stop CAN interface');
    }
  }

  private broadcastFrame(frame: CANFrame): void {
    this.clients.forEach((subscriptions, client) => {
      // クライアントが全メッセージを購読しているか、特定のIDを購読しているかチェック
      if (subscriptions.size === 0 || subscriptions.has(frame.id)) {
        if (client.readyState === WebSocket.OPEN) {
          this.sendToClient(client, {
            type: 'frame',
            data: { frame },
          });
        }
      }
    });
  }

  private broadcastStatus(status: {
    streaming?: boolean;
    interface?: string;
  }): void {
    this.clients.forEach((_, client) => {
      if (client.readyState === WebSocket.OPEN) {
        this.sendToClient(client, {
          type: 'status',
          data: status,
        });
      }
    });
  }

  private broadcastError(error: string): void {
    this.clients.forEach((_, client) => {
      if (client.readyState === WebSocket.OPEN) {
        this.sendToClient(client, {
          type: 'error',
          error,
        });
      }
    });
  }

  private sendToClient(client: WebSocket, response: WebSocketResponse): void {
    try {
      client.send(JSON.stringify(response));
    } catch (error) {
      console.error('Failed to send message to client:', error);
    }
  }
}

export function setupWebSocketServer(server: Server): CANWebSocketServer {
  return new CANWebSocketServer(server);
}
