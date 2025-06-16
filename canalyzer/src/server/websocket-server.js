/* eslint-disable @typescript-eslint/no-require-imports */
const WebSocket = require('ws');
const WebSocketServer = WebSocket.Server;

// 何もしないCANインターフェース
class NullCANInterface {
  constructor() {
    this.isRunning = false;
    this.frameListeners = [];
    this.errorListeners = [];
  }

  async start() {
    this.isRunning = true;
    console.log('Null CAN interface started (no data will be generated)');
  }

  async stop() {
    this.isRunning = false;
    console.log('Null CAN interface stopped');
  }

  onFrame(callback) {
    this.frameListeners.push(callback);
  }

  onError(callback) {
    this.errorListeners.push(callback);
  }

  isConnected() {
    return this.isRunning;
  }

  getName() {
    return 'Null CAN Interface';
  }
}

class VirtualCANInterface {
  constructor() {
    this.isRunning = false;
    this.frameListeners = [];
    this.errorListeners = [];
    this.intervalId = null;
  }

  async start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('Virtual CAN interface started');
    
    // 100msごとに仮想CANデータを生成
    this.intervalId = setInterval(() => {
      this.generateVirtualFrames();
    }, 100);
  }

  async stop() {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    console.log('Virtual CAN interface stopped');
  }

  onFrame(callback) {
    this.frameListeners.push(callback);
  }

  onError(callback) {
    this.errorListeners.push(callback);
  }

  isConnected() {
    return this.isRunning;
  }

  getName() {
    return 'Virtual CAN Interface';
  }

  generateVirtualFrames() {
    const timestamp = Date.now();
    const time = timestamp / 1000;
    
    // エンジンステータスメッセージ (ID: 0x100)
    const engineFrame = {
      id: 0x100,
      data: new Uint8Array([
        // RPM: 800-6000 (変動)
        Math.floor(800 + Math.sin(time * 0.5) * 2600 + Math.random() * 100) & 0xFF,
        (Math.floor(800 + Math.sin(time * 0.5) * 2600 + Math.random() * 100) >> 8) & 0xFF,
        // 温度: 20-90°C (徐々に上昇)
        Math.min(90, 20 + time * 0.1) & 0xFF,
        // 燃料レベル: 0-100% (徐々に減少)
        Math.max(0, 100 - time * 0.05) & 0xFF,
        0, 0, 0, 0
      ]),
      timestamp,
      extended: false,
      dlc: 8
    };
    
    // 車両動作メッセージ (ID: 0x200)
    const motionFrame = {
      id: 0x200,
      data: new Uint8Array([
        // 速度: 0-200 km/h (変動)
        Math.floor(Math.max(0, Math.sin(time * 0.3) * 100 + 50)) & 0xFF,
        (Math.floor(Math.max(0, Math.sin(time * 0.3) * 100 + 50)) >> 8) & 0xFF,
        // アクセル: 0-100%
        Math.floor(Math.max(0, Math.sin(time * 0.3) * 50 + 50)) & 0xFF,
        // ブレーキ: 0-100%
        Math.floor(Math.max(0, -Math.sin(time * 0.3) * 50 + 10)) & 0xFF,
        // ステアリング角度: -720 to +720
        Math.floor(Math.sin(time * 0.2) * 360) & 0xFF,
        (Math.floor(Math.sin(time * 0.2) * 360) >> 8) & 0xFF,
        0, 0
      ]),
      timestamp,
      extended: false,
      dlc: 8
    };
    
    // ボディステータスメッセージ (ID: 0x300)
    const bodyFrame = {
      id: 0x300,
      data: new Uint8Array([
        // ドア状態とライト状態（ランダムに変化）
        Math.random() > 0.95 ? 0xFF : 0x00,
        // バッテリー電圧: 11.5-14.5V
        Math.floor((11.5 + Math.random() * 3) * 10) & 0xFF,
        0, 0, 0, 0, 0, 0
      ]),
      timestamp,
      extended: false,
      dlc: 8
    };
    
    // フレームをリスナーに通知
    this.frameListeners.forEach(listener => {
      listener(engineFrame);
      listener(motionFrame);
      listener(bodyFrame);
    });
  }
}

