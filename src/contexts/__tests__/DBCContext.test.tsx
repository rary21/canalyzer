import { render, screen, act } from '@testing-library/react';
import { DBCProvider, useDBCContext } from '../DBCContext';
import { DBCDatabase } from '@/types/dbc';

// テスト用コンポーネント
function TestComponent() {
  const {
    dbcData,
    parseResult,
    fileName,
    setDBCData,
    setParseResult,
    setFileName,
  } = useDBCContext();

  return (
    <div>
      <div data-testid="dbc-data">{dbcData ? 'has-data' : 'no-data'}</div>
      <div data-testid="parse-result">
        {parseResult ? 'has-result' : 'no-result'}
      </div>
      <div data-testid="file-name">{fileName || 'no-file'}</div>
      <button onClick={() => setFileName('test.dbc')}>Set File Name</button>
      <button
        onClick={() =>
          setDBCData({
            version: '1.0',
            nodes: [],
            messages: new Map(),
          } as DBCDatabase)
        }
      >
        Set DBC Data
      </button>
      <button
        onClick={() =>
          setParseResult({
            success: true,
            errors: [],
            warnings: [],
          })
        }
      >
        Set Parse Result
      </button>
    </div>
  );
}

describe('DBCContext', () => {
  it('初期状態でnull値を提供する', () => {
    render(
      <DBCProvider>
        <TestComponent />
      </DBCProvider>
    );

    expect(screen.getByTestId('dbc-data')).toHaveTextContent('no-data');
    expect(screen.getByTestId('parse-result')).toHaveTextContent('no-result');
    expect(screen.getByTestId('file-name')).toHaveTextContent('no-file');
  });

  it('ファイル名を設定できる', () => {
    render(
      <DBCProvider>
        <TestComponent />
      </DBCProvider>
    );

    act(() => {
      screen.getByText('Set File Name').click();
    });

    expect(screen.getByTestId('file-name')).toHaveTextContent('test.dbc');
  });

  it('DBCデータを設定できる', () => {
    render(
      <DBCProvider>
        <TestComponent />
      </DBCProvider>
    );

    act(() => {
      screen.getByText('Set DBC Data').click();
    });

    expect(screen.getByTestId('dbc-data')).toHaveTextContent('has-data');
  });

  it('パース結果を設定できる', () => {
    render(
      <DBCProvider>
        <TestComponent />
      </DBCProvider>
    );

    act(() => {
      screen.getByText('Set Parse Result').click();
    });

    expect(screen.getByTestId('parse-result')).toHaveTextContent('has-result');
  });

  it('Providerの外でuseDBCContextを使用するとエラーを投げる', () => {
    // エラーログを抑制
    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useDBCContext must be used within a DBCProvider');

    consoleSpy.mockRestore();
  });
});
