import { CANFrame, CANDataSet } from '@/types/can';
import { DBCDatabase, CANMessage, CANSignal, CANNode } from '@/types/dbc';

/**
 * サンプルDBCデータベース
 * 一般的な車両CANメッセージを模擬
 */
export const sampleDBCDatabase: DBCDatabase = {
  version: '1.0.0',
  nodes: [
    { name: 'Engine_ECU', comment: 'エンジン制御ユニット' },
    { name: 'Body_ECU', comment: 'ボディ制御ユニット' },
    { name: 'Transmission_ECU', comment: 'トランスミッション制御ユニット' },
  ] as CANNode[],
  messages: new Map<number, CANMessage>([
    // エンジン情報メッセージ (0x200)
    [
      0x200,
      {
        id: 0x200,
        name: 'Engine_Status',
        length: 8,
        sendingNode: 'Engine_ECU',
        signals: [
          {
            name: 'Engine_RPM',
            startBit: 0,
            length: 16,
            endianness: 'little',
            signed: false,
            factor: 0.25,
            offset: 0,
            min: 0,
            max: 8191.75,
            unit: 'rpm',
            receivingNodes: ['Body_ECU'],
            comment: 'エンジン回転数',
          },
          {
            name: 'Engine_Load',
            startBit: 16,
            length: 8,
            endianness: 'little',
            signed: false,
            factor: 0.5,
            offset: 0,
            min: 0,
            max: 127.5,
            unit: '%',
            receivingNodes: ['Body_ECU'],
            comment: 'エンジン負荷',
          },
          {
            name: 'Engine_Temp',
            startBit: 24,
            length: 8,
            endianness: 'little',
            signed: true,
            factor: 1,
            offset: -40,
            min: -40,
            max: 215,
            unit: '°C',
            receivingNodes: ['Body_ECU'],
            comment: '冷却水温度',
          },
        ] as CANSignal[],
        comment: 'エンジン状態情報',
      },
    ],

    // 車速・ギア情報メッセージ (0x300)
    [
      0x300,
      {
        id: 0x300,
        name: 'Vehicle_Motion',
        length: 8,
        sendingNode: 'Transmission_ECU',
        signals: [
          {
            name: 'Vehicle_Speed',
            startBit: 0,
            length: 16,
            endianness: 'little',
            signed: false,
            factor: 0.01,
            offset: 0,
            min: 0,
            max: 655.35,
            unit: 'km/h',
            receivingNodes: ['Engine_ECU', 'Body_ECU'],
            comment: '車両速度',
          },
          {
            name: 'Gear_Position',
            startBit: 16,
            length: 4,
            endianness: 'little',
            signed: false,
            factor: 1,
            offset: 0,
            min: 0,
            max: 15,
            unit: '',
            receivingNodes: ['Engine_ECU', 'Body_ECU'],
            values: {
              0: 'Park',
              1: 'Reverse',
              2: 'Neutral',
              3: 'Drive_1',
              4: 'Drive_2',
              5: 'Drive_3',
              6: 'Drive_4',
              7: 'Drive_5',
            },
            comment: 'ギアポジション',
          },
          {
            name: 'Brake_Pedal',
            startBit: 20,
            length: 1,
            endianness: 'little',
            signed: false,
            factor: 1,
            offset: 0,
            min: 0,
            max: 1,
            unit: '',
            receivingNodes: ['Engine_ECU', 'Body_ECU'],
            values: {
              0: 'Released',
              1: 'Pressed',
            },
            comment: 'ブレーキペダル状態',
          },
        ] as CANSignal[],
        comment: '車両運動情報',
      },
    ],

    // ボディ情報メッセージ (0x400)
    [
      0x400,
      {
        id: 0x400,
        name: 'Body_Status',
        length: 8,
        sendingNode: 'Body_ECU',
        signals: [
          {
            name: 'Door_Status',
            startBit: 0,
            length: 4,
            endianness: 'little',
            signed: false,
            factor: 1,
            offset: 0,
            min: 0,
            max: 15,
            unit: '',
            receivingNodes: ['Engine_ECU'],
            comment: 'ドア開閉状態（ビットマスク）',
          },
          {
            name: 'Outside_Temp',
            startBit: 8,
            length: 8,
            endianness: 'little',
            signed: true,
            factor: 0.5,
            offset: -40,
            min: -40,
            max: 87.5,
            unit: '°C',
            receivingNodes: ['Engine_ECU'],
            comment: '外気温度',
          },
          {
            name: 'Fuel_Level',
            startBit: 16,
            length: 8,
            endianness: 'little',
            signed: false,
            factor: 0.5,
            offset: 0,
            min: 0,
            max: 127.5,
            unit: '%',
            receivingNodes: ['Engine_ECU'],
            comment: '燃料レベル',
          },
        ] as CANSignal[],
        comment: 'ボディ状態情報',
      },
    ],
  ]),
};

