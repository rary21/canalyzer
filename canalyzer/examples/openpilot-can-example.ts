#!/usr/bin/env tsx

/**
 * openpilot CAN統合の使用例
 *
 * このスクリプトは以下を実演します：
 * 1. openpilotからのリアルタイムCANデータ受信
 * 2. 特定メッセージのフィルタリング
 * 3. データの解析と表示
 * 4. エラーハンドリング
 *
 * 実行方法:
 * npx tsx examples/openpilot-can-example.ts
 */

import {
  OpenpilotCANInterface,
  DEFAULT_OPENPILOT_CONFIG,
} from '../src/lib/openpilot-can-interface';
import { CANFrame } from '../src/types/can';
import { DBCParser } from '../src/lib/dbc-parser';
import { readFileSync } from 'fs';
import { join } from 'path';

interface FrameStats {
  count: number;
  lastSeen: number;
  minInterval: number;
  maxInterval: number;
  avgInterval: number;
}

class OpenpilotCANMonitor {
  private canInterface: OpenpilotCANInterface;
  private dbcParser: DBCParser | null = null;
  private frameStats: Map<number, FrameStats> = new Map();
  private isRunning = false;
  private startTime: number = 0;

  constructor() {
    // openpilot用の設定
    const config = {
      ...DEFAULT_OPENPILOT_CONFIG,
      zmqEndpoint:
        process.env.OPENPILOT_ZMQ_ENDPOINT || 'tcp://192.168.1.100:8001',
      enableDebugLogging: true,
      // Toyota Priusの主要なメッセージのみをフィルタリング
      idFilter: [
        0x025, // ステアリング角度
        0x3bc, // 車速
        0x224, // ブレーキペダル
        0x399, // カメラ物体検知
        0x3b6, // アクセルペダル
        0x1c4, // エンジン情報
        0x412, // バッテリー電圧
      ],
    };

    this.canInterface = new OpenpilotCANInterface(config);
    this.setupEventHandlers();
    this.loadToyotaDBCFile();
  }

  /**
   * Toyota DBCファイルを読み込み（利用可能な場合）
   */
  private loadToyotaDBCFile(): void {
    try {
      const dbcPath = join(__dirname, '../../dbc/toyota_prius_2010_pt.dbc');
      const dbcContent = readFileSync(dbcPath, 'utf-8');

      this.dbcParser = new DBCParser();
      const parseResult = this.dbcParser.parse(dbcContent);

      if (parseResult.success) {
        console.log('✅ Toyota DBC file loaded successfully');
        console.log(`   Messages: ${parseResult.database?.messages.size || 0}`);
      } else {
        console.log('⚠️  Failed to load DBC file, using raw data only');
        this.dbcParser = null;
      }
    } catch (error) {
      console.log('ℹ️  No DBC file found, using raw data only');
      this.dbcParser = null;
    }
  }

  /**
   * イベントハンドラーを設定
   */
  private setupEventHandlers(): void {
    this.canInterface.onFrame((frame: CANFrame) => {
      this.processFrame(frame);
    });

    this.canInterface.onError((error: Error) => {
      console.error('🚨 CAN Interface Error:', error.message);
    });

    // 統計情報を定期的に表示
    setInterval(() => {
      if (this.isRunning) {
        this.displayStats();
      }
    }, 5000);

    // プログラム終了時のクリーンアップ
    process.on('SIGINT', async () => {
      console.log('\n🛑 Stopping openpilot CAN monitor...');
      await this.stop();
      process.exit(0);
    });
  }

  /**
   * モニタリングを開始
   */
  async start(): Promise<void> {
    console.log('🚀 Starting openpilot CAN Monitor');
    console.log(
      `   Endpoint: ${(this.canInterface as any).config.zmqEndpoint}`
    );
    console.log(`   Topic: ${(this.canInterface as any).config.zmqTopic}`);
    console.log('   Press Ctrl+C to stop\n');

    try {
      await this.canInterface.start();
      this.isRunning = true;
      this.startTime = Date.now();

      console.log('✅ Connected to openpilot');
      console.log('📡 Waiting for CAN messages...\n');
    } catch (error) {
      console.error('❌ Failed to start:', error);
      throw error;
    }
  }

  /**
   * モニタリングを停止
   */
  async stop(): Promise<void> {
    this.isRunning = false;
    await this.canInterface.stop();
    console.log('✅ openpilot CAN monitor stopped');
  }

  /**
   * CANフレームを処理
   */
  private processFrame(frame: CANFrame): void {
    this.updateFrameStats(frame);
    this.displayFrame(frame);
  }

