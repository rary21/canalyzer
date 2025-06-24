import React from 'react';
import { render, screen } from '@testing-library/react';
import { usePathname } from 'next/navigation';
import TabNavigation from '../TabNavigation';
import { DBCDatabase } from '@/types/dbc';

// Next.jsのナビゲーションフックをモック
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));

// DBCContextをモック
jest.mock('@/contexts/DBCContext', () => ({
  useDBCContext: jest.fn(),
}));

const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;
import { useDBCContext } from '@/contexts/DBCContext';
const mockUseDBCContext = useDBCContext as jest.MockedFunction<
  typeof useDBCContext
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

// DBCContextのプロバイダーをモック可能にするヘルパー
const renderWithDBCContext = (dbcData: DBCDatabase | null = null) => {
  mockUseDBCContext.mockReturnValue({
    dbcData,
    setDBCData: jest.fn(),
    parseResult: null,
    setParseResult: jest.fn(),
    fileName: null,
    setFileName: jest.fn(),
  });

  return render(<TabNavigation />);
};

describe('TabNavigation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('基本レンダリング', () => {
    it('タブが正しく表示される', () => {
      mockUsePathname.mockReturnValue('/info');
      renderWithDBCContext();

      expect(screen.getByText('DBC情報')).toBeInTheDocument();
      expect(screen.getByText('CAN値表示')).toBeInTheDocument();
      expect(screen.getByText('グラフ表示')).toBeInTheDocument();
    });

    it('各タブにアイコンが表示される', () => {
      mockUsePathname.mockReturnValue('/info');
      renderWithDBCContext();

      // SVGアイコンが存在することを確認
      const infoTab = screen.getByText('DBC情報').closest('a');
      const valuesTab = screen.getByText('CAN値表示').closest('a');
      const graphTab = screen.getByText('グラフ表示').closest('a');

      expect(infoTab?.querySelector('svg')).toBeInTheDocument();
      expect(valuesTab?.querySelector('svg')).toBeInTheDocument();
      expect(graphTab?.querySelector('svg')).toBeInTheDocument();
    });

    it('適切なリンクが設定されている', () => {
      mockUsePathname.mockReturnValue('/info');
      renderWithDBCContext();

      const infoLink = screen.getByText('DBC情報').closest('a');
      const valuesLink = screen.getByText('CAN値表示').closest('a');
      const graphLink = screen.getByText('グラフ表示').closest('a');

      expect(infoLink).toHaveAttribute('href', '/info');
      expect(valuesLink).toHaveAttribute('href', '/values');
      expect(graphLink).toHaveAttribute('href', '/graph');
    });
  });

  describe('アクティブ状態の管理', () => {
    it('/infoページでDBC情報タブがアクティブになる', () => {
      mockUsePathname.mockReturnValue('/info');
      renderWithDBCContext(mockDBCData);

      const infoTab = screen.getByText('DBC情報').closest('a');
      const valuesTab = screen.getByText('CAN値表示').closest('a');

      expect(infoTab).toHaveClass('tab-active');
      expect(infoTab).toHaveClass('border-blue-500');
      expect(infoTab).toHaveClass('text-blue-600');

      expect(valuesTab).not.toHaveClass('tab-active');
      expect(valuesTab).toHaveClass('border-transparent');
      expect(valuesTab).toHaveClass('text-gray-500');
    });

    it('/valuesページでCAN値表示タブがアクティブになる', () => {
      mockUsePathname.mockReturnValue('/values');
      renderWithDBCContext(mockDBCData);

      const infoTab = screen.getByText('DBC情報').closest('a');
      const valuesTab = screen.getByText('CAN値表示').closest('a');

      expect(valuesTab).toHaveClass('tab-active');
      expect(valuesTab).toHaveClass('border-blue-500');
      expect(valuesTab).toHaveClass('text-blue-600');

      expect(infoTab).not.toHaveClass('tab-active');
      expect(infoTab).toHaveClass('border-transparent');
      expect(infoTab).toHaveClass('text-gray-500');
    });

    it('未知のパスでどのタブもアクティブにならない', () => {
      mockUsePathname.mockReturnValue('/unknown');
      renderWithDBCContext(mockDBCData);

      const infoTab = screen.getByText('DBC情報').closest('a');
      const valuesTab = screen.getByText('CAN値表示').closest('a');

      expect(infoTab).not.toHaveClass('tab-active');
      expect(valuesTab).not.toHaveClass('tab-active');
    });

    it('ルートパス（/）でどのタブもアクティブにならない', () => {
      mockUsePathname.mockReturnValue('/');
      renderWithDBCContext(mockDBCData);

      const infoTab = screen.getByText('DBC情報').closest('a');
      const valuesTab = screen.getByText('CAN値表示').closest('a');

      expect(infoTab).not.toHaveClass('tab-active');
      expect(valuesTab).not.toHaveClass('tab-active');
    });
  });

  describe('DBCデータの有無による表示', () => {
    it('DBCデータがある場合も通常表示される', () => {
      mockUsePathname.mockReturnValue('/info');
      renderWithDBCContext(mockDBCData);

      const infoTab = screen.getByText('DBC情報').closest('a');
      const valuesTab = screen.getByText('CAN値表示').closest('a');

      // タブは常に通常表示される
      expect(infoTab).toBeInTheDocument();
      expect(valuesTab).toBeInTheDocument();
    });

    it('DBCデータがない場合でも通常表示される', () => {
      mockUsePathname.mockReturnValue('/info');
      renderWithDBCContext(null); // DBCデータなし

      const infoTab = screen.getByText('DBC情報').closest('a');
      const valuesTab = screen.getByText('CAN値表示').closest('a');

      // タブは常に通常表示される
      expect(infoTab).toBeInTheDocument();
      expect(valuesTab).toBeInTheDocument();
    });

    it('DBCデータの有無に関係なくタブが機能する', () => {
      mockUsePathname.mockReturnValue('/values');
      renderWithDBCContext(null);

      const valuesTab = screen.getByText('CAN値表示').closest('a');

      expect(valuesTab).toHaveAttribute('href', '/values');
      expect(valuesTab).toHaveClass('tab-active');
    });
  });

  describe('アクセシビリティ', () => {
    it('適切なrole属性が設定されている', () => {
      mockUsePathname.mockReturnValue('/info');
      renderWithDBCContext();

      const nav = screen.getByRole('navigation');
      expect(nav).toHaveAttribute('aria-label', 'タブナビゲーション');

      const tablist = screen.getByRole('tablist');
      expect(tablist).toBeInTheDocument();

      const tabs = screen.getAllByRole('tab');
      expect(tabs).toHaveLength(3);
    });

    it('aria-selected属性が正しく設定される', () => {
      mockUsePathname.mockReturnValue('/info');
      renderWithDBCContext();

      const infoTab = screen.getByRole('tab', { name: /DBC情報/ });
      const valuesTab = screen.getByRole('tab', { name: /CAN値表示/ });

      expect(infoTab).toHaveAttribute('aria-selected', 'true');
      expect(valuesTab).toHaveAttribute('aria-selected', 'false');
    });

    it('aria-selected属性がパスに応じて変更される', () => {
      // 最初は/info
      mockUsePathname.mockReturnValue('/info');
      const { rerender } = renderWithDBCContext();

      let infoTab = screen.getByRole('tab', { name: /DBC情報/ });
      let valuesTab = screen.getByRole('tab', { name: /CAN値表示/ });

      expect(infoTab).toHaveAttribute('aria-selected', 'true');
      expect(valuesTab).toHaveAttribute('aria-selected', 'false');

      // /valuesに変更
      mockUsePathname.mockReturnValue('/values');
      rerender(<TabNavigation />);

      infoTab = screen.getByRole('tab', { name: /DBC情報/ });
      valuesTab = screen.getByRole('tab', { name: /CAN値表示/ });

      expect(infoTab).toHaveAttribute('aria-selected', 'false');
      expect(valuesTab).toHaveAttribute('aria-selected', 'true');
    });
  });

  describe('ホバー効果', () => {
    it('非アクティブタブにホバー用のクラスが設定されている', () => {
      mockUsePathname.mockReturnValue('/info');
      renderWithDBCContext();

      const valuesTab = screen.getByText('CAN値表示').closest('a');

      expect(valuesTab).toHaveClass('hover:text-gray-700');
      expect(valuesTab).toHaveClass('hover:border-gray-300');
    });

    it('アクティブタブはホバー効果がない', () => {
      mockUsePathname.mockReturnValue('/info');
      renderWithDBCContext();

      const infoTab = screen.getByText('DBC情報').closest('a');

      // アクティブタブは固定の青色スタイルを持つ
      expect(infoTab).toHaveClass('text-blue-600');
      expect(infoTab).toHaveClass('border-blue-500');
    });
  });

  describe('レスポンシブ設計', () => {
    it('コンテナに適切なクラスが設定されている', () => {
      mockUsePathname.mockReturnValue('/info');
      renderWithDBCContext();

      const nav = screen.getByRole('navigation');
      expect(nav).toHaveClass('container');
      expect(nav).toHaveClass('mx-auto');
      expect(nav).toHaveClass('px-4');
    });

    it('タブ間に適切なスペースが設定されている', () => {
      mockUsePathname.mockReturnValue('/info');
      renderWithDBCContext();

      const tabContainer = screen.getByRole('tablist');
      expect(tabContainer).toHaveClass('space-x-8');
    });
  });

  describe('視覚的な境界線', () => {
    it('ナビゲーション全体に境界線が設定されている', () => {
      mockUsePathname.mockReturnValue('/info');
      renderWithDBCContext();

      const navContainer = screen.getByRole('navigation').parentElement;
      expect(navContainer).toHaveClass('border-b');
      expect(navContainer).toHaveClass('border-gray-200');
      expect(navContainer).toHaveClass('bg-white');
    });

    it('アクティブタブに下線が表示される', () => {
      mockUsePathname.mockReturnValue('/info');
      renderWithDBCContext();

      const infoTab = screen.getByText('DBC情報').closest('a');
      expect(infoTab).toHaveClass('border-b-2');
      expect(infoTab).toHaveClass('border-blue-500');
    });

    it('非アクティブタブは透明な境界線', () => {
      mockUsePathname.mockReturnValue('/info');
      renderWithDBCContext();

      const valuesTab = screen.getByText('CAN値表示').closest('a');
      expect(valuesTab).toHaveClass('border-b-2');
      expect(valuesTab).toHaveClass('border-transparent');
    });
  });

  describe('アニメーション', () => {
    it('トランジション効果が設定されている', () => {
      mockUsePathname.mockReturnValue('/info');
      renderWithDBCContext();

      const infoTab = screen.getByText('DBC情報').closest('a');
      const valuesTab = screen.getByText('CAN値表示').closest('a');

      expect(infoTab).toHaveClass('transition-colors');
      expect(infoTab).toHaveClass('duration-200');
      expect(valuesTab).toHaveClass('transition-colors');
      expect(valuesTab).toHaveClass('duration-200');
    });
  });
});
