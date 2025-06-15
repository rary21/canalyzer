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

  private extractNodes(dbcData: any): CANNode[] {
    const nodes: CANNode[] = [];
    
    // dbcDataからノード情報を抽出
    if (dbcData.nodes && dbcData.nodes instanceof Map) {
      for (const [nodeName, nodeData] of dbcData.nodes) {
        nodes.push({
          name: nodeName,
          comment: nodeData.description || undefined
        });
      }
    }

    return nodes;
  }

  private extractMessages(dbcData: any): Map<number, CANMessage> {
    const messages = new Map<number, CANMessage>();

    // dbcDataからメッセージ情報を抽出
    if (dbcData.messages && dbcData.messages instanceof Map) {
      for (const [messageName, dbcMessage] of dbcData.messages) {
        const signals: CANSignal[] = [];

        // シグナル情報を抽出
        if (dbcMessage.signals && dbcMessage.signals instanceof Map) {
          for (const [signalName, dbcSignal] of dbcMessage.signals) {
            // 値テーブルをオブジェクトに変換
            let values: Record<number, string> | undefined;
            if (dbcSignal.valueTable && dbcSignal.valueTable instanceof Map) {
              values = {};
              for (const [key, value] of dbcSignal.valueTable) {
                values[key] = value;
              }
            }

            signals.push({
              name: signalName,
              startBit: dbcSignal.startBit,
              length: dbcSignal.length,
              endianness: dbcSignal.endian === 'LITTLE' ? 'little' : 'big',
              signed: dbcSignal.signed,
              factor: dbcSignal.factor,
              offset: dbcSignal.offset,
              min: dbcSignal.min,
              max: dbcSignal.max,
              unit: dbcSignal.unit || '',
              receivingNodes: dbcSignal.receivingNodes || [],
              values,
              comment: dbcSignal.description || undefined
            });
          }
        }

        messages.set(dbcMessage.id, {
          id: dbcMessage.id,
          name: messageName,
          length: dbcMessage.dlc,
          sendingNode: dbcMessage.sendingNode || '',
          signals,
          comment: dbcMessage.description || undefined
        });
      }
    }

    return messages;
  }
}