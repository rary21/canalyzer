import { render, screen, fireEvent } from '@testing-library/react';
import MessagesList from '../MessagesList';
import { CANMessage } from '@/types/dbc';

const mockMessages = new Map<number, CANMessage>([
  [
    100,
    {
      id: 100,
      name: 'EngineData',
      length: 8,
      sendingNode: 'ECU1',
      signals: [
        {
          name: 'EngineSpeed',
          startBit: 0,
          length: 16,
          endianness: 'little' as const,
          signed: false,
          factor: 0.25,
          offset: 0,
          min: 0,
          max: 16383.75,
          unit: 'rpm',
          receivingNodes: ['ECU2'],
        },
      ],
    },
  ],
  [
    200,
    {
      id: 200,
      name: 'VehicleSpeed',
      length: 2,
      sendingNode: 'ECU2',
      signals: [
        {
          name: 'Speed',
          startBit: 0,
          length: 16,
          endianness: 'little' as const,
          signed: false,
          factor: 0.01,
          offset: 0,
          min: 0,
          max: 655.35,
          unit: 'km/h',
          receivingNodes: ['ECU1'],
        },
      ],
    },
  ],
  [
    300,
    {
      id: 300,
      name: 'BrakeData',
      length: 4,
      sendingNode: 'ECU3',
      signals: [],
    },
  ],
]);

describe('MessagesList', () => {
  it('メッセージ一覧を表示する', () => {
    render(<MessagesList messages={mockMessages} />);

    expect(screen.getByText('EngineData')).toBeInTheDocument();
    expect(screen.getByText('VehicleSpeed')).toBeInTheDocument();
    expect(screen.getByText('BrakeData')).toBeInTheDocument();
  });

  it('メッセージ詳細を表示する', () => {
    render(<MessagesList messages={mockMessages} />);

    // CAN IDの表示（16進数と10進数）
    expect(screen.getByText('0x064')).toBeInTheDocument();
    expect(screen.getByText('(100)')).toBeInTheDocument();

    // サイズとノード情報
    expect(screen.getByText('ECU1')).toBeInTheDocument();
    expect(screen.getByText('ECU2')).toBeInTheDocument();
  });

  it('検索機能が動作する', () => {
    render(<MessagesList messages={mockMessages} />);

    const searchInput = screen.getByPlaceholderText(
      'メッセージ名、ID、送信ノードで検索...'
    );

    // メッセージ名で検索
    fireEvent.change(searchInput, { target: { value: 'Engine' } });
    expect(screen.getByText('EngineData')).toBeInTheDocument();
    expect(screen.queryByText('VehicleSpeed')).not.toBeInTheDocument();

    // IDで検索
    fireEvent.change(searchInput, { target: { value: '200' } });
    expect(screen.getByText('VehicleSpeed')).toBeInTheDocument();
    expect(screen.queryByText('EngineData')).not.toBeInTheDocument();

    // 送信ノードで検索
    fireEvent.change(searchInput, { target: { value: 'ECU3' } });
    expect(screen.getByText('BrakeData')).toBeInTheDocument();
    expect(screen.queryByText('EngineData')).not.toBeInTheDocument();
  });

  it('ソート機能が動作する', () => {
    render(<MessagesList messages={mockMessages} />);

    // IDでソート（昇順がデフォルト）
    const rows = screen.getAllByRole('row');
    expect(rows[1]).toHaveTextContent('0x064'); // 100
    expect(rows[2]).toHaveTextContent('0x0C8'); // 200
    expect(rows[3]).toHaveTextContent('0x12C'); // 300

    // IDヘッダーをクリックして降順にソート
    fireEvent.click(screen.getByText(/ID/));
    const rowsAfterSort = screen.getAllByRole('row');
    expect(rowsAfterSort[1]).toHaveTextContent('0x12C'); // 300
    expect(rowsAfterSort[2]).toHaveTextContent('0x0C8'); // 200
    expect(rowsAfterSort[3]).toHaveTextContent('0x064'); // 100
  });

  it('メッセージ詳細モーダルを開くことができる', () => {
    render(<MessagesList messages={mockMessages} />);

    const detailButtons = screen.getAllByText('詳細表示');
    fireEvent.click(detailButtons[0]);

    // モーダルが開いたことを確認
    expect(screen.getByText('メッセージ詳細: EngineData')).toBeInTheDocument();
  });

  it('表示件数を正しく表示する', () => {
    render(<MessagesList messages={mockMessages} />);

    expect(screen.getByText('表示中: 3 / 3 件')).toBeInTheDocument();

    // 検索後の件数
    const searchInput = screen.getByPlaceholderText(
      'メッセージ名、ID、送信ノードで検索...'
    );
    fireEvent.change(searchInput, { target: { value: 'Engine' } });
    expect(screen.getByText('表示中: 1 / 3 件')).toBeInTheDocument();
  });

  it('メッセージが0件の場合は適切なメッセージを表示する', () => {
    render(<MessagesList messages={new Map()} />);

    expect(
      screen.getByText('メッセージが定義されていません')
    ).toBeInTheDocument();
  });

  it('シグナル数を正しく表示する', () => {
    render(<MessagesList messages={mockMessages} />);

    const rows = screen.getAllByRole('row');
    expect(rows[1]).toHaveTextContent('1'); // EngineData: 1 signal
    expect(rows[2]).toHaveTextContent('1'); // VehicleSpeed: 1 signal
    expect(rows[3]).toHaveTextContent('0'); // BrakeData: 0 signals
  });
});
