import { ICANInterface } from './can-interface';
import { CANFrame } from '@/types/can';

/**
 * openpilot設定インターフェース
 */
export interface OpenpilotConfig {
  /** ZMQエンドポイント */
  zmqEndpoint: string;
  /** ZMQトピック */
  zmqTopic: string;
  /** 最大再接続試行回数 */
  maxReconnectAttempts: number;
  /** 再接続間隔（ミリ秒） */
  reconnectInterval: number;
  /** バスフィルター（指定したバスのみ受信） */
  busFilter?: number[];
  /** IDフィルター（指定したCAN IDのみ受信） */
  idFilter?: number[];
  /** デバッグログ有効化 */
  enableDebugLogging: boolean;
}

/**
 * openpilot CanDataメッセージ構造
 */
interface OpenpilotCanData {
  /** CAN ID */
  address: number;
  /** バス時間（マイクロ秒） */
  busTime: number;
  /** データペイロード */
  dat: Uint8Array;
  /** ソースバス番号 */
  src: number;
}

/**
 * CapnProto CANメッセージ
 */
interface CapnProtoCanMessage {
  canData: OpenpilotCanData[];
}

/**
 * openpilot CANインターフェース
 * ZMQを通じてopenpilotからリアルタイムCANデータを受信
 */
export class OpenpilotCANInterface implements ICANInterface {
  private zmqSocket: unknown = null; // zmqSocketの型定義は後で追加
  private isRunning = false;
  private frameListeners: ((frame: CANFrame) => void)[] = [];
  private errorListeners: ((error: Error) => void)[] = [];
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private config: OpenpilotConfig;

  constructor(config: OpenpilotConfig) {
    this.config = config;
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('openpilot CAN interface is already running');
      return;
    }

