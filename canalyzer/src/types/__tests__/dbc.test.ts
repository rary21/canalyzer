import {
  CANNode,
  CANSignal,
  CANMessage,
  DBCDatabase,
  ParseResult,
  ParseError,
  ParseWarning
} from '../dbc';

describe('DBC型定義', () => {
  describe('CANNode', () => {
    it('必要なプロパティを持つ', () => {
      const node: CANNode = {
        name: 'ECU1'
      };

      expect(node.name).toBe('ECU1');
      expect(node.comment).toBeUndefined();
    });

    it('オプショナルなコメントを持てる', () => {
      const node: CANNode = {
        name: 'ECU1',
        comment: 'Engine Control Unit'
      };

      expect(node.comment).toBe('Engine Control Unit');
    });
  });

  describe('CANSignal', () => {
    it('すべての必要なプロパティを持つ', () => {
      const signal: CANSignal = {
        name: 'EngineSpeed',
        startBit: 0,
        length: 16,
        endianness: 'little',
        signed: false,
        factor: 0.25,
        offset: 0,
        min: 0,
        max: 16383.75,
        unit: 'rpm',
        receivingNodes: ['ECU2', 'Display']
      };

      expect(signal.name).toBe('EngineSpeed');
      expect(signal.endianness).toBe('little');
      expect(signal.signed).toBe(false);
      expect(signal.receivingNodes).toHaveLength(2);
    });

    it('values と comment がオプショナル', () => {
      const signal: CANSignal = {
        name: 'GearPosition',
        startBit: 0,
        length: 3,
        endianness: 'big',
        signed: false,
        factor: 1,
        offset: 0,
        min: 0,
        max: 7,
        unit: '',
        receivingNodes: [],
        values: { 0: 'Park', 1: 'Reverse', 2: 'Neutral' },
        comment: 'Current gear position'
      };

      expect(signal.values).toBeDefined();
      expect(signal.values![0]).toBe('Park');
      expect(signal.comment).toBe('Current gear position');
    });
  });

  describe('CANMessage', () => {
    it('必要なプロパティを持つ', () => {
      const message: CANMessage = {
        id: 100,
        name: 'EngineData',
        length: 8,
        sendingNode: 'ECU1',
        signals: []
      };

      expect(message.id).toBe(100);
      expect(message.name).toBe('EngineData');
      expect(message.length).toBe(8);
      expect(message.signals).toHaveLength(0);
    });
  });

  describe('DBCDatabase', () => {
    it('必要なプロパティを持つ', () => {
      const database: DBCDatabase = {
        version: '1.0',
        nodes: [],
        messages: new Map()
      };

      expect(database.version).toBe('1.0');
      expect(database.nodes).toHaveLength(0);
      expect(database.messages instanceof Map).toBe(true);
    });

    it('オプショナルなbaudrateを持てる', () => {
      const database: DBCDatabase = {
        version: '',
        nodes: [],
        messages: new Map(),
        baudrate: 500000
      };

      expect(database.baudrate).toBe(500000);
    });
  });

  describe('ParseError', () => {
    it('正しい構造を持つ', () => {
      const error: ParseError = {
        line: 10,
        message: 'Syntax error',
        type: 'SYNTAX_ERROR'
      };

      expect(error.line).toBe(10);
      expect(error.message).toBe('Syntax error');
      expect(error.type).toBe('SYNTAX_ERROR');
    });

    it('すべてのエラータイプをサポートする', () => {
      const syntaxError: ParseError = { line: 1, message: '', type: 'SYNTAX_ERROR' };
      const invalidValue: ParseError = { line: 1, message: '', type: 'INVALID_VALUE' };
      const missingRequired: ParseError = { line: 1, message: '', type: 'MISSING_REQUIRED' };

      expect(syntaxError.type).toBe('SYNTAX_ERROR');
      expect(invalidValue.type).toBe('INVALID_VALUE');
      expect(missingRequired.type).toBe('MISSING_REQUIRED');
    });
  });

  describe('ParseWarning', () => {
    it('正しい構造を持つ', () => {
      const warning: ParseWarning = {
        line: 5,
        message: 'Unknown keyword',
        type: 'UNKNOWN_KEYWORD'
      };

      expect(warning.line).toBe(5);
      expect(warning.message).toBe('Unknown keyword');
      expect(warning.type).toBe('UNKNOWN_KEYWORD');
    });
  });

  describe('ParseResult', () => {
    it('成功の場合の構造', () => {
      const result: ParseResult = {
        success: true,
        database: {
          version: '',
          nodes: [],
          messages: new Map()
        },
        errors: [],
        warnings: []
      };

      expect(result.success).toBe(true);
      expect(result.database).toBeDefined();
      expect(result.errors).toHaveLength(0);
    });

    it('失敗の場合の構造', () => {
      const result: ParseResult = {
        success: false,
        errors: [{ line: 1, message: 'Error', type: 'SYNTAX_ERROR' }],
        warnings: []
      };

      expect(result.success).toBe(false);
      expect(result.database).toBeUndefined();
      expect(result.errors).toHaveLength(1);
    });
  });
});