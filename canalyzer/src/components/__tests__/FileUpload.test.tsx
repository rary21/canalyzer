import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import FileUpload from '../FileUpload';

// DBCParserをモック
const mockDBCParser = {
  parse: jest.fn()
};

jest.mock('@/lib/dbc-parser', () => ({
  DBCParser: jest.fn().mockImplementation(() => mockDBCParser)
}));

describe('FileUpload', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('正しくレンダリングされる', () => {
    render(<FileUpload />);
    
    expect(screen.getByText('DBCファイルを選択')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { hidden: true })).toBeInTheDocument();
  });

  it('DBCファイルを選択できる', async () => {
    mockDBCParser.parse.mockReturnValue({
      success: true,
      database: {
        messages: new Map([
          [100, { id: 100, name: 'TestMessage', signals: [] }]
        ]),
        nodes: [{ name: 'ECU1' }]
      },
      errors: [],
      warnings: []
    });

    render(<FileUpload />);
    
    const file = new File(['VERSION ""\\n\\nBU_ ECU1\\n'], 'test.dbc', {
      type: 'text/plain'
    });
    
    const input = screen.getByRole('textbox', { hidden: true }) as HTMLInputElement;
    
    Object.defineProperty(input, 'files', {
      value: [file],
      writable: false,
    });

    fireEvent.change(input);

    await waitFor(() => {
      expect(screen.getByText('test.dbc')).toBeInTheDocument();
    });

    expect(mockDBCParser.parse).toHaveBeenCalledWith('VERSION ""\\n\\nBU_ ECU1\\n');
  });

  it('非DBCファイルを選択した場合アラートが表示される', () => {
    // alertをモック
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
    
    render(<FileUpload />);
    
    const file = new File(['test content'], 'test.txt', {
      type: 'text/plain'
    });
    
    const input = screen.getByRole('textbox', { hidden: true }) as HTMLInputElement;
    
    Object.defineProperty(input, 'files', {
      value: [file],
      writable: false,
    });

    fireEvent.change(input);

    expect(alertSpy).toHaveBeenCalledWith('DBCファイルを選択してください');
    
    alertSpy.mockRestore();
  });

  it('パース成功時に結果が表示される', async () => {
    mockDBCParser.parse.mockReturnValue({
      success: true,
      database: {
        messages: new Map([
          [100, { id: 100, name: 'EngineData', signals: [{ name: 'Speed' }] }],
          [200, { id: 200, name: 'BrakeData', signals: [] }]
        ]),
        nodes: [{ name: 'ECU1' }, { name: 'ECU2' }]
      },
      errors: [],
      warnings: []
    });

    render(<FileUpload />);
    
    const file = new File(['valid dbc content'], 'test.dbc', {
      type: 'text/plain'
    });
    
    const input = screen.getByRole('textbox', { hidden: true }) as HTMLInputElement;
    
    Object.defineProperty(input, 'files', {
      value: [file],
      writable: false,
    });

    fireEvent.change(input);

    await waitFor(() => {
      expect(screen.getByText('成功')).toBeInTheDocument();
      expect(screen.getByText('メッセージ数:')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('ノード数:')).toBeInTheDocument();
      expect(screen.getByText('ID: 100 - EngineData (1 シグナル)')).toBeInTheDocument();
    });
  });

  it('パース失敗時にエラーが表示される', async () => {
    mockDBCParser.parse.mockReturnValue({
      success: false,
      errors: [
        { line: 5, message: 'Syntax error on line 5', type: 'SYNTAX_ERROR' },
        { line: 10, message: 'Invalid value', type: 'INVALID_VALUE' }
      ],
      warnings: []
    });

    render(<FileUpload />);
    
    const file = new File(['invalid dbc content'], 'test.dbc', {
      type: 'text/plain'
    });
    
    const input = screen.getByRole('textbox', { hidden: true }) as HTMLInputElement;
    
    Object.defineProperty(input, 'files', {
      value: [file],
      writable: false,
    });

    fireEvent.change(input);

    await waitFor(() => {
      expect(screen.getByText('エラーあり')).toBeInTheDocument();
      expect(screen.getByText('エラー')).toBeInTheDocument();
      expect(screen.getByText('行 5: Syntax error on line 5')).toBeInTheDocument();
      expect(screen.getByText('行 10: Invalid value')).toBeInTheDocument();
    });
  });

  it('ファイル読み込み中はローディング状態を表示する', async () => {
    mockDBCParser.parse.mockImplementation(() => {
      // パースに時間がかかることをシミュレート
      return new Promise(resolve => {
        setTimeout(() => resolve({
          success: true,
          database: { messages: new Map(), nodes: [] },
          errors: [],
          warnings: []
        }), 100);
      });
    });

    render(<FileUpload />);
    
    const file = new File(['content'], 'test.dbc');
    const input = screen.getByRole('textbox', { hidden: true }) as HTMLInputElement;
    
    Object.defineProperty(input, 'files', {
      value: [file],
      writable: false,
    });

    fireEvent.change(input);

    expect(screen.getByText('読み込み中...')).toBeInTheDocument();
    expect(input).toBeDisabled();
  });

  it('ファイルが選択されていない場合は何も起こらない', () => {

    render(<FileUpload />);
    
    const input = screen.getByRole('textbox', { hidden: true }) as HTMLInputElement;
    
    Object.defineProperty(input, 'files', {
      value: [],
      writable: false,
    });

    fireEvent.change(input);

    expect(mockDBCParser.parse).not.toHaveBeenCalled();
  });
});