import React from 'react';
import { render, screen } from '@testing-library/react';
import ValuesPage from '../page';
import { DBCDatabase } from '@/types/dbc';

// Next.jsのLinkコンポーネントをモック
jest.mock('next/link', () => {
  return function MockLink({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  };
});

// DBCContextをモック
jest.mock('@/contexts/DBCContext', () => ({
  useDBCContext: jest.fn(),
}));

// RealtimeDataContextをモック
jest.mock('@/contexts/RealtimeDataContext', () => ({
  useRealtimeData: jest.fn(),
}));

// TabNavigationをモック（簡単化）
jest.mock('@/components/TabNavigation', () => {
  return function MockTabNavigation() {
    return <div data-testid="tab-navigation">TabNavigation</div>;
  };
});

// CANValuesDisplayをモック
jest.mock('@/components/CANValuesDisplay', () => {
  return function MockCANValuesDisplay({
    values,
    isLoading,
  }: {
    values: unknown[];
    isLoading: boolean;
  }) {
    if (isLoading) {
      return <div data-testid="loading">Loading...</div>;
    }
    return <div data-testid="can-values-display">{values.length} values</div>;
  };
});

import { useDBCContext } from '@/contexts/DBCContext';
import { useRealtimeData } from '@/contexts/RealtimeDataContext';

const mockUseDBCContext = useDBCContext as jest.MockedFunction<
  typeof useDBCContext
>;

const mockUseRealtimeData = useRealtimeData as jest.MockedFunction<
  typeof useRealtimeData
>;

// テスト用のモックDBCデータ
const mockDBCData: DBCDatabase = {
  version: '1.0.0',
  nodes: [{ name: 'TestECU', comment: 'テスト用ECU' }],
  messages: new Map([
    [
      0x100,
      {
        id: 0x100,
        name: 'TestMessage',
        length: 8,
        sendingNode: 'TestECU',
        signals: [],
        comment: 'テストメッセージ',
      },
    ],
  ]),
};

const renderWithDBCContext = (dbcData: DBCDatabase | null = null) => {
  mockUseDBCContext.mockReturnValue({
    dbcData,
    setDBCData: jest.fn(),
    parseResult: null,
    setParseResult: jest.fn(),
    fileName: null,
    setFileName: jest.fn(),
  });

  mockUseRealtimeData.mockReturnValue({
    isConnected: false,
    isStreaming: false,
    status: 'disconnected' as const,
    currentData: new Map(),
    historicalData: new Map(),
    startRealtime: jest.fn(),
    stopRealtime: jest.fn(),
    subscribe: jest.fn(),
    unsubscribe: jest.fn(),
    sendFrame: jest.fn(),
    setFilters: jest.fn(),
    stats: {
      totalFrames: 0,
      framesPerSecond: 0,
      uniqueMessages: 0,
      connectionUptime: 0,
      lastUpdate: 0,
      dataPoints: {},
    },
    filters: {},
    interfaceInfo: null,
  });

  return render(<ValuesPage />);
};

describe('ValuesPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('基本レンダリング', () => {
    it('DBCデータがない場合でもページが表示される', () => {
      renderWithDBCContext(null);

      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
        'CAN値表示'
      );
      expect(screen.getByTestId('can-values-display')).toBeInTheDocument();
    });

    it('DBCデータがある場合にCAN値表示が行われる', () => {
      renderWithDBCContext(mockDBCData);

      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
        'CAN値表示'
      );
      expect(screen.getByTestId('can-values-display')).toBeInTheDocument();
    });
  });

  describe('ナビゲーション', () => {
    it('TabNavigationコンポーネントが表示される', () => {
      renderWithDBCContext(null);

      expect(screen.getByTestId('tab-navigation')).toBeInTheDocument();
    });

    it('ホームに戻るリンクが表示される（DBCデータあり）', () => {
      renderWithDBCContext(mockDBCData);

      const homeLink = screen.getByText('← ホームに戻る');
      expect(homeLink.closest('a')).toHaveAttribute('href', '/');
    });
  });

  describe('コンポーネント統合', () => {
    it('CANValuesDisplayコンポーネントが表示される', () => {
      renderWithDBCContext(mockDBCData);

      expect(screen.getByTestId('can-values-display')).toBeInTheDocument();
    });
  });

  describe('アクセシビリティ', () => {
    it('メインコンテンツが適切にマークアップされている', () => {
      renderWithDBCContext(mockDBCData);

      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('見出しが適切に設定されている', () => {
      renderWithDBCContext(mockDBCData);

      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
        'CAN値表示'
      );
    });
  });
});
