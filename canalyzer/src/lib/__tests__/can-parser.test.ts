import { CANParser } from '../can-parser';
import { CANFrame, CANValue, ParseConfig } from '@/types/can';
import { DBCDatabase, CANSignal } from '@/types/dbc';

describe('CANParser', () => {
  let parser: CANParser;
  let mockDatabase: DBCDatabase;

  beforeEach(() => {
    // テスト用のモックデータベースを作成
    mockDatabase = {
      version: '1.0.0',
      nodes: [{ name: 'TestECU', comment: 'テスト用ECU' }],
      messages: new Map([
        [
          0x100,
          {
            id: 0x100,
            name: 'TestMessage',
            length: 8,
            sendingNode: 'TestECU',
            signals: [
              {
                name: 'TestSignal1',
                startBit: 0,
                length: 8,
                endianness: 'little',
                signed: false,
                factor: 1,
                offset: 0,
                min: 0,
                max: 255,
                unit: 'count',
                receivingNodes: ['TestECU'],
                comment: 'テストシグナル1',
              },
              {
                name: 'TestSignal2',
                startBit: 8,
                length: 16,
                endianness: 'little',
                signed: true,
                factor: 0.1,
                offset: -100,
                min: -3276.8,
                max: 3276.7,
                unit: 'value',
                receivingNodes: ['TestECU'],
                comment: 'テストシグナル2',
              },
            ] as CANSignal[],
            comment: 'テストメッセージ',
          },
        ],
        [
          0x200,
          {
            id: 0x200,
            name: 'BigEndianMessage',
            length: 8,
            sendingNode: 'TestECU',
            signals: [
              {
                name: 'BigEndianSignal',
                startBit: 0,
                length: 16,
                endianness: 'big',
                signed: false,
                factor: 1,
                offset: 0,
                min: 0,
                max: 65535,
                unit: 'value',
                receivingNodes: ['TestECU'],
                comment: 'ビッグエンディアンシグナル',
              },
            ] as CANSignal[],
            comment: 'ビッグエンディアンテストメッセージ',
          },
        ],
      ]),
    };

    parser = new CANParser(mockDatabase);
  });

  describe('parseFrame', () => {
    it('正常なフレームを解析できる', () => {
      const frame: CANFrame = {
        id: 0x100,
        data: new Uint8Array([0x42, 0x10, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]),
        timestamp: 1000,
        extended: false,
        dlc: 8,
      };

      const result = parser.parseFrame(frame);

      expect(result.error).toBeUndefined();
      expect(result.messageName).toBe('TestMessage');
      expect(result.signals).toHaveLength(2);

      const signal1 = result.signals.find(
        (s) => s.signalName === 'TestSignal1'
      );
      const signal2 = result.signals.find(
        (s) => s.signalName === 'TestSignal2'
      );

      expect(signal1?.rawValue).toBe(0x42);
      expect(signal1?.physicalValue).toBe(66);
      expect(signal1?.unit).toBe('count');

      expect(signal2?.rawValue).toBe(0x10);
      expect(signal2?.physicalValue).toBe(-98.4); // 0x10 * 0.1 - 100
      expect(signal2?.unit).toBe('value');
    });

    it('未知のCAN IDに対してエラーを返す', () => {
      const frame: CANFrame = {
        id: 0x999,
        data: new Uint8Array([0x00, 0x00, 0x00, 0x00]),
        timestamp: 1000,
        extended: false,
        dlc: 4,
      };

      const result = parser.parseFrame(frame);

      expect(result.error).toBeDefined();
      expect(result.error).toContain(
        'CAN ID 0x999のメッセージ定義が見つかりません'
      );
      expect(result.messageName).toBe('Unknown');
      expect(result.signals).toHaveLength(0);
    });

    it('データ長が不足している場合に一部のシグナルが取得できない', () => {
      const frame: CANFrame = {
        id: 0x100,
        data: new Uint8Array([0x42]), // 1バイトのみ（TestSignal2は16bit、位置8から開始なので3バイト必要）
        timestamp: 1000,
        extended: false,
        dlc: 1,
      };

      const result = parser.parseFrame(frame);

      expect(result.error).toBeUndefined(); // フレームレベルではエラーなし
      expect(result.messageName).toBe('TestMessage');
      expect(result.signals).toHaveLength(1); // TestSignal1のみ取得可能
      expect(result.signals[0].signalName).toBe('TestSignal1');
    });

    it('ビッグエンディアンシグナルを正しく解析する', () => {
      const frame: CANFrame = {
        id: 0x200,
        data: new Uint8Array([0x12, 0x34, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]),
        timestamp: 1000,
        extended: false,
        dlc: 8,
      };

      const result = parser.parseFrame(frame);

      expect(result.error).toBeUndefined();
      expect(result.signals).toHaveLength(1);

      const signal = result.signals[0];
      expect(signal.signalName).toBe('BigEndianSignal');
      // ビッグエンディアンなので0x1234 = 4660
      expect(signal.rawValue).toBe(0x1234);
      expect(signal.physicalValue).toBe(4660);
    });
  });

  describe('parseDataSet', () => {
    it('複数のフレームを一括解析できる', () => {
      const frames: CANFrame[] = [
        {
          id: 0x100,
          data: new Uint8Array([
            0x10, 0x20, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
          ]),
          timestamp: 1000,
          extended: false,
          dlc: 8,
        },
        {
          id: 0x100,
          data: new Uint8Array([
            0x20, 0x30, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
          ]),
          timestamp: 2000,
          extended: false,
          dlc: 8,
        },
      ];

      const result = parser.parseDataSet(frames);

      expect(result.frames).toHaveLength(2);
      expect(result.values).toHaveLength(4); // 2フレーム × 2シグナル
      expect(result.name).toContain('CANデータセット');
      expect(result.description).toContain('2フレーム、4シグナル値');
    });

    it('時間範囲フィルターが機能する', () => {
      const frames: CANFrame[] = [
        {
          id: 0x100,
          data: new Uint8Array([
            0x10, 0x20, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
          ]),
          timestamp: 1000,
          extended: false,
          dlc: 8,
        },
        {
          id: 0x100,
          data: new Uint8Array([
            0x20, 0x30, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
          ]),
          timestamp: 2000,
          extended: false,
          dlc: 8,
        },
        {
          id: 0x100,
          data: new Uint8Array([
            0x30, 0x40, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
          ]),
          timestamp: 3000,
          extended: false,
          dlc: 8,
        },
      ];

      const config: ParseConfig = {
        timeRangeStart: 1500,
        timeRangeEnd: 2500,
      };

      const result = parser.parseDataSet(frames, config);

      expect(result.frames).toHaveLength(1);
      expect(result.frames[0].timestamp).toBe(2000);
      expect(result.values).toHaveLength(2);
    });

    it('CAN IDフィルターが機能する', () => {
      const frames: CANFrame[] = [
        {
          id: 0x100,
          data: new Uint8Array([
            0x10, 0x20, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
          ]),
          timestamp: 1000,
          extended: false,
          dlc: 8,
        },
        {
          id: 0x200,
          data: new Uint8Array([
            0x12, 0x34, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
          ]),
          timestamp: 1000,
          extended: false,
          dlc: 8,
        },
      ];

      const config: ParseConfig = {
        targetIds: [0x100],
      };

      const result = parser.parseDataSet(frames, config);

      expect(result.frames).toHaveLength(1);
      expect(result.frames[0].id).toBe(0x100);
      expect(result.values).toHaveLength(2);
    });

    it('シグナルフィルターが機能する', () => {
      const frames: CANFrame[] = [
        {
          id: 0x100,
          data: new Uint8Array([
            0x10, 0x20, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
          ]),
          timestamp: 1000,
          extended: false,
          dlc: 8,
        },
      ];

      const config: ParseConfig = {
        signalFilter: ['TestSignal1'],
      };

      const result = parser.parseDataSet(frames, config);

      expect(result.values).toHaveLength(1);
      expect(result.values[0].signalName).toBe('TestSignal1');
    });

    it('無効値除外フィルターが機能する', () => {
      // NaNや無限大を生成するデータを作成
      const framesWithInvalidValues: CANFrame[] = [
        {
          id: 0x100,
          data: new Uint8Array([
            0x10, 0x20, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
          ]),
          timestamp: 1000,
          extended: false,
          dlc: 8,
        },
      ];

      const config: ParseConfig = {
        excludeInvalidValues: true,
      };

      const result = parser.parseDataSet(framesWithInvalidValues, config);

      // 正常な値のみが含まれることを確認
      expect(
        result.values.every(
          (v) => !isNaN(v.physicalValue) && isFinite(v.physicalValue)
        )
      ).toBe(true);
    });
  });

  describe('extractBits', () => {
    it('リトルエンディアンで8ビット値を抽出する', () => {
      const data = new Uint8Array([0x42, 0x00, 0x00, 0x00]);
      const result = parser['extractBits'](data, {
        startBit: 0,
        length: 8,
        endianness: 'little',
        signed: false,
      });

      expect(result).toBe(0x42);
    });

    it('ビッグエンディアンで16ビット値を抽出する', () => {
      const data = new Uint8Array([0x12, 0x34, 0x00, 0x00]);
      const result = parser['extractBits'](data, {
        startBit: 0,
        length: 16,
        endianness: 'big',
        signed: false,
      });

      expect(result).toBe(0x1234);
    });

    it('符号付き値を正しく処理する', () => {
      const data = new Uint8Array([0xff, 0x00, 0x00, 0x00]);
      const result = parser['extractBits'](data, {
        startBit: 0,
        length: 8,
        endianness: 'little',
        signed: true,
      });

      expect(result).toBe(-1);
    });

    it('複数バイトにまたがるビットを抽出する', () => {
      const data = new Uint8Array([0xff, 0x01, 0x00, 0x00]);
      const result = parser['extractBits'](data, {
        startBit: 4,
        length: 8,
        endianness: 'little',
        signed: false,
      });

      expect(result).toBe(0x1f); // 0x01F から下位8ビット
    });
  });

  describe('getTimeSeriesData', () => {
    it('指定されたシグナルの時系列データを取得する', () => {
      const values: CANValue[] = [
        {
          signalName: 'TestSignal',
          messageName: 'TestMessage',
          rawValue: 10,
          physicalValue: 10,
          unit: 'unit',
          timestamp: 1000,
        },
        {
          signalName: 'TestSignal',
          messageName: 'TestMessage',
          rawValue: 20,
          physicalValue: 20,
          unit: 'unit',
          timestamp: 2000,
        },
        {
          signalName: 'OtherSignal',
          messageName: 'OtherMessage',
          rawValue: 30,
          physicalValue: 30,
          unit: 'unit',
          timestamp: 1500,
        },
      ];

      const result = parser.getTimeSeriesData('TestSignal', values);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ timestamp: 1000, value: 10 });
      expect(result[1]).toEqual({ timestamp: 2000, value: 20 });
    });

    it('タイムスタンプ順にソートする', () => {
      const values: CANValue[] = [
        {
          signalName: 'TestSignal',
          messageName: 'TestMessage',
          rawValue: 20,
          physicalValue: 20,
          unit: 'unit',
          timestamp: 2000,
        },
        {
          signalName: 'TestSignal',
          messageName: 'TestMessage',
          rawValue: 10,
          physicalValue: 10,
          unit: 'unit',
          timestamp: 1000,
        },
      ];

      const result = parser.getTimeSeriesData('TestSignal', values);

      expect(result[0].timestamp).toBe(1000);
      expect(result[1].timestamp).toBe(2000);
    });
  });

  describe('getSignalStatistics', () => {
    it('シグナル統計情報を計算する', () => {
      const values: CANValue[] = [
        {
          signalName: 'TestSignal',
          messageName: 'TestMessage',
          rawValue: 10,
          physicalValue: 10,
          unit: 'unit',
          timestamp: 1000,
        },
        {
          signalName: 'TestSignal',
          messageName: 'TestMessage',
          rawValue: 20,
          physicalValue: 20,
          unit: 'unit',
          timestamp: 2000,
        },
        {
          signalName: 'TestSignal',
          messageName: 'TestMessage',
          rawValue: 30,
          physicalValue: 30,
          unit: 'unit',
          timestamp: 3000,
        },
      ];

      const result = parser.getSignalStatistics('TestSignal', values);

      expect(result).not.toBeNull();
      expect(result!.count).toBe(3);
      expect(result!.min).toBe(10);
      expect(result!.max).toBe(30);
      expect(result!.average).toBe(20);
      expect(result!.unit).toBe('unit');
    });

    it('存在しないシグナルに対してnullを返す', () => {
      const values: CANValue[] = [];
      const result = parser.getSignalStatistics('NonExistentSignal', values);

      expect(result).toBeNull();
    });

    it('無効値を除外して統計を計算する', () => {
      const values: CANValue[] = [
        {
          signalName: 'TestSignal',
          messageName: 'TestMessage',
          rawValue: 10,
          physicalValue: 10,
          unit: 'unit',
          timestamp: 1000,
        },
        {
          signalName: 'TestSignal',
          messageName: 'TestMessage',
          rawValue: 20,
          physicalValue: NaN,
          unit: 'unit',
          timestamp: 2000,
        },
        {
          signalName: 'TestSignal',
          messageName: 'TestMessage',
          rawValue: 30,
          physicalValue: 30,
          unit: 'unit',
          timestamp: 3000,
        },
      ];

      const result = parser.getSignalStatistics('TestSignal', values);

      expect(result).not.toBeNull();
      expect(result!.count).toBe(2);
      expect(result!.min).toBe(10);
      expect(result!.max).toBe(30);
      expect(result!.average).toBe(20);
    });
  });
});
