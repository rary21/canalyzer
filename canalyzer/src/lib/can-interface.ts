import { CANFrame } from '@/types/can';
import {
  OpenpilotCANInterface,
  loadOpenpilotConfigFromEnv,
} from './openpilot-can-interface';

/**
 * CANインターフェースの抽象定義
 * 実際のハードウェアや仮想デバイスを抽象化
 */
export interface ICANInterface {
  /**
   * インターフェースを開始
   */
  start(): Promise<void>;

  /**
   * インターフェースを停止
   */
  stop(): Promise<void>;

  /**
   * CANフレームのリスナーを登録
   */
  onFrame(callback: (frame: CANFrame) => void): void;

  /**
   * エラーリスナーを登録
   */
  onError(callback: (error: Error) => void): void;

  /**
   * 接続状態を取得
   */
  isConnected(): boolean;

  /**
   * インターフェース名を取得
   */
  getName(): string;
}

/**
 * 何もしないCANインターフェース（テスト・デバッグ用）
 */
export class NullCANInterface implements ICANInterface {
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

/**
 * CANインターフェースファクトリー
 */
export class CANInterfaceFactory {
  static create(
    type: 'null' | 'virtual' | 'hardware' | 'openpilot' = 'virtual'
  ): ICANInterface {
    switch (type) {
      case 'null':
        console.log('Creating Null CAN Interface');
        return new NullCANInterface();
      case 'hardware':
        console.log('Creating Hardware CAN Interface (not implemented yet)');
        // 将来的な実装: 実際のハードウェアインターフェース
        throw new Error('Hardware CAN interface not implemented yet');
      case 'openpilot':
        console.log('Creating openpilot CAN Interface');
        const config = loadOpenpilotConfigFromEnv();
        return new OpenpilotCANInterface(config);
      default:
        throw new Error(`Unknown CAN interface type: ${type}`);
    }
  }

  /**
   * 利用可能なインターフェースタイプを取得
   */
  static getAvailableTypes(): string[] {
    return ['null', 'hardware', 'openpilot'];
  }

  /**
   * インターフェースタイプの説明を取得
   */
  static getTypeDescription(type: string): string {
    const descriptions: Record<string, string> = {
      null: 'データを生成しないテスト用インターフェース',
      hardware: '実際のCANハードウェアとの通信インターフェース（未実装）',
      openpilot: 'openpilotからのリアルタイムCANデータ受信インターフェース',
    };
    return descriptions[type] || '不明なインターフェースタイプ';
  }
}
