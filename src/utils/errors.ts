/**
 * アプリケーション固有のエラークラス
 */

/**
 * 基底エラークラス
 */
export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    code: string = 'UNKNOWN_ERROR',
    statusCode: number = 500,
    isOperational: boolean = true
  ) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * WebSocketエラー
 */
export class WebSocketError extends AppError {
  constructor(message: string, code: string = 'WEBSOCKET_ERROR') {
    super(message, code, 500);
    Object.setPrototypeOf(this, WebSocketError.prototype);
  }
}

/**
 * WebSocket接続エラー
 */
export class WebSocketConnectionError extends WebSocketError {
  constructor(message: string = 'WebSocket接続に失敗しました') {
    super(message, 'WEBSOCKET_CONNECTION_ERROR');
    Object.setPrototypeOf(this, WebSocketConnectionError.prototype);
  }
}

/**
 * WebSocketタイムアウトエラー
 */
export class WebSocketTimeoutError extends WebSocketError {
  constructor(message: string = 'WebSocket接続がタイムアウトしました') {
    super(message, 'WEBSOCKET_TIMEOUT_ERROR');
    Object.setPrototypeOf(this, WebSocketTimeoutError.prototype);
  }
}

/**
 * ファイルパースエラー
 */
export class FileParseError extends AppError {
  public readonly fileName?: string;
  public readonly line?: number;

  constructor(
    message: string,
    fileName?: string,
    line?: number,
    code: string = 'FILE_PARSE_ERROR'
  ) {
    super(message, code, 400);
    this.fileName = fileName;
    this.line = line;
    Object.setPrototypeOf(this, FileParseError.prototype);
  }
}

/**
 * DBCファイルパースエラー
 */
export class DBCParseError extends FileParseError {
  constructor(message: string, fileName?: string, line?: number) {
    super(message, fileName, line, 'DBC_PARSE_ERROR');
    Object.setPrototypeOf(this, DBCParseError.prototype);
  }
}

/**
 * ファイル形式エラー
 */
export class InvalidFileFormatError extends FileParseError {
  constructor(
    expectedFormat: string,
    actualFormat?: string,
    fileName?: string
  ) {
    const message = actualFormat
      ? `無効なファイル形式です。期待: ${expectedFormat}、実際: ${actualFormat}`
      : `無効なファイル形式です。${expectedFormat}ファイルを選択してください`;
    super(message, fileName, undefined, 'INVALID_FILE_FORMAT');
    Object.setPrototypeOf(this, InvalidFileFormatError.prototype);
  }
}

/**
 * バリデーションエラー
 */
export class ValidationError extends AppError {
  public readonly field?: string;
  public readonly value?: unknown;

  constructor(message: string, field?: string, value?: unknown) {
    super(message, 'VALIDATION_ERROR', 400);
    this.field = field;
    this.value = value;
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * ネットワークエラー
 */
export class NetworkError extends AppError {
  constructor(message: string = 'ネットワークエラーが発生しました') {
    super(message, 'NETWORK_ERROR', 503);
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}

/**
 * エラーメッセージの国際化対応
 */
export const ErrorMessages = {
  // WebSocketエラー
  WEBSOCKET_CONNECTION_FAILED: 'WebSocket接続に失敗しました',
  WEBSOCKET_CONNECTION_LOST: 'WebSocket接続が切断されました',
  WEBSOCKET_TIMEOUT: 'WebSocket接続がタイムアウトしました',
  WEBSOCKET_MAX_RECONNECT_EXCEEDED: '最大再接続試行回数を超えました',
  WEBSOCKET_INVALID_MESSAGE: '無効なWebSocketメッセージを受信しました',

  // ファイルエラー
  FILE_NOT_FOUND: 'ファイルが見つかりません',
  FILE_READ_ERROR: 'ファイルの読み込みに失敗しました',
  FILE_TOO_LARGE: 'ファイルサイズが大きすぎます',
  FILE_EMPTY: 'ファイルが空です',

  // DBCパースエラー
  DBC_INVALID_SYNTAX: 'DBC構文エラー',
  DBC_MISSING_VERSION: 'DBCバージョンが指定されていません',
  DBC_INVALID_MESSAGE: '無効なメッセージ定義です',
  DBC_INVALID_SIGNAL: '無効なシグナル定義です',
  DBC_DUPLICATE_MESSAGE_ID: 'メッセージIDが重複しています',

  // バリデーションエラー
  REQUIRED_FIELD_MISSING: '必須フィールドが入力されていません',
  INVALID_FORMAT: '入力形式が正しくありません',
  OUT_OF_RANGE: '値が有効範囲外です',

  // 一般エラー
  UNKNOWN_ERROR: '予期しないエラーが発生しました',
  OPERATION_FAILED: '操作に失敗しました',
  PERMISSION_DENIED: 'アクセス権限がありません',
} as const;

/**
 * エラーをユーザーフレンドリーなメッセージに変換
 */
export function getUserFriendlyMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.message;
  }

  if (error instanceof Error) {
    // 既知のエラーパターンをチェック
    if (error.message.includes('Failed to fetch')) {
      return 'ネットワーク接続を確認してください';
    }
    if (error.message.includes('Network')) {
      return 'ネットワークエラーが発生しました';
    }
    if (error.message.includes('timeout')) {
      return '操作がタイムアウトしました';
    }

    // デフォルトのエラーメッセージ
    return error.message;
  }

  return ErrorMessages.UNKNOWN_ERROR;
}

/**
 * エラーが再試行可能かどうかを判定
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof WebSocketConnectionError) {
    return true;
  }

  if (error instanceof WebSocketTimeoutError) {
    return true;
  }

  if (error instanceof NetworkError) {
    return true;
  }

  if (error instanceof Error) {
    const retryableMessages = [
      'ECONNREFUSED',
      'ETIMEDOUT',
      'ENOTFOUND',
      'ENETUNREACH',
      'EAI_AGAIN',
    ];

    return retryableMessages.some((msg) => error.message.includes(msg));
  }

  return false;
}

/**
 * エラーログ用のフォーマット
 */
export function formatErrorForLogging(error: unknown): {
  message: string;
  code?: string;
  stack?: string;
  details?: Record<string, unknown>;
} {
  if (error instanceof AppError) {
    return {
      message: error.message,
      code: error.code,
      stack: error.stack,
      details: {
        statusCode: error.statusCode,
        isOperational: error.isOperational,
      },
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      stack: error.stack,
    };
  }

  return {
    message: String(error),
  };
}
