import { DBCParser } from '../dbc-parser';

describe('DBCParser', () => {
  let parser: DBCParser;

  beforeEach(() => {
    parser = new DBCParser();
  });

  describe('parse', () => {
    it('正常なDBCファイルを正しくパースできる', () => {
      const validDbc = `VERSION ""

NS_ : 

BS_:

BU_ ECU1 ECU2

BO_ 100 EngineData: 8 ECU1
 SG_ EngineSpeed : 0|16@1+ (0.25,0) [0|16383.75] "rpm" ECU2

BO_ 200 VehicleSpeed: 2 ECU2
 SG_ Speed : 0|16@1+ (0.01,0) [0|655.35] "km/h" ECU1
`;

      const result = parser.parse(validDbc);

      expect(result.success).toBe(true);
      expect(result.database).toBeDefined();
      expect(result.errors).toHaveLength(0);
      
      if (result.database) {
        // メッセージ数の確認
        expect(result.database.messages.size).toBe(2);
        
        // 特定のメッセージの確認
        const engineData = result.database.messages.get(100);
        expect(engineData).toBeDefined();
        expect(engineData?.name).toBe('EngineData');
        expect(engineData?.length).toBe(8);
        expect(engineData?.sendingNode).toBe('ECU1');
        expect(engineData?.signals).toHaveLength(1);
        
        // シグナルの確認
        const engineSpeed = engineData?.signals[0];
        expect(engineSpeed?.name).toBe('EngineSpeed');
        expect(engineSpeed?.startBit).toBe(0);
        expect(engineSpeed?.length).toBe(16);
        expect(engineSpeed?.endianness).toBe('little');
        expect(engineSpeed?.factor).toBe(0.25);
        expect(engineSpeed?.offset).toBe(0);
        expect(engineSpeed?.unit).toBe('rpm');
      }
    });

    it('空のファイルでもエラーにならない', () => {
      const emptyDbc = '';
      const result = parser.parse(emptyDbc);

      expect(result.success).toBe(true);
      expect(result.database).toBeDefined();
      expect(result.database?.messages.size).toBe(0);
      expect(result.database?.nodes).toHaveLength(0);
    });

    it('不正なDBCファイルでエラーを返す', () => {
      const invalidDbc = 'これは不正なDBCファイルです';
      const result = parser.parse(invalidDbc);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].type).toBe('SYNTAX_ERROR');
    });

    it('複数のノードを正しく抽出できる', () => {
      const dbcWithNodes = `VERSION ""

BU_ ECU1 ECU2 Gateway Display

BO_ 100 TestMessage: 8 ECU1
`;

      const result = parser.parse(dbcWithNodes);

      expect(result.success).toBe(true);
      if (result.database) {
        expect(result.database.nodes.length).toBe(4);
        const nodeNames = result.database.nodes.map(n => n.name);
        expect(nodeNames).toContain('ECU1');
        expect(nodeNames).toContain('ECU2');
        expect(nodeNames).toContain('Gateway');
        expect(nodeNames).toContain('Display');
      }
    });

    it('シグナルの属性を正しく解析できる', () => {
      const dbcWithSignalDetails = `VERSION ""

BU_ ECU1

BO_ 100 TestMessage: 8 ECU1
 SG_ TestSignal : 8|8@0- (1.5,10) [-128|127] "degC" ECU1
`;

      const result = parser.parse(dbcWithSignalDetails);

      expect(result.success).toBe(true);
      if (result.database) {
        const message = result.database.messages.get(100);
        const signal = message?.signals[0];
        
        expect(signal?.name).toBe('TestSignal');
        expect(signal?.startBit).toBe(8);
        expect(signal?.length).toBe(8);
        expect(signal?.endianness).toBe('big'); // @0 = big endian
        expect(signal?.signed).toBe(true); // - = signed
        expect(signal?.factor).toBe(1.5);
        expect(signal?.offset).toBe(10);
        expect(signal?.min).toBe(-128);
        expect(signal?.max).toBe(127);
        expect(signal?.unit).toBe('degC');
      }
    });

    it('バージョン情報を正しく抽出できる', () => {
      const dbcWithVersion = `VERSION "1.0"

BU_:
`;

      const result = parser.parse(dbcWithVersion);

      expect(result.success).toBe(true);
      expect(result.database?.version).toBe('1.0');
    });
  });

  describe('エラーハンドリング', () => {
    it('nullまたはundefinedの入力でエラーを返す', () => {
      expect(() => parser.parse(null as unknown as string)).toThrow();
      expect(() => parser.parse(undefined as unknown as string)).toThrow();
    });
  });
});