import { CANFrame } from './types';

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
 * 仮想CANインターフェース（開発・テスト用）
 */
export class VirtualCANInterface implements ICANInterface {
  private isRunning = false;
  private frameListeners: ((frame: CANFrame) => void)[] = [];
  private errorListeners: ((error: Error) => void)[] = [];
  private intervalId?: NodeJS.Timeout;

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
      this.intervalId = undefined;
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
        Math.floor(800 + Math.sin(time * 0.5) * 2600 + Math.random() * 100) & 0xFF,
        (Math.floor(800 + Math.sin(time * 0.5) * 2600 + Math.random() * 100) >> 8) & 0xFF,
        // 温度: 20-90°C (徐々に上昇)
        Math.min(90, 20 + time * 0.1) & 0xFF,
        // 燃料レベル: 0-100% (徐々に減少)
        Math.max(0, 100 - time * 0.05) & 0xFF,
        0, 0, 0, 0
      ]),
      timestamp
    };
    
    // 車両動作メッセージ (ID: 0x200)
    const motionFrame: CANFrame = {
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
      timestamp
    };
    
    // ボディステータスメッセージ (ID: 0x300)
    const bodyFrame: CANFrame = {
      id: 0x300,
      data: new Uint8Array([
        // ドア状態とライト状態（ランダムに変化）
        Math.random() > 0.95 ? 0xFF : 0x00,
        // バッテリー電圧: 11.5-14.5V
        Math.floor((11.5 + Math.random() * 3) * 10) & 0xFF,
        0, 0, 0, 0, 0, 0
      ]),
      timestamp
    };
    
    // フレームをリスナーに通知
    this.frameListeners.forEach(listener => {
      listener(engineFrame);
      listener(motionFrame);
      listener(bodyFrame);
    });
  }
}

/**
 * CANインターフェースファクトリー
 */
export class CANInterfaceFactory {
  static create(type: 'virtual' | 'hardware' = 'virtual'): ICANInterface {
    switch (type) {
      case 'virtual':
        return new VirtualCANInterface();
      case 'hardware':
        // 将来的な実装: 実際のハードウェアインターフェース
        throw new Error('Hardware CAN interface not implemented yet');
      default:
        throw new Error(`Unknown CAN interface type: ${type}`);
    }
  }
}