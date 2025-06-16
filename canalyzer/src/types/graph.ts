// グラフ表示関連の型定義

/**
 * 選択可能なシグナル情報
 */
export interface SelectableSignal {
  /** シグナル名 */
  name: string;
  /** 単位 */
  unit: string;
  /** 説明 */
  description?: string;
  /** 選択状態 */
  selected: boolean;
  /** グラフでの色 */
  color: string;
}

/**
 * グラフデータポイント
 */
export interface GraphDataPoint {
  /** タイムスタンプ */
  timestamp: number;
  /** 相対時間（秒） */
  time?: number;
  /** シグナル名をキーとした値のマップ */
  [signalName: string]: number | undefined;
}

/**
 * グラフ設定
 */
export interface GraphConfig {
  /** 表示時間範囲（ミリ秒） */
  timeRange: number;
  /** 更新間隔（ミリ秒） */
  updateInterval: number;
  /** Y軸の自動スケール */
  autoScale: boolean;
  /** Y軸の最小値（autoScaleがfalseの場合） */
  yAxisMin?: number;
  /** Y軸の最大値（autoScaleがfalseの場合） */
  yAxisMax?: number;
  /** グリッド表示 */
  showGrid: boolean;
  /** 凡例表示 */
  showLegend: boolean;
  /** ツールチップ表示 */
  showTooltip: boolean;
}

/**
 * グラフ表示状態
 */
export interface GraphState {
  /** 選択されたシグナル一覧 */
  selectedSignals: SelectableSignal[];
  /** グラフデータ */
  data: GraphDataPoint[];
  /** グラフ設定 */
  config: GraphConfig;
  /** リアルタイム更新の有効状態 */
  realTimeEnabled: boolean;
  /** ローディング状態 */
  isLoading: boolean;
}

/**
 * グラフ用のデフォルト色パレット
 */
export const GRAPH_COLORS = [
  '#3B82F6', // blue-500
  '#EF4444', // red-500
  '#10B981', // emerald-500
  '#F59E0B', // amber-500
  '#8B5CF6', // violet-500
  '#06B6D4', // cyan-500
  '#F97316', // orange-500
  '#84CC16', // lime-500
  '#EC4899', // pink-500
  '#6B7280', // gray-500
] as const;

/**
 * デフォルトのグラフ設定
 */
export const DEFAULT_GRAPH_CONFIG: GraphConfig = {
  timeRange: 10000, // 10秒
  updateInterval: 100, // 100ms
  autoScale: true,
  showGrid: true,
  showLegend: true,
  showTooltip: true,
};

/**
 * 時間範囲のプリセット
 */
export const TIME_RANGE_PRESETS = [
  { label: '5秒', value: 5000 },
  { label: '10秒', value: 10000 },
  { label: '30秒', value: 30000 },
  { label: '1分', value: 60000 },
  { label: '5分', value: 300000 },
] as const;

/**
 * 更新間隔のプリセット
 */
export const UPDATE_INTERVAL_PRESETS = [
  { label: '50ms', value: 50 },
  { label: '100ms', value: 100 },
  { label: '250ms', value: 250 },
  { label: '500ms', value: 500 },
  { label: '1秒', value: 1000 },
] as const;
