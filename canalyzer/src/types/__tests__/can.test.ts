import { 
  CANFrame, 
  CANValue, 
  CANDataSet, 
  CANFrameAnalysis, 
  ParseConfig, 
  BitField 
} from '../can';

describe('CAN型定義', () => {
  describe('CANFrame', () => {
    it('正しい構造を持つ', () => {
      const frame: CANFrame = {
        id: 0x123,
        data: new Uint8Array([0x01, 0x02, 0x03, 0x04]),
        timestamp: 1000,
        extended: false,
        dlc: 4
      };

      expect(frame.id).toBe(0x123);
      expect(frame.data).toBeInstanceOf(Uint8Array);
      expect(frame.data.length).toBe(4);
      expect(frame.timestamp).toBe(1000);
      expect(frame.extended).toBe(false);
      expect(frame.dlc).toBe(4);
    });

    it('拡張フレーム（29bit ID）をサポートする', () => {
      const extendedFrame: CANFrame = {
        id: 0x1FFFFFFF, // 29bit最大値
        data: new Uint8Array([0xFF]),
        timestamp: 2000,
        extended: true,
        dlc: 1
      };

      expect(extendedFrame.id).toBe(0x1FFFFFFF);
      expect(extendedFrame.extended).toBe(true);
    });

    it('最大8バイトのデータをサポートする', () => {
      const frame: CANFrame = {
        id: 0x100,
        data: new Uint8Array([0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07]),
        timestamp: 1000,
        extended: false,
        dlc: 8
      };

      expect(frame.data.length).toBe(8);
      expect(frame.dlc).toBe(8);
    });
  });

  describe('CANValue', () => {
    it('正しい構造を持つ', () => {
      const value: CANValue = {
        signalName: 'TestSignal',
        rawValue: 100,
        physicalValue: 10.0,
        unit: 'km/h',
        timestamp: 1000
      };

      expect(value.signalName).toBe('TestSignal');
      expect(value.rawValue).toBe(100);
      expect(value.physicalValue).toBe(10.0);
      expect(value.unit).toBe('km/h');
      expect(value.timestamp).toBe(1000);
    });

    it('オプショナルなdescriptionフィールドをサポートする', () => {
      const valueWithDescription: CANValue = {
        signalName: 'GearPosition',
        rawValue: 3,
        physicalValue: 3,
        unit: '',
        timestamp: 1000,
        description: 'Drive_1'
      };

      expect(valueWithDescription.description).toBe('Drive_1');
    });

    it('descriptionなしでも正常に動作する', () => {
      const valueWithoutDescription: CANValue = {
        signalName: 'Speed',
        rawValue: 1000,
        physicalValue: 10.0,
        unit: 'km/h',
        timestamp: 1000
      };

      expect(valueWithoutDescription.description).toBeUndefined();
    });
  });

  describe('CANDataSet', () => {
    it('正しい構造を持つ', () => {
      const frames: CANFrame[] = [
        {
          id: 0x100,
          data: new Uint8Array([0x01, 0x02]),
          timestamp: 1000,
          extended: false,
          dlc: 2
        }
      ];

      const values: CANValue[] = [
        {
          signalName: 'TestSignal',
          rawValue: 1,
          physicalValue: 1.0,
          unit: 'unit',
          timestamp: 1000
        }
      ];

      const dataSet: CANDataSet = {
        name: 'TestDataSet',
        createdAt: Date.now(),
        frames,
        values
      };

      expect(dataSet.name).toBe('TestDataSet');
      expect(typeof dataSet.createdAt).toBe('number');
      expect(dataSet.frames).toHaveLength(1);
      expect(dataSet.values).toHaveLength(1);
    });

    it('オプショナルなdescriptionフィールドをサポートする', () => {
      const dataSet: CANDataSet = {
        name: 'TestDataSet',
        createdAt: Date.now(),
        frames: [],
        values: [],
        description: 'テスト用データセット'
      };

      expect(dataSet.description).toBe('テスト用データセット');
    });
  });

  describe('CANFrameAnalysis', () => {
    it('正しい構造を持つ', () => {
      const frame: CANFrame = {
        id: 0x100,
        data: new Uint8Array([0x01]),
        timestamp: 1000,
        extended: false,
        dlc: 1
      };

      const signals: CANValue[] = [
        {
          signalName: 'TestSignal',
          rawValue: 1,
          physicalValue: 1.0,
          unit: 'unit',
          timestamp: 1000
        }
      ];

      const analysis: CANFrameAnalysis = {
        frame,
        messageName: 'TestMessage',
        signals
      };

      expect(analysis.frame).toBe(frame);
      expect(analysis.messageName).toBe('TestMessage');
      expect(analysis.signals).toHaveLength(1);
    });

    it('エラー情報をサポートする', () => {
      const frame: CANFrame = {
        id: 0x999,
        data: new Uint8Array([]),
        timestamp: 1000,
        extended: false,
        dlc: 0
      };

      const analysisWithError: CANFrameAnalysis = {
        frame,
        messageName: 'Unknown',
        signals: [],
        error: 'CAN ID 0x999のメッセージ定義が見つかりません'
      };

      expect(analysisWithError.error).toBeDefined();
      expect(analysisWithError.error).toContain('メッセージ定義が見つかりません');
    });
  });

  describe('ParseConfig', () => {
    it('空の設定オブジェクトを作成できる', () => {
      const config: ParseConfig = {};

      expect(config.timeRangeStart).toBeUndefined();
      expect(config.timeRangeEnd).toBeUndefined();
      expect(config.targetIds).toBeUndefined();
      expect(config.signalFilter).toBeUndefined();
      expect(config.excludeInvalidValues).toBeUndefined();
    });

    it('時間範囲フィルターを設定できる', () => {
      const config: ParseConfig = {
        timeRangeStart: 1000,
        timeRangeEnd: 5000
      };

      expect(config.timeRangeStart).toBe(1000);
      expect(config.timeRangeEnd).toBe(5000);
    });

    it('対象CAN IDリストを設定できる', () => {
      const config: ParseConfig = {
        targetIds: [0x100, 0x200, 0x300]
      };

      expect(config.targetIds).toEqual([0x100, 0x200, 0x300]);
      expect(config.targetIds).toHaveLength(3);
    });

    it('シグナルフィルターを設定できる', () => {
      const config: ParseConfig = {
        signalFilter: ['Engine_RPM', 'Vehicle_Speed']
      };

      expect(config.signalFilter).toEqual(['Engine_RPM', 'Vehicle_Speed']);
      expect(config.signalFilter).toHaveLength(2);
    });

    it('無効値除外フラグを設定できる', () => {
      const config: ParseConfig = {
        excludeInvalidValues: true
      };

      expect(config.excludeInvalidValues).toBe(true);
    });

    it('複数の設定を組み合わせできる', () => {
      const config: ParseConfig = {
        timeRangeStart: 1000,
        timeRangeEnd: 5000,
        targetIds: [0x100, 0x200],
        signalFilter: ['Engine_RPM'],
        excludeInvalidValues: true
      };

      expect(config.timeRangeStart).toBe(1000);
      expect(config.timeRangeEnd).toBe(5000);
      expect(config.targetIds).toEqual([0x100, 0x200]);
      expect(config.signalFilter).toEqual(['Engine_RPM']);
      expect(config.excludeInvalidValues).toBe(true);
    });
  });

  describe('BitField', () => {
    it('正しい構造を持つ', () => {
      const bitField: BitField = {
        startBit: 0,
        length: 8,
        endianness: 'little',
        signed: false
      };

      expect(bitField.startBit).toBe(0);
      expect(bitField.length).toBe(8);
      expect(bitField.endianness).toBe('little');
      expect(bitField.signed).toBe(false);
    });

    it('ビッグエンディアンをサポートする', () => {
      const bigEndianField: BitField = {
        startBit: 0,
        length: 16,
        endianness: 'big',
        signed: false
      };

      expect(bigEndianField.endianness).toBe('big');
    });

    it('符号付きフィールドをサポートする', () => {
      const signedField: BitField = {
        startBit: 8,
        length: 16,
        endianness: 'little',
        signed: true
      };

      expect(signedField.signed).toBe(true);
    });

    it('複数バイトにまたがるフィールドをサポートする', () => {
      const multiByteField: BitField = {
        startBit: 4,
        length: 12,
        endianness: 'little',
        signed: false
      };

      expect(multiByteField.startBit).toBe(4);
      expect(multiByteField.length).toBe(12);
    });
  });

  describe('型の相互運用性', () => {
    it('CANFrameAnalysisでCANFrameとCANValueが正しく関連付けられる', () => {
      const frame: CANFrame = {
        id: 0x100,
        data: new Uint8Array([0x42]),
        timestamp: 1000,
        extended: false,
        dlc: 1
      };

      const value: CANValue = {
        signalName: 'TestSignal',
        rawValue: 0x42,
        physicalValue: 66,
        unit: 'count',
        timestamp: frame.timestamp
      };

      const analysis: CANFrameAnalysis = {
        frame,
        messageName: 'TestMessage',
        signals: [value]
      };

      // フレームと値のタイムスタンプが一致することを確認
      expect(analysis.frame.timestamp).toBe(analysis.signals[0].timestamp);
      expect(analysis.signals[0].rawValue).toBe(frame.data[0]);
    });

    it('CANDataSetでCANFrameとCANValueが正しく関連付けられる', () => {
      const frame: CANFrame = {
        id: 0x100,
        data: new Uint8Array([0x42]),
        timestamp: 1000,
        extended: false,
        dlc: 1
      };

      const value: CANValue = {
        signalName: 'TestSignal',
        rawValue: 0x42,
        physicalValue: 66,
        unit: 'count',
        timestamp: frame.timestamp
      };

      const dataSet: CANDataSet = {
        name: 'TestDataSet',
        createdAt: Date.now(),
        frames: [frame],
        values: [value]
      };

      // データセット内のフレームと値が関連付けられていることを確認
      expect(dataSet.frames).toHaveLength(1);
      expect(dataSet.values).toHaveLength(1);
      expect(dataSet.frames[0].timestamp).toBe(dataSet.values[0].timestamp);
    });

    it('ParseConfigが実際の解析処理で使用可能', () => {
      const frames: CANFrame[] = [
        {
          id: 0x100,
          data: new Uint8Array([0x01]),
          timestamp: 1000,
          extended: false,
          dlc: 1
        },
        {
          id: 0x200,
          data: new Uint8Array([0x02]),
          timestamp: 2000,
          extended: false,
          dlc: 1
        }
      ];

      const config: ParseConfig = {
        timeRangeStart: 1500,
        targetIds: [0x200]
      };

      // フレームのフィルタリングをシミュレート
      let filteredFrames = frames;

      if (config.timeRangeStart !== undefined) {
        filteredFrames = filteredFrames.filter(frame => 
          frame.timestamp >= config.timeRangeStart!
        );
      }

      if (config.targetIds) {
        filteredFrames = filteredFrames.filter(frame => 
          config.targetIds!.includes(frame.id)
        );
      }

      expect(filteredFrames).toHaveLength(1);
      expect(filteredFrames[0].id).toBe(0x200);
      expect(filteredFrames[0].timestamp).toBe(2000);
    });
  });

  describe('エッジケースの処理', () => {
    it('空のデータ配列を持つCANFrameを処理できる', () => {
      const emptyFrame: CANFrame = {
        id: 0x100,
        data: new Uint8Array([]),
        timestamp: 1000,
        extended: false,
        dlc: 0
      };

      expect(emptyFrame.data.length).toBe(0);
      expect(emptyFrame.dlc).toBe(0);
    });

    it('NaN値を持つCANValueを処理できる', () => {
      const nanValue: CANValue = {
        signalName: 'InvalidSignal',
        rawValue: 0,
        physicalValue: NaN,
        unit: 'unit',
        timestamp: 1000
      };

      expect(isNaN(nanValue.physicalValue)).toBe(true);
    });

    it('Infinity値を持つCANValueを処理できる', () => {
      const infinityValue: CANValue = {
        signalName: 'OverflowSignal',
        rawValue: 0xFFFF,
        physicalValue: Infinity,
        unit: 'unit',
        timestamp: 1000
      };

      expect(infinityValue.physicalValue).toBe(Infinity);
      expect(isFinite(infinityValue.physicalValue)).toBe(false);
    });

    it('空の配列を持つParseConfigを処理できる', () => {
      const config: ParseConfig = {
        targetIds: [],
        signalFilter: []
      };

      expect(config.targetIds).toEqual([]);
      expect(config.signalFilter).toEqual([]);
    });
  });
});