import { Server } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { CANFrame } from '../lib/types';
import { CANInterfaceFactory, ICANInterface } from '../lib/can-interface';

interface WebSocketMessage {
  type: 'subscribe' | 'unsubscribe' | 'start' | 'stop' | 'heartbeat';
  messageIds?: number[];
}

interface WebSocketResponse {
  type: 'frame' | 'status' | 'error' | 'heartbeat';
  data?: any;
  error?: string;
}

class CANWebSocketServer {
  private wss: WebSocketServer;
  private canInterface: ICANInterface;
  private clients: Map<WebSocket, Set<number>> = new Map();
  private isStreaming = false;

  constructor(server: Server) {
    this.wss = new WebSocketServer({ server, path: '/ws' });
    this.canInterface = CANInterfaceFactory.create('virtual');
    
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
          streaming: this.isStreaming
        }
      });
      
      // メッセージハンドラー
      ws.on('message', (data: Buffer) => {
        try {
          const message: WebSocketMessage = JSON.parse(data.toString());
          this.handleClientMessage(ws, message);
        } catch (error) {
          this.sendToClient(ws, {
            type: 'error',
            error: 'Invalid message format'
          });
        }
      });
      
      // 切断ハンドラー
      ws.on('close', () => {
        console.log('WebSocket client disconnected');
        this.clients.delete(ws);
        
        // クライアントがいなくなったらストリーミングを停止
        if (this.clients.size === 0 && this.isStreaming) {
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
          message.messageIds.forEach(id => subscriptions.add(id));
          this.clients.set(ws, subscriptions);
          console.log(`Client subscribed to message IDs: ${message.messageIds.join(', ')}`);
        }
        break;
        
      case 'unsubscribe':
        if (message.messageIds) {
          const subscriptions = this.clients.get(ws) || new Set();
          message.messageIds.forEach(id => subscriptions.delete(id));
          this.clients.set(ws, subscriptions);
          console.log(`Client unsubscribed from message IDs: ${message.messageIds.join(', ')}`);
        }
        break;
        
      case 'start':
        this.startStreaming();
        break;
        
      case 'stop':
        this.stopStreaming();
        break;
        
      case 'heartbeat':
        this.sendToClient(ws, { type: 'heartbeat' });
        break;
        
      default:
        this.sendToClient(ws, {
          type: 'error',
          error: `Unknown message type: ${(message as any).type}`
        });
    }
  }

  private async startStreaming(): Promise<void> {
    if (this.isStreaming) return;
    
    try {
      await this.canInterface.start();
      this.isStreaming = true;
      console.log('CAN streaming started');
      
      // 全クライアントに状態を通知
      this.broadcastStatus({
        streaming: true,
        interface: this.canInterface.getName()
      });
    } catch (error) {
      console.error('Failed to start CAN interface:', error);
      this.broadcastError('Failed to start CAN interface');
    }
  }

  private async stopStreaming(): Promise<void> {
    if (!this.isStreaming) return;
    
    try {
      await this.canInterface.stop();
      this.isStreaming = false;
      console.log('CAN streaming stopped');
      
      // 全クライアントに状態を通知
      this.broadcastStatus({
        streaming: false,
        interface: this.canInterface.getName()
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
            data: frame
          });
        }
      }
    });
  }

  private broadcastStatus(status: any): void {
    this.clients.forEach((_, client) => {
      if (client.readyState === WebSocket.OPEN) {
        this.sendToClient(client, {
          type: 'status',
          data: status
        });
      }
    });
  }

  private broadcastError(error: string): void {
    this.clients.forEach((_, client) => {
      if (client.readyState === WebSocket.OPEN) {
        this.sendToClient(client, {
          type: 'error',
          error
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