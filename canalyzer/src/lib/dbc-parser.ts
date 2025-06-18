import { Dbc } from '@montra-connect/dbc-parser';
import {
  DBCDatabase,
  CANSignal,
  CANNode,
  ParseResult,
  ParseError,
  ParseWarning,
  DbcDataType,
  DbcMessage,
  DbcSignal,
  ValueTable,
  MessageMap,
} from '@/types/dbc';
import { ErrorMessages } from '@/utils/errors';

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
        message: ErrorMessages.FILE_EMPTY,
        type: 'SYNTAX_ERROR',
      });
      return {
        success: false,
        errors,
        warnings,
      };
    }

    // 空ファイルのチェック - 空ファイルは有効なDBCデータベースとして扱う
    if (content.trim() === '') {
      const database: DBCDatabase = {
        version: '',
        nodes: [],
        messages: new Map(),
      };

      return {
        success: true,
        database,
        errors,
        warnings,
      };
    }

    try {
      // DBCファイルをロード
      const dbcData = this.dbc.load(content) as unknown as DbcDataType;

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
        warnings,
      };
    } catch (error) {
      // エラーメッセージの解析
      let errorMessage: string = ErrorMessages.DBC_INVALID_SYNTAX;
      let errorLine = 0;

      if (error instanceof Error) {
        errorMessage = error.message;

        // エラーメッセージから行番号を抽出
        const lineMatch = error.message.match(/line (\d+)/i);
        if (lineMatch) {
          errorLine = parseInt(lineMatch[1], 10);
        }

        // 特定のエラーパターンをチェック
        if (error.message.includes('VERSION')) {
          errorMessage = ErrorMessages.DBC_MISSING_VERSION;
        } else if (
          error.message.includes('BO_') ||
          error.message.includes('message')
        ) {
          errorMessage = `${ErrorMessages.DBC_INVALID_MESSAGE}: ${error.message}`;
        } else if (
          error.message.includes('SG_') ||
          error.message.includes('signal')
        ) {
          errorMessage = `${ErrorMessages.DBC_INVALID_SIGNAL}: ${error.message}`;
        }
      }

      errors.push({
        line: errorLine,
        message: errorMessage,
        type: 'SYNTAX_ERROR' as const,
      });

      return {
        success: false,
        errors,
        warnings,
      };
    }
  }

  private extractNodes(dbcData: DbcDataType): CANNode[] {
    const nodes: CANNode[] = [];

    // dbcDataからノード情報を抽出
    if (Array.isArray(dbcData.nodes)) {
      for (const nodeName of dbcData.nodes) {
        if (typeof nodeName === 'string') {
          nodes.push({
            name: nodeName,
            comment: undefined,
          });
        }
      }
    }

    return nodes;
  }

  private extractMessages(dbcData: DbcDataType): MessageMap {
    const messages: MessageMap = new Map();

    // dbcDataからメッセージ情報を抽出
    if (dbcData.messages && dbcData.messages instanceof Map) {
      for (const [messageName, dbcMessage] of dbcData.messages) {
        if (!this.isDbcMessage(dbcMessage)) {
          continue;
        }
        const messageData = dbcMessage;
        const signals: CANSignal[] = [];

        // シグナル情報を抽出
        if (messageData.signals && messageData.signals instanceof Map) {
          for (const [signalName, dbcSignal] of messageData.signals) {
            if (!this.isDbcSignal(dbcSignal)) {
              continue;
            }
            const signalData = dbcSignal;

            // 値テーブルをオブジェクトに変換
            let values: ValueTable | undefined;
            if (signalData.valueTable && signalData.valueTable instanceof Map) {
              values = {};
              for (const [key, value] of signalData.valueTable) {
                if (typeof key === 'number' && typeof value === 'string') {
                  values[key] = value;
                }
              }
            }

            signals.push({
              name: signalName,
              startBit: signalData.startBit,
              length: signalData.length,
              endianness:
                signalData.endian === 'Intel' ? 'little' : ('big' as const),
              signed: signalData.signed,
              factor: signalData.factor,
              offset: signalData.offset,
              min: signalData.min,
              max: signalData.max,
              unit: signalData.unit || '',
              receivingNodes: signalData.receivingNodes || [],
              values,
              comment: signalData.description || undefined,
            });
          }
        }

        messages.set(messageData.id, {
          id: messageData.id,
          name:
            typeof messageName === 'string' ? messageName : String(messageName),
          length: messageData.dlc,
          sendingNode: messageData.sendingNode || '',
          signals,
          comment: messageData.description || undefined,
        });
      }
    }

    return messages;
  }

  private isDbcData(data: unknown): data is DbcDataType {
    return typeof data === 'object' && data !== null;
  }

  private isDbcMessage(data: unknown): data is DbcMessage {
    if (typeof data !== 'object' || data === null) {
      return false;
    }
    const msg = data as Record<string, unknown>;
    return (
      typeof msg.id === 'number' &&
      typeof msg.dlc === 'number' &&
      msg.dlc >= 0 &&
      msg.dlc <= 8
    );
  }

  private isDbcSignal(data: unknown): data is DbcSignal {
    if (typeof data !== 'object' || data === null) {
      return false;
    }
    const sig = data as Record<string, unknown>;
    return (
      typeof sig.startBit === 'number' &&
      typeof sig.length === 'number' &&
      (sig.endian === 'Intel' || sig.endian === 'Motorola') &&
      typeof sig.signed === 'boolean' &&
      typeof sig.factor === 'number' &&
      typeof sig.offset === 'number' &&
      typeof sig.min === 'number' &&
      typeof sig.max === 'number'
    );
  }
}
