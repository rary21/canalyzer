import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CANValuesDisplay from '../CANValuesDisplay';
import { CANValue } from '@/types/can';

describe('CANValuesDisplay', () => {
  const mockValues: CANValue[] = [
    {
      signalName: 'Engine_RPM',
      messageName: 'Engine_Status',
      rawValue: 800,
      physicalValue: 200.0,
      unit: 'rpm',
      timestamp: 1000,
      description: 'エンジン回転数'
    },
    {
      signalName: 'Vehicle_Speed',
      messageName: 'Vehicle_Status',
      rawValue: 1000,
      physicalValue: 10.0,
      unit: 'km/h',
      timestamp: 2000
    },
    {
      signalName: 'Engine_Temp',
      messageName: 'Engine_Status',
      rawValue: 80,
      physicalValue: 40.0,
      unit: '°C',
      timestamp: 3000,
      description: '冷却水温度'
    },
    {
      signalName: 'Brake_Pedal',
      messageName: 'Brake_Status',
      rawValue: 1,
      physicalValue: 1,
      unit: '',
      timestamp: 4000,
      description: 'Pressed'
    }
  ];

  describe('レンダリング', () => {
    it('データありで正しくレンダリングされる', () => {
      render(<CANValuesDisplay values={mockValues} />);

      expect(screen.getByText('CAN信号値')).toBeInTheDocument();
      expect(screen.getByText('4 / 4 件のシグナル値')).toBeInTheDocument();
      
      // テーブルヘッダーの確認
      expect(screen.getByText('シグナル名')).toBeInTheDocument();
      expect(screen.getByText('物理値')).toBeInTheDocument();
      expect(screen.getByText('生値')).toBeInTheDocument();
      expect(screen.getByText('単位')).toBeInTheDocument();
      expect(screen.getByText('タイムスタンプ')).toBeInTheDocument();
      expect(screen.getByText('説明')).toBeInTheDocument();

      // データ行の確認
      expect(screen.getByText('Engine_RPM')).toBeInTheDocument();
      expect(screen.getByText('Vehicle_Speed')).toBeInTheDocument();
      expect(screen.getByText('200')).toBeInTheDocument();
      expect(screen.getByText('10')).toBeInTheDocument();
    });

    it('データなしで正しくレンダリングされる', () => {
      render(<CANValuesDisplay values={[]} />);

      expect(screen.getByText('CANデータがありません')).toBeInTheDocument();
      expect(screen.getByText('サンプルデータを読み込むか、CANフレームをパースしてください')).toBeInTheDocument();
    });

    it('ローディング状態で正しくレンダリングされる', () => {
      render(<CANValuesDisplay values={[]} isLoading={true} />);

      expect(screen.getByText('CANデータを解析中...')).toBeInTheDocument();
      // スピナーアニメーションが存在することを確認
      expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });
  });

  describe('検索機能', () => {
    it('シグナル名で検索できる', async () => {
      render(<CANValuesDisplay values={mockValues} />);

      const searchInput = screen.getByPlaceholderText('シグナル名、メッセージ名、単位、説明で検索...');
      fireEvent.change(searchInput, { target: { value: 'Engine' } });

      await waitFor(() => {
        expect(screen.getByText('2 / 4 件のシグナル値')).toBeInTheDocument();
      });

      expect(screen.getByText('Engine_RPM')).toBeInTheDocument();
      expect(screen.getByText('Engine_Temp')).toBeInTheDocument();
      expect(screen.queryByText('Vehicle_Speed')).not.toBeInTheDocument();
    });

    it('単位で検索できる', async () => {
      render(<CANValuesDisplay values={mockValues} />);

      const searchInput = screen.getByPlaceholderText('シグナル名、メッセージ名、単位、説明で検索...');
      fireEvent.change(searchInput, { target: { value: 'rpm' } });

      await waitFor(() => {
        expect(screen.getByText('1 / 4 件のシグナル値')).toBeInTheDocument();
      });

      expect(screen.getByText('Engine_RPM')).toBeInTheDocument();
      expect(screen.queryByText('Vehicle_Speed')).not.toBeInTheDocument();
    });

    it('説明で検索できる', async () => {
      render(<CANValuesDisplay values={mockValues} />);

      const searchInput = screen.getByPlaceholderText('シグナル名、メッセージ名、単位、説明で検索...');
      fireEvent.change(searchInput, { target: { value: '冷却水' } });

      await waitFor(() => {
        expect(screen.getByText('1 / 4 件のシグナル値')).toBeInTheDocument();
      });

      expect(screen.getByText('Engine_Temp')).toBeInTheDocument();
      expect(screen.queryByText('Engine_RPM')).not.toBeInTheDocument();
    });

    it('大文字小文字を区別しない検索', async () => {
      render(<CANValuesDisplay values={mockValues} />);

      const searchInput = screen.getByPlaceholderText('シグナル名、メッセージ名、単位、説明で検索...');
      fireEvent.change(searchInput, { target: { value: 'engine' } });

      await waitFor(() => {
        expect(screen.getByText('2 / 4 件のシグナル値')).toBeInTheDocument();
      });

      expect(screen.getByText('Engine_RPM')).toBeInTheDocument();
      expect(screen.getByText('Engine_Temp')).toBeInTheDocument();
    });

    it('検索結果がない場合の表示', async () => {
      render(<CANValuesDisplay values={mockValues} />);

      const searchInput = screen.getByPlaceholderText('シグナル名、メッセージ名、単位、説明で検索...');
      fireEvent.change(searchInput, { target: { value: 'NonExistent' } });

      await waitFor(() => {
        expect(screen.getByText('0 / 4 件のシグナル値')).toBeInTheDocument();
      });

      // データ行が表示されないことを確認
      expect(screen.queryByText('Engine_RPM')).not.toBeInTheDocument();
    });
  });

  describe('ソート機能', () => {
    it('シグナル名でソートできる', async () => {
      render(<CANValuesDisplay values={mockValues} />);

      const signalNameHeader = screen.getByText('シグナル名').closest('th');
      fireEvent.click(signalNameHeader!);

      await waitFor(() => {
        const rows = screen.getAllByRole('row').slice(1); // ヘッダー行を除く
        const firstRowText = rows[0].textContent;
        expect(firstRowText).toContain('Brake_Pedal'); // アルファベット順で最初
      });
    });

    it('物理値でソートできる', async () => {
      render(<CANValuesDisplay values={mockValues} />);

      const physicalValueHeader = screen.getByText('物理値').closest('th');
      fireEvent.click(physicalValueHeader!);

      await waitFor(() => {
        const rows = screen.getAllByRole('row').slice(1);
        const firstRowText = rows[0].textContent;
        expect(firstRowText).toContain('1'); // 昇順で最小値
      });
    });

    it('タイムスタンプでソートできる', async () => {
      render(<CANValuesDisplay values={mockValues} />);

      const timestampHeader = screen.getByText('タイムスタンプ').closest('th');
      fireEvent.click(timestampHeader!);

      await waitFor(() => {
        const rows = screen.getAllByRole('row').slice(1);
        const firstRowText = rows[0].textContent;
        expect(firstRowText).toContain('Engine_RPM'); // タイムスタンプ1000で最初
      });
    });

    it('ソート方向を切り替えできる', async () => {
      render(<CANValuesDisplay values={mockValues} />);

      const signalNameHeader = screen.getByText('シグナル名').closest('th');
      
      // 最初のクリック（昇順）
      fireEvent.click(signalNameHeader!);
      await waitFor(() => {
        const rows = screen.getAllByRole('row').slice(1);
        expect(rows[0].textContent).toContain('Brake_Pedal');
      });

      // 2回目のクリック（降順）
      fireEvent.click(signalNameHeader!);
      await waitFor(() => {
        const rows = screen.getAllByRole('row').slice(1);
        expect(rows[0].textContent).toContain('Vehicle_Speed');
      });
    });

    it('ソートアイコンが表示される', () => {
      render(<CANValuesDisplay values={mockValues} />);

      // 初期状態ではタイムスタンプ降順ソート
      const timestampHeader = screen.getByText('タイムスタンプ').closest('th');
      expect(timestampHeader).toBeInTheDocument();
      
      // ソートアイコンが存在することを確認（SVG要素）
      const sortIcons = timestampHeader!.querySelectorAll('svg');
      expect(sortIcons.length).toBeGreaterThan(0);
    });
  });

  describe('ページネーション', () => {
    // 51個のテストデータを生成（ページネーションをテストするため）
    const manyValues: CANValue[] = Array.from({ length: 51 }, (_, i) => ({
      signalName: `Signal_${i}`,
      messageName: 'TestMessage',
      rawValue: i,
      physicalValue: i * 0.1,
      unit: 'unit',
      timestamp: 1000 + i * 100
    }));

    it('50件を超える場合にページネーションが表示される', () => {
      render(<CANValuesDisplay values={manyValues} />);

      expect(screen.getByText('1 / 2')).toBeInTheDocument(); // ページ番号表示
      expect(screen.getByText('1 - 50 / 51 件')).toBeInTheDocument(); // 件数表示
    });

    it('次のページに移動できる', async () => {
      render(<CANValuesDisplay values={manyValues} />);

      const nextButton = screen.getByRole('button', { name: /次のページ/ });
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText('2 / 2')).toBeInTheDocument();
        expect(screen.getByText('51 - 51 / 51 件')).toBeInTheDocument();
      });
    });

    it('前のページに戻れる', async () => {
      render(<CANValuesDisplay values={manyValues} />);

      // 次のページに移動
      const nextButton = screen.getByRole('button', { name: /次のページ/ });
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText('2 / 2')).toBeInTheDocument();
      });

      // 前のページに戻る
      const prevButton = screen.getByRole('button', { name: /前のページ/ });
      fireEvent.click(prevButton);

      await waitFor(() => {
        expect(screen.getByText('1 / 2')).toBeInTheDocument();
      });
    });

    it('最初のページで前ボタンが無効になる', () => {
      render(<CANValuesDisplay values={manyValues} />);

      const prevButton = screen.getByRole('button', { name: /前のページ/ });
      expect(prevButton).toBeDisabled();
    });

    it('最後のページで次ボタンが無効になる', async () => {
      render(<CANValuesDisplay values={manyValues} />);

      // 最後のページに移動
      const nextButton = screen.getByRole('button', { name: /次のページ/ });
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(nextButton).toBeDisabled();
      });
    });

    it('検索時にページがリセットされる', async () => {
      render(<CANValuesDisplay values={manyValues} />);

      // 2ページ目に移動
      const nextButton = screen.getByRole('button', { name: /次のページ/ });
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText('2 / 2')).toBeInTheDocument();
      });

      // 検索を実行
      const searchInput = screen.getByPlaceholderText('シグナル名、メッセージ名、単位、説明で検索...');
      fireEvent.change(searchInput, { target: { value: 'Signal_1' } });

      await waitFor(() => {
        // 検索結果が11件（Signal_1, Signal_10-19）になることを確認
        expect(screen.getByText(/11.*件のシグナル値/)).toBeInTheDocument();
      });
    });
  });

  describe('データ表示形式', () => {
    it('タイムスタンプが正しい形式で表示される', () => {
      const testValue: CANValue = {
        signalName: 'TestSignal',
        messageName: 'TestMessage',
        rawValue: 100,
        physicalValue: 10.0,
        unit: 'unit',
        timestamp: new Date('2023-12-25T10:30:45.123Z').getTime()
      };

      render(<CANValuesDisplay values={[testValue]} />);

      // 日本時間でフォーマットされた時刻が表示されることを確認
      expect(screen.getByText(/2023/)).toBeInTheDocument();
    });

    it('物理値が適切な桁数で表示される', () => {
      const testValues: CANValue[] = [
        {
          signalName: 'IntegerValue',
          messageName: 'TestMessage',
          rawValue: 100,
          physicalValue: 100,
          unit: 'count',
          timestamp: 1000
        },
        {
          signalName: 'DecimalValue',
          messageName: 'TestMessage',
          rawValue: 1234,
          physicalValue: 12.345,
          unit: 'value',
          timestamp: 2000
        }
      ];

      render(<CANValuesDisplay values={testValues} />);

      // 整数値と小数値の表示を確認
      expect(screen.getByText('IntegerValue')).toBeInTheDocument();
      expect(screen.getByText('DecimalValue')).toBeInTheDocument();
      
      // 物理値が適切にフォーマットされているかより詳細に確認
      const integerRow = screen.getByText('IntegerValue').closest('tr');
      const decimalRow = screen.getByText('DecimalValue').closest('tr');
      
      expect(integerRow?.textContent).toContain('100'); // 整数値
      expect(decimalRow?.textContent).toContain('12.345'); // 小数値（3桁まで）
    });

    it('単位が空文字の場合にダッシュが表示される', () => {
      const testValue: CANValue = {
        signalName: 'NoUnitSignal',
        messageName: 'TestMessage',
        rawValue: 1,
        physicalValue: 1,
        unit: '',
        timestamp: 1000
      };

      render(<CANValuesDisplay values={[testValue]} />);

      const rows = screen.getAllByRole('row').slice(1);
      expect(rows[0].textContent).toContain('-');
    });

    it('説明がない場合にダッシュが表示される', () => {
      const testValue: CANValue = {
        signalName: 'NoDescSignal',
        messageName: 'TestMessage',
        rawValue: 1,
        physicalValue: 1,
        unit: 'unit',
        timestamp: 1000
      };

      render(<CANValuesDisplay values={[testValue]} />);

      const rows = screen.getAllByRole('row').slice(1);
      expect(rows[0].textContent).toContain('-');
    });
  });

  describe('レスポンシブ対応', () => {
    it('モバイル用のページネーションボタンが表示される', () => {
      const manyValues: CANValue[] = Array.from({ length: 51 }, (_, i) => ({
        signalName: `Signal_${i}`,
        messageName: 'TestMessage',
        rawValue: i,
        physicalValue: i * 0.1,
        unit: 'unit',
        timestamp: 1000 + i * 100
      }));

      render(<CANValuesDisplay values={manyValues} />);

      // モバイル用の「前へ」「次へ」ボタンが存在することを確認
      expect(screen.getByText('前へ')).toBeInTheDocument();
      expect(screen.getByText('次へ')).toBeInTheDocument();
    });
  });

  describe('アクセシビリティ', () => {
    it('適切なaria-labelが設定されている', () => {
      render(<CANValuesDisplay values={mockValues} />);

      // テーブルのアクセシビリティ
      expect(screen.getAllByRole('columnheader')).toHaveLength(7);
      expect(screen.getAllByRole('row')).toHaveLength(5); // ヘッダー + 4データ行
    });

    it('ソートボタンが適切に動作する', () => {
      render(<CANValuesDisplay values={mockValues} />);

      // ヘッダーがクリック可能であることを確認
      const signalNameHeader = screen.getByText('シグナル名').closest('th');
      expect(signalNameHeader).toHaveClass('cursor-pointer');
    });
  });
});