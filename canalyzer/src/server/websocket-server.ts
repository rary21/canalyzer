import { Server } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { CANFrame } from '../types/can';
import { ICANInterface, CANInterfaceFactory } from '../lib/can-interface';

interface WebSocketMessage {
  type:
    | 'subscribe'
    | 'unsubscribe'
    | 'start'
    | 'stop'
    | 'heartbeat'
    | 'send_frame'
    | 'get_interface_info'
    | 'set_filters';
  messageIds?: number[];
  busFilter?: number[];
  idFilter?: number[];
  frame?: {
    id: number;
    data?: number[] | Uint8Array | Record<string, number>;
    timestamp?: number;
    extended?: boolean;
    dlc?: number;
  };
}

interface WebSocketResponse {
  type:
    | 'frame'
    | 'status'
    | 'error'
    | 'heartbeat'
    | 'send_frame_response'
    | 'interface_info'
    | 'filters_updated';
  data?: {
    connected?: boolean;
    interface?: string;
    streaming?: boolean;
    frame?: CANFrame;
    supportedTypes?: string[];
    currentFilters?: {
      busFilter?: number[];
      idFilter?: number[];
    };
  };
  error?: string;
  success?: boolean;
  frame?: CANFrame;
  // 統計情報用フィールド
  frameCount?: number;
  lastFrameTime?: number;
  clientCount?: number;
}

/**
 * WebSocketクライアント情報
 */
interface ClientInfo {
  /** 購読しているCAN ID */
  subscriptions: Set<number>;
  /** バスフィルター */
  busFilter?: number[];
  /** IDフィルター */
  idFilter?: number[];
  /** 最後のハートビート時刻 */
  lastHeartbeat: number;
  /** メッセージキュー（バックプレッシャー対応） */
  messageQueue: WebSocketResponse[];
  /** キューの最大サイズ */
  maxQueueSize: number;
}

class CANWebSocketServer {
  private wss: WebSocketServer;
  private canInterface: ICANInterface;
  private clients: Map<WebSocket, ClientInfo> = new Map();
  private isStreaming = false;
  private frameCount = 0;
  private lastFrameTime = 0;
  private readonly HEARTBEAT_INTERVAL = 30000; // 30秒
  private readonly MAX_QUEUE_SIZE = 1000; // クライアントあたりの最大キューサイズ
  private heartbeatTimer?: NodeJS.Timeout;

  constructor(server: Server) {
    this.wss = new WebSocketServer({ server, path: '/ws' });

    // 環境変数からCANインターフェースタイプを取得
    const interfaceType = this.getInterfaceType();
    console.log(`Initializing CAN interface with type: ${interfaceType}`);

    this.canInterface = this.createCANInterface(interfaceType);

    this.setupWebSocketServer();
    this.setupCANInterface();
    this.setupHeartbeatTimer();
  }

  /**
   * 環境変数からインターフェースタイプを取得
   */
  private getInterfaceType(): 'null' | 'hardware' | 'openpilot' {
    const type = process.env.CAN_INTERFACE_TYPE?.toLowerCase() || 'null';

    switch (type) {
      case 'null':
      case 'hardware':
      case 'openpilot':
        return type;
      case 'none':
        return 'null'; // noneはnullインターフェースにマップ
      default:
        console.warn(`Unknown interface type: ${type}, defaulting to null`);
        return 'null';
    }
  }

  /**
   * CANインターフェースを作成（エラーハンドリング付き）
   */
  private createCANInterface(
    type: 'null' | 'hardware' | 'openpilot'
  ): ICANInterface {
    try {
      const iface = CANInterfaceFactory.create(type);
      console.log(`Created CAN interface: ${iface.getName()}`);
      return iface;
    } catch (error) {
      console.error(`Failed to create ${type} interface:`, error);
      console.log('Falling back to null interface');
      return CANInterfaceFactory.create('null');
    }
  }

