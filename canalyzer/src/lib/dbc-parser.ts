import { Dbc } from '@montra-connect/dbc-parser';
import { DBCDatabase, CANMessage, CANSignal, CANNode, ParseResult, ParseError, ParseWarning } from '@/types/dbc';

export class DBCParser {
  private dbc: Dbc;

  constructor() {
    this.dbc = new Dbc();
  }

  parse(content: string): ParseResult {
    const errors: ParseError[] = [];
    const warnings: ParseWarning[] = [];

    // 入力チェック
    if (content === null || content === undefined) {
      errors.push({
        line: 0,
        message: '入力が無効です',
        type: 'SYNTAX_ERROR'
      });
      return {
        success: false,
        errors,
        warnings
      };
    }

    try {
      // DBCファイルをロード
      const dbcData = this.dbc.load(content);

      // データベースオブジェクトを構築
      const database: DBCDatabase = {
        version: dbcData.version || '',
        nodes: this.extractNodes(dbcData),
        messages: this.extractMessages(dbcData),
      };

      return {
        success: true,
        database,
        errors,
        warnings
      };
    } catch (error) {
      errors.push({
        line: 0,
        message: error instanceof Error ? error.message : 'DBCファイルのパースに失敗しました',
        type: 'SYNTAX_ERROR'
      });

      return {
        success: false,
        errors,
        warnings
      };
    }
  }

  private extractNodes(dbcData: unknown): CANNode[] {
    const nodes: CANNode[] = [];
    
    // 型ガード
    if (!this.isDbcData(dbcData)) {
      return nodes;
    }
    
    // dbcDataからノード情報を抽出
    if (Array.isArray(dbcData.nodes)) {
      for (const nodeName of dbcData.nodes) {
        nodes.push({
          name: nodeName,
          comment: undefined
        });
      }
    }

    return nodes;
  }

  private extractMessages(dbcData: unknown): Map<number, CANMessage> {
    const messages = new Map<number, CANMessage>();

    // 型ガード
    if (!this.isDbcData(dbcData)) {
      return messages;
    }

    // dbcDataからメッセージ情報を抽出
    if (dbcData.messages && dbcData.messages instanceof Map) {
      for (const [messageName, dbcMessage] of dbcData.messages) {
        const messageData = dbcMessage as DbcMessage;
        const signals: CANSignal[] = [];

        // シグナル情報を抽出
        if (messageData.signals && messageData.signals instanceof Map) {
          for (const [signalName, dbcSignal] of messageData.signals) {
            const signalData = dbcSignal as DbcSignal;
            
            // 値テーブルをオブジェクトに変換
            let values: Record<number, string> | undefined;
            if (signalData.valueTable && signalData.valueTable instanceof Map) {
              values = {};
              for (const [key, value] of signalData.valueTable) {
                values[key] = value;
              }
            }

            signals.push({
              name: signalName,
              startBit: signalData.startBit,
              length: signalData.length,
              endianness: signalData.endian === 'Intel' ? 'little' : 'big',
              signed: signalData.signed,
              factor: signalData.factor,
              offset: signalData.offset,
              min: signalData.min,
              max: signalData.max,
              unit: signalData.unit || '',
              receivingNodes: signalData.receivingNodes || [],
              values,
              comment: signalData.description || undefined
            });
          }
        }

        messages.set(messageData.id, {
          id: messageData.id,
          name: messageName,
          length: messageData.dlc,
          sendingNode: messageData.sendingNode || '',
          signals,
          comment: messageData.description || undefined
        });
      }
    }

    return messages;
  }

  private isDbcData(data: unknown): data is DbcDataType {
    return typeof data === 'object' && data !== null;
  }
}

// 型定義を追加
interface DbcDataType {
  version?: string;
  nodes?: Map<string, unknown>;
  messages?: Map<string, unknown>;
}

interface DbcMessage {
  id: number;
  dlc: number;
  sendingNode?: string;
  description?: string;
  signals?: Map<string, unknown>;
}

interface DbcSignal {
  startBit: number;
  length: number;
  endian: string;
  signed: boolean;
  factor: number;
  offset: number;
  min: number;
  max: number;
  unit?: string;
  receivingNodes?: string[];
  valueTable?: Map<number, string>;
  description?: string;
}