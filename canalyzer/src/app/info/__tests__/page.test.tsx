import { render, screen } from '@testing-library/react'
import InfoPage from '../page'
import { useDBCContext } from '@/contexts/DBCContext'
import { DBCDatabase } from '@/types/dbc'

// DBCContextをモック
jest.mock('@/contexts/DBCContext', () => ({
  DBCProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useDBCContext: jest.fn(),
}))

// DBCInfoDisplayコンポーネントをモック
jest.mock('@/components/DBCInfoDisplay', () => {
  return function MockDBCInfoDisplay({ data }: { data: DBCDatabase }) {
    return <div data-testid="dbc-info-display">DBC Info Display with {data.messages.size} messages</div>
  }
})

const mockDBCData: DBCDatabase = {
  version: '1.0',
  nodes: [
    { name: 'ECU1' },
    { name: 'ECU2' }
  ],
  messages: new Map([
    [100, {
      id: 100,
      name: 'TestMessage',
      length: 8,
      sendingNode: 'ECU1',
      signals: []
    }]
  ])
}

const mockUseDBCContext = useDBCContext as jest.MockedFunction<typeof useDBCContext>

describe('InfoPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('DBCデータがない場合、適切なメッセージを表示する', () => {
    mockUseDBCContext.mockReturnValue({
      dbcData: null,
      parseResult: null,
      fileName: null,
      setDBCData: jest.fn(),
      setParseResult: jest.fn(),
      setFileName: jest.fn(),
    })

    render(<InfoPage />)

    expect(screen.getByText('DBC情報')).toBeInTheDocument()
    expect(screen.getByText('DBCファイルが読み込まれていません')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '← ホームに戻る' })).toBeInTheDocument()
  })

  it('DBCデータがある場合、情報表示コンポーネントをレンダリングする', () => {
    mockUseDBCContext.mockReturnValue({
      dbcData: mockDBCData,
      parseResult: null,
      fileName: 'test.dbc',
      setDBCData: jest.fn(),
      setParseResult: jest.fn(),
      setFileName: jest.fn(),
    })

    render(<InfoPage />)

    expect(screen.getByText('DBC情報')).toBeInTheDocument()
    expect(screen.getByText('ファイル: test.dbc')).toBeInTheDocument()
    expect(screen.getByTestId('dbc-info-display')).toBeInTheDocument()
  })

  it('ホームへのリンクが正しく設定されている', () => {
    mockUseDBCContext.mockReturnValue({
      dbcData: null,
      parseResult: null,
      fileName: null,
      setDBCData: jest.fn(),
      setParseResult: jest.fn(),
      setFileName: jest.fn(),
    })

    render(<InfoPage />)

    const homeLink = screen.getByRole('link', { name: '← ホームに戻る' })
    expect(homeLink).toHaveAttribute('href', '/')
  })

  it('ファイル名が設定されていない場合は表示しない', () => {
    mockUseDBCContext.mockReturnValue({
      dbcData: mockDBCData,
      parseResult: null,
      fileName: null,
      setDBCData: jest.fn(),
      setParseResult: jest.fn(),
      setFileName: jest.fn(),
    })

    render(<InfoPage />)

    expect(screen.queryByText(/ファイル:/)).not.toBeInTheDocument()
  })
})