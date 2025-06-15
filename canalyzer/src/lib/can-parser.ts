import { DBCDatabase, CANSignal } from '@/types/dbc';
import { CANFrame, CANValue, CANFrameAnalysis, CANDataSet, ParseConfig, BitField } from '@/types/can';

/**
 * CANデータパーサー
 * DBCメッセージ定義を使ってCANフレームからシグナル値を抽出
 */
export class CANParser {
  private database: DBCDatabase;

  constructor(database: DBCDatabase) {
    this.database = database;
  }

  /**
   * 単一のCANフレームを解析
   * @param frame CANフレーム
   * @returns 解析結果
   */
  parseFrame(frame: CANFrame): CANFrameAnalysis {
    const message = this.database.messages.get(frame.id);
    
    if (!message) {
      return {
        frame,
        messageName: 'Unknown',
        signals: [],
        error: `CAN ID 0x${frame.id.toString(16).toUpperCase()}のメッセージ定義が見つかりません`
      };
    }

    const signals: CANValue[] = [];
    
    try {
      for (const signalDef of message.signals) {
        const value = this.extractSignalValue(frame, signalDef);
        if (value !== null) {
          signals.push(value);
        }
      }
    } catch (error) {
      return {
        frame,
        messageName: message.name,
        signals,
        error: error instanceof Error ? error.message : 'シグナル解析エラー'
      };
    }

    return {
      frame,
      messageName: message.name,
      signals,
    };
  }

  /**
   * 複数のCANフレームを一括解析
   * @param frames CANフレームの配列
   * @param config 解析設定
   * @returns CANデータセット
   */
  parseDataSet(frames: CANFrame[], config: ParseConfig = {}): CANDataSet {
    // フィルタリング
    let filteredFrames = frames;
    
    if (config.timeRangeStart !== undefined || config.timeRangeEnd !== undefined) {
      filteredFrames = filteredFrames.filter(frame => {
        if (config.timeRangeStart !== undefined && frame.timestamp < config.timeRangeStart) {
          return false;
        }
        if (config.timeRangeEnd !== undefined && frame.timestamp > config.timeRangeEnd) {
          return false;
        }
        return true;
      });
    }

    if (config.targetIds) {
      filteredFrames = filteredFrames.filter(frame => 
        config.targetIds!.includes(frame.id)
      );
    }

    // 解析実行
    const allValues: CANValue[] = [];
    
    for (const frame of filteredFrames) {
      const analysis = this.parseFrame(frame);
      
      if (!analysis.error) {
        let signals = analysis.signals;
        
        // シグナルフィルター適用
        if (config.signalFilter && config.signalFilter.length > 0) {
          signals = signals.filter(signal => 
            config.signalFilter!.includes(signal.signalName)
          );
        }

        // 無効値除外
        if (config.excludeInvalidValues) {
          signals = signals.filter(signal => 
            !isNaN(signal.physicalValue) && isFinite(signal.physicalValue)
          );
        }

        allValues.push(...signals);
      }
    }

    return {
      name: `CANデータセット_${new Date().toISOString()}`,
      createdAt: Date.now(),
      frames: filteredFrames,
      values: allValues,
      description: `${filteredFrames.length}フレーム、${allValues.length}シグナル値を含むデータセット`
    };
  }

  /**
   * シグナル値を抽出
   * @param frame CANフレーム
   * @param signal シグナル定義
   * @returns 抽出されたシグナル値
   */
  private extractSignalValue(frame: CANFrame, signal: CANSignal): CANValue | null {
    try {
      // ビットフィールド情報を構築
      const bitField: BitField = {
        startBit: signal.startBit,
        length: signal.length,
        endianness: signal.endianness,
        signed: signal.signed
      };

      // 生の値を抽出
      const rawValue = this.extractBits(frame.data, bitField);

      // 物理値に変換
      const physicalValue = rawValue * signal.factor + signal.offset;

      // 値の説明を取得
      const description = signal.values?.[rawValue];

      return {
        signalName: signal.name,
        messageName: this.database.messages.get(frame.id)?.name || 'Unknown',
        rawValue,
        physicalValue,
        unit: signal.unit,
        timestamp: frame.timestamp,
        description
      };
    } catch (error) {
      console.warn(`シグナル ${signal.name} の抽出に失敗:`, error);
      return null;
    }
  }

  /**
   * バイト配列からビットを抽出
   * @param data バイト配列
   * @param bitField ビットフィールド情報
   * @returns 抽出された値
   */
  private extractBits(data: Uint8Array, bitField: BitField): number {
    const { startBit, length, endianness, signed } = bitField;

    // データ長チェック
    const requiredBytes = Math.ceil((startBit + length) / 8);
    if (data.length < requiredBytes) {
      throw new Error(`データ長が不足しています: 必要=${requiredBytes}バイト, 実際=${data.length}バイト`);
    }

    let value = 0;

    if (endianness === 'little') {
      // リトルエンディアン（Intel形式）
      value = this.extractLittleEndian(data, startBit, length);
    } else {
      // ビッグエンディアン（Motorola形式）
      value = this.extractBigEndian(data, startBit, length);
    }

    // 符号付きの場合は符号拡張
    if (signed && length < 32) {
      const signBit = 1 << (length - 1);
      if (value & signBit) {
        value -= (1 << length);
      }
    }

    return value;
  }

  /**
   * リトルエンディアンでビット抽出
   */
  private extractLittleEndian(data: Uint8Array, startBit: number, length: number): number {
    let value = 0;
    
    for (let i = 0; i < length; i++) {
      const bitPos = startBit + i;
      const byteIndex = Math.floor(bitPos / 8);
      const bitInByte = bitPos % 8;
      
      if (data[byteIndex] & (1 << bitInByte)) {
        value |= (1 << i);
      }
    }
    
    return value;
  }

  /**
   * ビッグエンディアンでビット抽出
   */
  private extractBigEndian(data: Uint8Array, startBit: number, length: number): number {
    let value = 0;
    
    for (let i = 0; i < length; i++) {
      const bitPos = startBit + i;
      const byteIndex = Math.floor(bitPos / 8);
      const bitInByte = 7 - (bitPos % 8); // ビッグエンディアンはビット順が逆
      
      if (data[byteIndex] & (1 << bitInByte)) {
        value |= (1 << (length - 1 - i));
      }
    }
    
    return value;
  }

  /**
   * 時系列データを取得
   * @param signalName シグナル名
   * @param values シグナル値の配列
   * @returns 時系列データ（タイムスタンプと値のペア）
   */
  getTimeSeriesData(signalName: string, values: CANValue[]): Array<{timestamp: number, value: number}> {
    return values
      .filter(v => v.signalName === signalName)
      .map(v => ({ timestamp: v.timestamp, value: v.physicalValue }))
      .sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * シグナル統計情報を取得
   * @param signalName シグナル名
   * @param values シグナル値の配列
   * @returns 統計情報
   */
  getSignalStatistics(signalName: string, values: CANValue[]) {
    const signalValues = values
      .filter(v => v.signalName === signalName)
      .map(v => v.physicalValue)
      .filter(v => !isNaN(v) && isFinite(v));

    if (signalValues.length === 0) {
      return null;
    }

    const min = Math.min(...signalValues);
    const max = Math.max(...signalValues);
    const avg = signalValues.reduce((sum, val) => sum + val, 0) / signalValues.length;
    
    return {
      count: signalValues.length,
      min,
      max,
      average: avg,
      unit: values.find(v => v.signalName === signalName)?.unit || ''
    };
  }
}