    console.log('Starting openpilot CAN interface...');
    await this.connectToOpenpilot();
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      console.log('openpilot CAN interface is already stopped');
      return;
    }

    console.log('Stopping openpilot CAN interface...');
    this.isRunning = false;

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.zmqSocket) {
      try {
        // 実際の実装では: this.zmqSocket.close();
        // モック実装では何もしない
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (this.zmqSocket as any)?.close?.();
      } catch (error) {
        console.error('Error closing ZMQ socket:', error);
      }
      this.zmqSocket = null;
    }

    console.log('openpilot CAN interface stopped');
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
    return `openpilot CAN Interface (${this.config.zmqEndpoint})`;
  }

  /**
   * openpilotへのZMQ接続を確立
   */
  private async connectToOpenpilot(): Promise<void> {
    try {
      // TODO: 実際のZMQ実装時に有効化
      // const zmq = require('zeromq');
      // this.zmqSocket = zmq.socket('sub');

      // 現在はモック実装
      console.log(`Connecting to openpilot at ${this.config.zmqEndpoint}`);
      console.log(`Subscribing to topic: ${this.config.zmqTopic}`);

      // モック実装: 実際のZMQ接続の代わりにインターバルでデータ生成
      this.isRunning = true;
      this.reconnectAttempts = 0;

      // 実際の実装では以下のようになる:
      /*
      this.zmqSocket.connect(this.config.zmqEndpoint);
      this.zmqSocket.subscribe(this.config.zmqTopic);
      
      this.zmqSocket.on('message', (topic: Buffer, message: Buffer) => {
        this.handleZMQMessage(message);
      });
      
      this.zmqSocket.on('error', (error: Error) => {
        this.handleConnectionError(error);
      });
      */

      // モック用のデータ生成
      this.startMockDataGeneration();

      console.log('Connected to openpilot successfully');
    } catch (error) {
      await this.handleConnectionError(error as Error);
    }
  }

  /**
   * モック用データ生成（実際の実装では不要）
   */
  private startMockDataGeneration(): void {
    const generateMockData = () => {
      if (!this.isRunning) return;

      // openpilotらしいCANメッセージを模擬生成
      const mockMessages = this.generateOpenpilotMockData();

      mockMessages.forEach((canData) => {
        const frame = this.convertToCANFrame(canData);
        if (this.shouldAcceptFrame(frame)) {
          this.frameListeners.forEach((listener) => listener(frame));
        }
      });

      setTimeout(generateMockData, 10); // 100Hz程度
    };

    generateMockData();
  }

  /**
   * openpilotらしいモックデータを生成
   */
  private generateOpenpilotMockData(): OpenpilotCanData[] {
    const timestamp = Date.now() * 1000; // マイクロ秒
    const messages: OpenpilotCanData[] = [];

    // Toyota Prius (openpilotでよく使われる車両) のメッセージを模擬

    // ステアリング角度 (0x25)
    messages.push({
      address: 0x025,
      busTime: timestamp,
      dat: new Uint8Array([
        Math.floor(Math.sin(timestamp / 1000000) * 50 + 127) & 0xff, // ステアリング角度
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
      ]),
      src: 0, // メインCANバス
    });

    // 車速 (0x3BC)
    messages.push({
      address: 0x3bc,
      busTime: timestamp,
      dat: new Uint8Array([
        Math.floor(Math.max(0, Math.sin(timestamp / 2000000) * 50 + 30)) & 0xff, // 速度
        (Math.floor(Math.max(0, Math.sin(timestamp / 2000000) * 50 + 30)) >>
          8) &
          0xff,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
      ]),
      src: 0,
    });

    // ブレーキペダル (0x224)
    messages.push({
      address: 0x224,
      busTime: timestamp,
      dat: new Uint8Array([
        Math.floor(Math.max(0, -Math.sin(timestamp / 1500000) * 100)) & 0xff, // ブレーキ圧
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
      ]),
      src: 0,
    });

    // カメラCANからの情報 (0x399)
    messages.push({
      address: 0x399,
      busTime: timestamp,
      dat: new Uint8Array([
        Math.floor(Math.random() * 256), // レーダー物体検知
        Math.floor(Math.random() * 256),
        Math.floor(Math.random() * 256),
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
      ]),
      src: 2, // カメラCAN
    });

    return messages;
  }

  /**
   * ZMQメッセージを処理
   */
  private handleZMQMessage(message: Buffer): void {
    try {
      const canMessage = this.deserializeCanData(message);

      canMessage.canData.forEach((canData) => {
        const frame = this.convertToCANFrame(canData);

        if (this.shouldAcceptFrame(frame)) {
          if (this.config.enableDebugLogging) {
            console.log(
              `Received CAN frame: ID=0x${frame.id.toString(16).toUpperCase().padStart(3, '0')}, Bus=${canData.src}, DLC=${frame.dlc}`
            );
          }

          this.frameListeners.forEach((listener) => listener(frame));
        }
      });
    } catch (error) {
      this.handleDeserializationError(error as Error, message);
    }
  }

  /**
   * CapnProtoデータをデシリアライズ
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private deserializeCanData(_data: Buffer): CapnProtoCanMessage {
    // TODO: 実際のCapnProto実装
    // const capnp = require('capnp');
    // return capnp.parse(schema, _data);

    // モック実装
    return {
      canData: [],
    };
  }

  /**
   * openpilot CanData を CANFrame に変換
   */
  private convertToCANFrame(canData: OpenpilotCanData): CANFrame {
    return {
      id: canData.address,
      data: new Uint8Array(canData.dat),
      timestamp: Math.floor(canData.busTime / 1000), // マイクロ秒からミリ秒に変換
      extended: canData.address > 0x7ff, // 29bit拡張フレーム判定
      dlc: canData.dat.length,
    };
  }

  /**
   * フレームをフィルターに基づいて受け入れるかチェック
   */
  private shouldAcceptFrame(frame: CANFrame): boolean {
    // IDフィルターチェック
    if (this.config.idFilter && this.config.idFilter.length > 0) {
      if (!this.config.idFilter.includes(frame.id)) {
        return false;
      }
    }

    // 追加のフィルタリングロジックがここに入る
    return true;
  }

  /**
   * 接続エラーを処理
   */
  private async handleConnectionError(error: Error): Promise<void> {
    console.error(`openpilot connection error: ${error.message}`);

    this.errorListeners.forEach((listener) => {
      listener(new Error(`openpilot接続エラー: ${error.message}`));
    });

    if (this.reconnectAttempts < this.config.maxReconnectAttempts) {
      this.scheduleReconnect();
    } else {
      console.error('openpilot接続の最大再試行回数に達しました');
      await this.stop();
    }
  }

  /**
   * デシリアライゼーションエラーを処理
   */
  private handleDeserializationError(error: Error, rawData: Buffer): void {
    console.error('CapnProto deserialization error:', error);

    if (this.config.enableDebugLogging) {
      console.debug('Raw data:', rawData.toString('hex'));
    }

    // エラーをリスナーに通知（但しシステムは継続）
    this.errorListeners.forEach((listener) => {
      listener(new Error(`データ解析エラー: ${error.message}`));
    });
  }

  /**
   * 再接続をスケジュール
   */
  private scheduleReconnect(): void {
    this.reconnectAttempts++;

    console.log(
      `Scheduling reconnect attempt ${this.reconnectAttempts}/${this.config.maxReconnectAttempts} in ${this.config.reconnectInterval}ms`
    );

    this.reconnectTimer = setTimeout(async () => {
      console.log(
        `Reconnecting to openpilot (attempt ${this.reconnectAttempts})`
      );
      await this.connectToOpenpilot();
    }, this.config.reconnectInterval);
  }

  /**
   * バス番号を識別可能な名前にマップ
   */
  private mapBusToInterface(busNumber: number): string {
    const busMapping: { [key: number]: string } = {
      0: 'CAN0 (Main)',
      1: 'CAN1 (Chassis)',
      2: 'CAN2 (Camera)',
      3: 'CAN3 (Radar)',
    };
    return busMapping[busNumber] || `CAN${busNumber}`;
  }
}