  private setupWebSocketServer(): void {
    this.wss.on('connection', (ws: WebSocket) => {
      console.log('New WebSocket client connected');

      // 新しいクライアントを登録
      const clientInfo: ClientInfo = {
        subscriptions: new Set(),
        lastHeartbeat: Date.now(),
        messageQueue: [],
        maxQueueSize: this.MAX_QUEUE_SIZE,
      };
      this.clients.set(ws, clientInfo);

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
          const clientInfo = this.clients.get(ws);
          if (clientInfo) {
            message.messageIds.forEach((id) =>
              clientInfo.subscriptions.add(id)
            );
            console.log(
              `Client subscribed to message IDs: ${message.messageIds.join(', ')}`
            );
          }
        }
        break;

      case 'unsubscribe':
        if (message.messageIds) {
          const clientInfo = this.clients.get(ws);
          if (clientInfo) {
            message.messageIds.forEach((id) =>
              clientInfo.subscriptions.delete(id)
            );
            console.log(
              `Client unsubscribed from message IDs: ${message.messageIds.join(', ')}`
            );
          }
        }
        break;

      case 'set_filters':
        this.handleSetFilters(ws, message);
        break;

      case 'get_interface_info':
        this.handleGetInterfaceInfo(ws);
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
        const clientInfo = this.clients.get(ws);
        if (clientInfo) {
          clientInfo.lastHeartbeat = Date.now();
        }
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
    this.clients.forEach((clientInfo, client) => {
      // 送信者は除外
      if (client === excludeClient) return;

      // フィルタリングチェック
      if (this.shouldSendFrameToClient(frame, clientInfo)) {
        if (client.readyState === WebSocket.OPEN) {
          this.sendToClientWithQueue(client, {
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
    this.frameCount++;
    this.lastFrameTime = Date.now();

    this.clients.forEach((clientInfo, client) => {
      // フィルタリングチェック
      if (this.shouldSendFrameToClient(frame, clientInfo)) {
        if (client.readyState === WebSocket.OPEN) {
          this.sendToClientWithQueue(client, {
            type: 'frame',
            data: { frame },
          });
        }
      }
    });
  }

  /**
   * フレームをクライアントに送信するかどうかを判定
   */
  private shouldSendFrameToClient(
    frame: CANFrame,
    clientInfo: ClientInfo
  ): boolean {
    // IDフィルターチェック
    if (clientInfo.idFilter && clientInfo.idFilter.length > 0) {
      if (!clientInfo.idFilter.includes(frame.id)) {
        return false;
      }
    }

    // 購読チェック（全購読または特定ID購読）
    if (
      clientInfo.subscriptions.size > 0 &&
      !clientInfo.subscriptions.has(frame.id)
    ) {
      return false;
    }

    // TODO: バスフィルターは将来的にCANFrameにバス情報を追加して実装
    return true;
  }

  /**
   * キュー付きでクライアントにメッセージを送信（バックプレッシャー対応）
   */
  private sendToClientWithQueue(
    client: WebSocket,
    response: WebSocketResponse
  ): void {
    const clientInfo = this.clients.get(client);
    if (!clientInfo) return;

    // キューサイズチェック
    if (clientInfo.messageQueue.length >= clientInfo.maxQueueSize) {
      // 古いメッセージを削除（FIFO）
      clientInfo.messageQueue.shift();
    }

    // メッセージをキューに追加
    clientInfo.messageQueue.push(response);

    // 即座に送信を試行
    this.flushClientQueue(client);
  }

  /**
   * クライアントのメッセージキューをフラッシュ
   */
  private flushClientQueue(client: WebSocket): void {
    const clientInfo = this.clients.get(client);
    if (!clientInfo || client.readyState !== WebSocket.OPEN) return;

    while (clientInfo.messageQueue.length > 0) {
      const message = clientInfo.messageQueue.shift()!;
      try {
        client.send(JSON.stringify(message));
      } catch (error) {
        console.error('Failed to send queued message:', error);
        // 送信に失敗した場合、メッセージをキューの先頭に戻す
        clientInfo.messageQueue.unshift(message);
        break;
      }
    }
  }

  private broadcastStatus(status: {
    streaming?: boolean;
    interface?: string;
  }): void {
    this.clients.forEach((_, client) => {
      if (client.readyState === WebSocket.OPEN) {
        this.sendToClientWithQueue(client, {
          type: 'status',
          data: status,
        });
      }
    });
  }

  private broadcastError(error: string): void {
    this.clients.forEach((_, client) => {
      if (client.readyState === WebSocket.OPEN) {
        this.sendToClientWithQueue(client, {
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

  /**
   * フィルター設定を処理
   */
  private handleSetFilters(ws: WebSocket, message: WebSocketMessage): void {
    const clientInfo = this.clients.get(ws);
    if (!clientInfo) return;

    if (message.busFilter) {
      clientInfo.busFilter = message.busFilter;
    }

    if (message.idFilter) {
      clientInfo.idFilter = message.idFilter;
    }

    console.log(
      `Updated filters for client: busFilter=${clientInfo.busFilter?.join(', ') || 'none'}, idFilter=${clientInfo.idFilter?.join(', ') || 'none'}`
    );

    this.sendToClient(ws, {
      type: 'filters_updated',
      success: true,
      data: {
        currentFilters: {
          busFilter: clientInfo.busFilter,
          idFilter: clientInfo.idFilter,
        },
      },
    });
  }

  /**
   * インターフェース情報を取得
   */
  private handleGetInterfaceInfo(ws: WebSocket): void {
    this.sendToClient(ws, {
      type: 'interface_info',
      data: {
        interface: this.canInterface.getName(),
        connected: this.canInterface.isConnected(),
        streaming: this.isStreaming,
        supportedTypes: ['null', 'hardware', 'openpilot'],
      },
      success: true,
      // 統計情報はdata層の外に移動して、簡潔なレスポンスを作成
      frameCount: this.frameCount,
      lastFrameTime: this.lastFrameTime,
      clientCount: this.clients.size,
    });
  }

  /**
   * ハートビートタイマーを設定
   */
  private setupHeartbeatTimer(): void {
    this.heartbeatTimer = setInterval(() => {
      this.checkClientHeartbeats();
    }, this.HEARTBEAT_INTERVAL);
  }

  /**
   * クライアントのハートビートをチェック
   */
  private checkClientHeartbeats(): void {
    const now = Date.now();
    const timeout = this.HEARTBEAT_INTERVAL * 2; // ハートビートタイムアウト

    this.clients.forEach((clientInfo, client) => {
      if (now - clientInfo.lastHeartbeat > timeout) {
        console.log('Client heartbeat timeout, closing connection');
        client.terminate();
        this.clients.delete(client);
      }
    });
  }

  /**
   * サーバーのクリーンアップ
   */
  public async cleanup(): Promise<void> {
    console.log('Cleaning up WebSocket server...');

    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = undefined;
    }

    // 全クライアントを閉じる
    this.clients.forEach((_, client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.close();
      }
    });
    this.clients.clear();

    // CANインターフェースを停止
    if (this.isStreaming) {
      await this.stopStreaming();
    }

    console.log('WebSocket server cleanup completed');
  }
}

export function setupWebSocketServer(server: Server): CANWebSocketServer {
  return new CANWebSocketServer(server);
}