// CANインターフェースファクトリー
class CANInterfaceFactory {
  static create(type = 'none') {
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

class CANWebSocketServer {
  constructor(server) {
    this.wss = new WebSocketServer({ server, path: '/ws' });
    
    // 環境変数からCANインターフェースタイプを取得（デフォルト: none）
    const interfaceType = process.env.CAN_INTERFACE_TYPE || 'none';
    console.log(`Initializing CAN interface with type: ${interfaceType}`);
    
    this.canInterface = CANInterfaceFactory.create(interfaceType);
    this.clients = new Map();
    this.isStreaming = false;
    
    this.setupWebSocketServer();
    this.setupCANInterface();
  }

  setupWebSocketServer() {
    this.wss.on('connection', (ws) => {
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
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleClientMessage(ws, message);
        } catch {
          this.sendToClient(ws, {
            type: 'error',
            error: 'Invalid message format'
          });
        }
      });
      
      // 初回接続時にストリーミングを自動開始
      if (this.clients.size === 1 && !this.isStreaming) {
        console.log('First client connected, starting CAN streaming automatically');
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

  setupCANInterface() {
    // CANフレームを受信したら購読クライアントに転送
    this.canInterface.onFrame((frame) => {
      this.broadcastFrame(frame);
    });
    
    // エラーを全クライアントに通知
    this.canInterface.onError((error) => {
      this.broadcastError(error.message);
    });
  }

  handleClientMessage(ws, message) {
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
          error: `Unknown message type: ${message.type}`
        });
    }
  }

  handleSendFrame(ws, frame) {
    if (!frame || typeof frame.id === 'undefined') {
      this.sendToClient(ws, {
        type: 'send_frame_response',
        success: false,
        error: 'Invalid frame data'
      });
      return;
    }

    try {
      // CANフレームの検証
      const validatedFrame = {
        id: frame.id,
        data: new Uint8Array(frame.data || []),
        timestamp: frame.timestamp || Date.now(),
        extended: frame.extended || false,
        dlc: frame.dlc || (frame.data ? frame.data.length : 0)
      };

      console.log(`Received CAN frame from client: ID=0x${validatedFrame.id.toString(16).toUpperCase().padStart(3, '0')}, DLC=${validatedFrame.dlc}`);

      // 送信されたフレームを他のクライアントにブロードキャスト
      // （送信者以外のクライアントに配信）
      this.broadcastFrameExcept(validatedFrame, ws);

      // 送信確認を返す
      this.sendToClient(ws, {
        type: 'send_frame_response',
        success: true,
        frame: validatedFrame
      });

    } catch (error) {
      console.error('Error processing sent frame:', error);
      this.sendToClient(ws, {
        type: 'send_frame_response',
        success: false,
        error: 'Failed to process frame'
      });
    }
  }

  broadcastFrameExcept(frame, excludeClient) {
    this.clients.forEach((subscriptions, client) => {
      // 送信者は除外
      if (client === excludeClient) return;
      
      // クライアントが全メッセージを購読しているか、特定のIDを購読しているかチェック
      if (subscriptions.size === 0 || subscriptions.has(frame.id)) {
        if (client.readyState === WebSocket.OPEN) {
          this.sendToClient(client, {
            type: 'frame',
            data: { frame }
          });
        }
      }
    });
  }

  async startStreaming() {
    if (this.isStreaming) {
      console.log('CAN streaming is already active');
      return;
    }
    
    try {
      await this.canInterface.start();
      this.isStreaming = true;
      console.log(`CAN streaming started with ${this.clients.size} connected client(s)`);
      
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

  async stopStreaming() {
    if (!this.isStreaming) {
      console.log('CAN streaming is already stopped');
      return;
    }
    
    try {
      await this.canInterface.stop();
      this.isStreaming = false;
      console.log(`CAN streaming stopped (${this.clients.size} client(s) remaining)`);
      
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

  broadcastFrame(frame) {
    this.clients.forEach((subscriptions, client) => {
      // クライアントが全メッセージを購読しているか、特定のIDを購読しているかチェック
      if (subscriptions.size === 0 || subscriptions.has(frame.id)) {
        if (client.readyState === WebSocket.OPEN) {
          this.sendToClient(client, {
            type: 'frame',
            data: { frame }
          });
        }
      }
    });
  }

  broadcastStatus(status) {
    this.clients.forEach((_, client) => {
      if (client.readyState === WebSocket.OPEN) {
        this.sendToClient(client, {
          type: 'status',
          data: status
        });
      }
    });
  }

  broadcastError(error) {
    this.clients.forEach((_, client) => {
      if (client.readyState === WebSocket.OPEN) {
        this.sendToClient(client, {
          type: 'error',
          error
        });
      }
    });
  }

  sendToClient(client, response) {
    try {
      client.send(JSON.stringify(response));
    } catch (error) {
      console.error('Failed to send message to client:', error);
    }
  }
}

function setupWebSocketServer(server) {
  return new CANWebSocketServer(server);
}

module.exports = { setupWebSocketServer };