  /**
   * フレーム統計を更新
   */
  private updateFrameStats(frame: CANFrame): void {
    const stats = this.frameStats.get(frame.id);
    const now = frame.timestamp;

    if (!stats) {
      this.frameStats.set(frame.id, {
        count: 1,
        lastSeen: now,
        minInterval: 0,
        maxInterval: 0,
        avgInterval: 0,
      });
    } else {
      const interval = now - stats.lastSeen;
      stats.count++;
      stats.lastSeen = now;

      if (stats.count === 2) {
        stats.minInterval = interval;
        stats.maxInterval = interval;
        stats.avgInterval = interval;
      } else {
        stats.minInterval = Math.min(stats.minInterval, interval);
        stats.maxInterval = Math.max(stats.maxInterval, interval);
        stats.avgInterval =
          (stats.avgInterval * (stats.count - 2) + interval) /
          (stats.count - 1);
      }
    }
  }

  /**
   * フレームを表示
   */
  private displayFrame(frame: CANFrame): void {
    const id = `0x${frame.id.toString(16).toUpperCase().padStart(3, '0')}`;
    const data = Array.from(frame.data)
      .map((b) => `0x${b.toString(16).toUpperCase().padStart(2, '0')}`)
      .join(' ');

    let description = this.getFrameDescription(frame);
    let parsedData = this.parseFrameData(frame);

    console.log(`📊 ${id} [${frame.dlc}] ${data} | ${description}`);
    if (parsedData) {
      console.log(`   └─ ${parsedData}`);
    }
  }

  /**
   * フレームの説明を取得
   */
  private getFrameDescription(frame: CANFrame): string {
    const descriptions: { [key: number]: string } = {
      0x025: 'ステアリング角度',
      0x3bc: '車両速度',
      0x224: 'ブレーキペダル',
      0x399: 'カメラ物体検知',
      0x3b6: 'アクセルペダル',
      0x1c4: 'エンジン情報',
      0x412: 'バッテリー電圧',
    };

    return descriptions[frame.id] || 'Unknown';
  }

  /**
   * フレームデータを解析（簡易版）
   */
  private parseFrameData(frame: CANFrame): string | null {
    switch (frame.id) {
      case 0x025: // ステアリング角度
        if (frame.data.length >= 2) {
          const angle = (frame.data[1] << 8) | frame.data[0];
          const degrees = (angle - 32768) * 0.1; // 簡易変換
          return `角度: ${degrees.toFixed(1)}°`;
        }
        break;

      case 0x3bc: // 車速
        if (frame.data.length >= 2) {
          const speed = (frame.data[1] << 8) | frame.data[0];
          const kmh = speed * 0.01; // 簡易変換
          return `速度: ${kmh.toFixed(1)} km/h`;
        }
        break;

      case 0x224: // ブレーキペダル
        if (frame.data.length >= 1) {
          const pressure = frame.data[0];
          return `ブレーキ圧: ${pressure}`;
        }
        break;

      case 0x412: // バッテリー電圧
        if (frame.data.length >= 2) {
          const voltage = (frame.data[1] << 8) | frame.data[0];
          const volts = voltage * 0.01; // 簡易変換
          return `電圧: ${volts.toFixed(2)}V`;
        }
        break;
    }

    return null;
  }

  /**
   * 統計情報を表示
   */
  private displayStats(): void {
    const runtime = (Date.now() - this.startTime) / 1000;
    const totalFrames = Array.from(this.frameStats.values()).reduce(
      (sum, stats) => sum + stats.count,
      0
    );

    console.log('\n📈 === Statistics ===');
    console.log(`Runtime: ${runtime.toFixed(1)}s`);
    console.log(`Total frames: ${totalFrames}`);
    console.log(`Frame rate: ${(totalFrames / runtime).toFixed(1)} fps`);
    console.log(`Active message IDs: ${this.frameStats.size}`);

    console.log('\nMessage Details:');
    for (const [id, stats] of this.frameStats) {
      const idStr = `0x${id.toString(16).toUpperCase().padStart(3, '0')}`;
      const rate = stats.count / runtime;
      const description = this.getFrameDescription({ id } as CANFrame);

      console.log(
        `  ${idStr} ${description.padEnd(20)} | ${stats.count.toString().padStart(6)} frames | ${rate.toFixed(1).padStart(6)} Hz`
      );
    }
    console.log('');
  }
}

// メイン実行
async function main() {
  const monitor = new OpenpilotCANMonitor();

  try {
    await monitor.start();

    // プログラムを実行し続ける
    await new Promise(() => {}); // 無限待機
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// スクリプトが直接実行された場合のみ実行
if (require.main === module) {
  main().catch(console.error);
}

export { OpenpilotCANMonitor };