/**
 * openpilot設定のデフォルト値
 */
export const DEFAULT_OPENPILOT_CONFIG: OpenpilotConfig = {
  zmqEndpoint: 'tcp://localhost:8001',
  zmqTopic: 'can',
  maxReconnectAttempts: 10,
  reconnectInterval: 5000,
  enableDebugLogging: false,
};

/**
 * 環境変数からopenpilot設定を読み込み
 */
export function loadOpenpilotConfigFromEnv(): OpenpilotConfig {
  return {
    zmqEndpoint:
      process.env.OPENPILOT_ZMQ_ENDPOINT ||
      DEFAULT_OPENPILOT_CONFIG.zmqEndpoint,
    zmqTopic:
      process.env.OPENPILOT_ZMQ_TOPIC || DEFAULT_OPENPILOT_CONFIG.zmqTopic,
    maxReconnectAttempts: parseInt(
      process.env.OPENPILOT_MAX_RECONNECT_ATTEMPTS ||
        String(DEFAULT_OPENPILOT_CONFIG.maxReconnectAttempts)
    ),
    reconnectInterval: parseInt(
      process.env.OPENPILOT_RECONNECT_INTERVAL ||
        String(DEFAULT_OPENPILOT_CONFIG.reconnectInterval)
    ),
    busFilter: process.env.OPENPILOT_BUS_FILTER?.split(',').map(Number),
    idFilter: process.env.OPENPILOT_ID_FILTER?.split(',').map((id) => {
      // 16進数表記 (0x100) と10進数表記の両方をサポート
      return id.startsWith('0x') ? parseInt(id, 16) : parseInt(id, 10);
    }),
    enableDebugLogging: process.env.OPENPILOT_DEBUG_LOGGING === 'true',
  };
}