/**
 * サンプルCANフレームデータ
 * 10秒間のドライビングシナリオを模擬（加速→定速→減速）
 */
export const sampleCANFrames: CANFrame[] = [
  // t=0ms: 停車状態
  {
    id: 0x200,
    data: new Uint8Array([0x00, 0x03, 0x14, 0x50]), // RPM:768, Load:10%, Temp:40°C
    timestamp: 0,
    extended: false,
    dlc: 4,
  },
  {
    id: 0x300,
    data: new Uint8Array([0x00, 0x00, 0x00, 0x00]), // Speed:0, Gear:Park, Brake:Released
    timestamp: 0,
    extended: false,
    dlc: 4,
  },
  {
    id: 0x400,
    data: new Uint8Array([0x00, 0x50, 0x64]), // Doors:Closed, Outside:0°C, Fuel:50%
    timestamp: 0,
    extended: false,
    dlc: 3,
  },

  // t=1000ms: エンジン始動、ギアをDriveに
  {
    id: 0x200,
    data: new Uint8Array([0x20, 0x03, 0x1e, 0x52]), // RPM:800, Load:15%, Temp:42°C
    timestamp: 1000,
    extended: false,
    dlc: 4,
  },
  {
    id: 0x300,
    data: new Uint8Array([0x00, 0x00, 0x03, 0x10]), // Speed:0, Gear:Drive_1, Brake:Pressed
    timestamp: 1000,
    extended: false,
    dlc: 4,
  },

  // t=2000ms: 発進開始
  {
    id: 0x200,
    data: new Uint8Array([0x80, 0x04, 0x32, 0x54]), // RPM:1152, Load:25%, Temp:44°C
    timestamp: 2000,
    extended: false,
    dlc: 4,
  },
  {
    id: 0x300,
    data: new Uint8Array([0x0a, 0x00, 0x03, 0x00]), // Speed:0.1km/h, Gear:Drive_1, Brake:Released
    timestamp: 2000,
    extended: false,
    dlc: 4,
  },

  // t=3000ms: 加速中
  {
    id: 0x200,
    data: new Uint8Array([0x00, 0x08, 0x50, 0x56]), // RPM:2048, Load:40%, Temp:46°C
    timestamp: 3000,
    extended: false,
    dlc: 4,
  },
  {
    id: 0x300,
    data: new Uint8Array([0x90, 0x01, 0x03, 0x00]), // Speed:4km/h, Gear:Drive_1, Brake:Released
    timestamp: 3000,
    extended: false,
    dlc: 4,
  },

  // t=4000ms: シフトアップ
  {
    id: 0x200,
    data: new Uint8Array([0x40, 0x0a, 0x46, 0x58]), // RPM:2624, Load:35%, Temp:48°C
    timestamp: 4000,
    extended: false,
    dlc: 4,
  },
  {
    id: 0x300,
    data: new Uint8Array([0x20, 0x03, 0x04, 0x00]), // Speed:8km/h, Gear:Drive_2, Brake:Released
    timestamp: 4000,
    extended: false,
    dlc: 4,
  },

  // t=5000ms: 加速継続
  {
    id: 0x200,
    data: new Uint8Array([0x80, 0x0c, 0x5a, 0x5a]), // RPM:3200, Load:45%, Temp:50°C
    timestamp: 5000,
    extended: false,
    dlc: 4,
  },
  {
    id: 0x300,
    data: new Uint8Array([0xe8, 0x03, 0x04, 0x00]), // Speed:10km/h, Gear:Drive_2, Brake:Released
    timestamp: 5000,
    extended: false,
    dlc: 4,
  },

  // t=6000ms: 定速走行
  {
    id: 0x200,
    data: new Uint8Array([0x00, 0x0f, 0x3c, 0x5c]), // RPM:3840, Load:30%, Temp:52°C
    timestamp: 6000,
    extended: false,
    dlc: 4,
  },
  {
    id: 0x300,
    data: new Uint8Array([0x10, 0x27, 0x05, 0x00]), // Speed:100km/h, Gear:Drive_3, Brake:Released
    timestamp: 6000,
    extended: false,
    dlc: 4,
  },

  // t=7000ms: 定速継続
  {
    id: 0x200,
    data: new Uint8Array([0x00, 0x0f, 0x28, 0x5e]), // RPM:3840, Load:20%, Temp:54°C
    timestamp: 7000,
    extended: false,
    dlc: 4,
  },
  {
    id: 0x300,
    data: new Uint8Array([0x10, 0x27, 0x05, 0x00]), // Speed:100km/h, Gear:Drive_3, Brake:Released
    timestamp: 7000,
    extended: false,
    dlc: 4,
  },

  // t=8000ms: 減速開始
  {
    id: 0x200,
    data: new Uint8Array([0x80, 0x0a, 0x14, 0x60]), // RPM:2688, Load:10%, Temp:56°C
    timestamp: 8000,
    extended: false,
    dlc: 4,
  },
  {
    id: 0x300,
    data: new Uint8Array([0x58, 0x1b, 0x04, 0x10]), // Speed:70km/h, Gear:Drive_2, Brake:Pressed
    timestamp: 8000,
    extended: false,
    dlc: 4,
  },

  // t=9000ms: さらに減速
  {
    id: 0x200,
    data: new Uint8Array([0x00, 0x06, 0x0a, 0x62]), // RPM:1536, Load:5%, Temp:58°C
    timestamp: 9000,
    extended: false,
    dlc: 4,
  },
  {
    id: 0x300,
    data: new Uint8Array([0xf4, 0x01, 0x03, 0x10]), // Speed:5km/h, Gear:Drive_1, Brake:Pressed
    timestamp: 9000,
    extended: false,
    dlc: 4,
  },

  // t=10000ms: 停車
  {
    id: 0x200,
    data: new Uint8Array([0x20, 0x03, 0x00, 0x64]), // RPM:800, Load:0%, Temp:60°C
    timestamp: 10000,
    extended: false,
    dlc: 4,
  },
  {
    id: 0x300,
    data: new Uint8Array([0x00, 0x00, 0x00, 0x10]), // Speed:0, Gear:Park, Brake:Pressed
    timestamp: 10000,
    extended: false,
    dlc: 4,
  },

  // 定期的なボディ情報更新
  {
    id: 0x400,
    data: new Uint8Array([0x00, 0x50, 0x63]), // Doors:Closed, Outside:0°C, Fuel:49.5%
    timestamp: 5000,
    extended: false,
    dlc: 3,
  },
  {
    id: 0x400,
    data: new Uint8Array([0x00, 0x50, 0x62]), // Doors:Closed, Outside:0°C, Fuel:49%
    timestamp: 10000,
    extended: false,
    dlc: 3,
  },
];

/**
 * サンプルCANデータセット
 * 上記のフレームデータをまとめたもの
 */
export const sampleCANDataSet: CANDataSet = {
  name: 'ドライビングシナリオ_サンプル',
  createdAt: Date.now(),
  frames: sampleCANFrames,
  values: [], // パーサーによって自動生成される
  description:
    '10秒間のドライビングシナリオ（停車→加速→定速→減速→停車）を模擬したCANデータ',
};

/**
 * 使用例：パーサーでサンプルデータを解析
 */
export const parseSampleData = () => {
  // 使用例はテストファイルまたはコンポーネントで実装
  console.log('サンプルデータ:');
  console.log(`- DBCメッセージ数: ${sampleDBCDatabase.messages.size}`);
  console.log(`- CANフレーム数: ${sampleCANFrames.length}`);
  console.log(
    `- 時間範囲: ${sampleCANFrames[0]?.timestamp}ms - ${sampleCANFrames[sampleCANFrames.length - 1]?.timestamp}ms`
  );
};
