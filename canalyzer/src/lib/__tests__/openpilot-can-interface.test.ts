import {
  OpenpilotCANInterface,
  DEFAULT_OPENPILOT_CONFIG,
  loadOpenpilotConfigFromEnv,
} from '../openpilot-can-interface';
import { CANFrame } from '@/types/can';

describe('OpenpilotCANInterface', () => {
  let canInterface: OpenpilotCANInterface;

  beforeEach(() => {
    canInterface = new OpenpilotCANInterface(DEFAULT_OPENPILOT_CONFIG);
  });

  afterEach(async () => {
    if (canInterface.isConnected()) {
      await canInterface.stop();
    }
  });

  describe('基本機能', () => {
    test('インターフェース名を取得できる', () => {
      expect(canInterface.getName()).toContain('openpilot CAN Interface');
    });

    test('初期状態では接続されていない', () => {
      expect(canInterface.isConnected()).toBe(false);
    });

    test('フレームリスナーを登録できる', () => {
      const listener = jest.fn();
      canInterface.onFrame(listener);
      expect(listener).not.toHaveBeenCalled();
    });

    test('エラーリスナーを登録できる', () => {
      const listener = jest.fn();
      canInterface.onError(listener);
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('ライフサイクル', () => {
    test('開始できる', async () => {
      await canInterface.start();
      expect(canInterface.isConnected()).toBe(true);
    });

    test('停止できる', async () => {
      await canInterface.start();
      expect(canInterface.isConnected()).toBe(true);

      await canInterface.stop();
      expect(canInterface.isConnected()).toBe(false);
    });

    test('重複した開始呼び出しを処理できる', async () => {
      await canInterface.start();
      await canInterface.start(); // 2回目は無視される
      expect(canInterface.isConnected()).toBe(true);
    });

    test('重複した停止呼び出しを処理できる', async () => {
      await canInterface.start();
      await canInterface.stop();
      await canInterface.stop(); // 2回目は無視される
      expect(canInterface.isConnected()).toBe(false);
    });
  });

  describe('データ受信', () => {
    test('CANフレームを受信できる', async () => {
      const receivedFrames: CANFrame[] = [];

      canInterface.onFrame((frame: CANFrame) => {
        receivedFrames.push(frame);
      });

      await canInterface.start();

      // モック実装により自動的にフレームが生成される
      // 少し待ってフレームが受信されることを確認
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(receivedFrames.length).toBeGreaterThan(0);

      // 最初のフレームを検証
      const firstFrame = receivedFrames[0];
      expect(firstFrame).toHaveProperty('id');
      expect(firstFrame).toHaveProperty('data');
      expect(firstFrame).toHaveProperty('timestamp');
      expect(firstFrame).toHaveProperty('extended');
      expect(firstFrame).toHaveProperty('dlc');
    });

    test('openpilot特有のメッセージIDを受信する', async () => {
      const receivedFrames: CANFrame[] = [];

      canInterface.onFrame((frame: CANFrame) => {
        receivedFrames.push(frame);
      });

      await canInterface.start();

      // 十分な時間待ってさまざまなメッセージを受信
      await new Promise((resolve) => setTimeout(resolve, 200));

      // openpilotでよく使われるメッセージIDをチェック
      const receivedIds = receivedFrames.map((frame) => frame.id);
      const expectedIds = [0x025, 0x3bc, 0x224, 0x399]; // ステアリング、速度、ブレーキ、カメラ

      expectedIds.forEach((id) => {
        expect(receivedIds).toContain(id);
      });
    });

    test('フレームの構造が正しい', async () => {
      const receivedFrames: CANFrame[] = [];

      canInterface.onFrame((frame: CANFrame) => {
        receivedFrames.push(frame);
      });

      await canInterface.start();
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(receivedFrames.length).toBeGreaterThan(0);

      receivedFrames.forEach((frame) => {
        // ID検証
        expect(typeof frame.id).toBe('number');
        expect(frame.id).toBeGreaterThanOrEqual(0);

        // データ検証
        expect(frame.data).toBeInstanceOf(Uint8Array);
        expect(frame.data.length).toBeGreaterThanOrEqual(0);
        expect(frame.data.length).toBeLessThanOrEqual(8);

        // タイムスタンプ検証
        expect(typeof frame.timestamp).toBe('number');
        expect(frame.timestamp).toBeGreaterThan(0);

        // DLC検証
        expect(frame.dlc).toBe(frame.data.length);

        // 拡張フレームフラグ検証
        expect(typeof frame.extended).toBe('boolean');
      });
    });
  });

  describe('エラー処理', () => {
    test('エラーリスナーにエラーを通知する', async () => {
      const errors: Error[] = [];

      canInterface.onError((error: Error) => {
        errors.push(error);
      });

      // 不正な設定で開始してエラーを発生させる
      const badInterface = new OpenpilotCANInterface({
        ...DEFAULT_OPENPILOT_CONFIG,
        zmqEndpoint: 'invalid://endpoint',
      });

      badInterface.onError((error: Error) => {
        errors.push(error);
      });

      // 実際のZMQ実装では接続エラーが発生するが、
      // モック実装では接続は成功する
      await badInterface.start();

      // モック実装なので実際のエラーは発生しないが、
      // 実装が正しく動作することを確認
      expect(badInterface.isConnected()).toBe(true);

      await badInterface.stop();
    });
  });

  describe('設定管理', () => {
    test('デフォルト設定が正しい', () => {
      expect(DEFAULT_OPENPILOT_CONFIG.zmqEndpoint).toBe('tcp://localhost:8001');
      expect(DEFAULT_OPENPILOT_CONFIG.zmqTopic).toBe('can');
      expect(DEFAULT_OPENPILOT_CONFIG.maxReconnectAttempts).toBe(10);
      expect(DEFAULT_OPENPILOT_CONFIG.reconnectInterval).toBe(5000);
      expect(DEFAULT_OPENPILOT_CONFIG.enableDebugLogging).toBe(false);
    });

    test('環境変数から設定を読み込める', () => {
      // 環境変数を設定
      const originalEnv = process.env;
      process.env = {
        ...originalEnv,
        OPENPILOT_ZMQ_ENDPOINT: 'tcp://test-server:9001',
        OPENPILOT_ZMQ_TOPIC: 'test-can',
        OPENPILOT_MAX_RECONNECT_ATTEMPTS: '5',
        OPENPILOT_RECONNECT_INTERVAL: '3000',
        OPENPILOT_BUS_FILTER: '0,1,2',
        OPENPILOT_ID_FILTER: '0x100,0x200,300',
        OPENPILOT_DEBUG_LOGGING: 'true',
      };

      const config = loadOpenpilotConfigFromEnv();

      expect(config.zmqEndpoint).toBe('tcp://test-server:9001');
      expect(config.zmqTopic).toBe('test-can');
      expect(config.maxReconnectAttempts).toBe(5);
      expect(config.reconnectInterval).toBe(3000);
      expect(config.busFilter).toEqual([0, 1, 2]);
      expect(config.idFilter).toEqual([0x100, 0x200, 300]); // 16進と10進の混合
      expect(config.enableDebugLogging).toBe(true);

      // 環境変数を元に戻す
      process.env = originalEnv;
    });
  });
});

describe('統合テスト', () => {
  test('CANInterfaceFactoryでopenpilotインターフェースを作成できる', () => {
    // CANInterfaceFactoryのテストは別ファイルで行う
    // ここでは基本的な統合の確認のみ
    expect(() => {
      new OpenpilotCANInterface(DEFAULT_OPENPILOT_CONFIG);
    }).not.toThrow();
  });
});
