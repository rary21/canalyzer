'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { CANFrame } from '@/types/can';
import {
  WebSocketConfig,
  WebSocketHookReturn,
  WebSocketMessage,
  WebSocketResponse,
  WebSocketStatus,
} from '@/types/websocket';
import {
  WebSocketConnectionError,
  WebSocketTimeoutError,
  isRetryableError,
  ErrorMessages,
} from '@/utils/errors';

const DEFAULT_CONFIG: WebSocketConfig = {
  url: `ws://${typeof window !== 'undefined' ? window.location.host : 'localhost:3000'}/ws`,
  reconnectInterval: 3000,
  maxReconnectAttempts: 5,
  heartbeatInterval: 30000,
  connectionTimeout: 10000,
};

const BATCH_UPDATE_INTERVAL = 50; // 50msごとにバッチ更新
const FRAME_BUFFER_SIZE = 100; // バッファサイズ

export function useWebSocket(
  config: Partial<WebSocketConfig> = {}
): WebSocketHookReturn {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  // 状態管理
  const [status, setStatus] = useState<WebSocketStatus>('disconnected');
  const [lastFrame, setLastFrame] = useState<CANFrame | null>(null);
  const [frames, setFrames] = useState<CANFrame[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [stats, setStats] = useState({
    framesReceived: 0,
    reconnectAttempts: 0,
    lastHeartbeat: null as number | null,
    bytesReceived: 0,
    lastError: null as string | null,
    lastErrorTime: null as number | null,
  });

  // refs
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);

  // バッファリング用のrefs
  const frameBufferRef = useRef<CANFrame[]>([]);
  const batchUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // メッセージ送信
  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const messageStr = JSON.stringify(message);
      wsRef.current.send(messageStr);
      setStats((prev) => ({
        ...prev,
        bytesReceived: prev.bytesReceived + messageStr.length,
      }));
    }
  }, []);

  // ハートビート開始
  const startHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }

    heartbeatIntervalRef.current = setInterval(() => {
      sendMessage({ type: 'heartbeat' });
    }, finalConfig.heartbeatInterval);
  }, [sendMessage, finalConfig.heartbeatInterval]);

  // ハートビート停止
  const stopHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  }, []);

  // バッチ更新処理
  const processBatchUpdate = useCallback(() => {
    if (frameBufferRef.current.length === 0) return;

    const bufferedFrames = [...frameBufferRef.current];
    frameBufferRef.current = [];

    setFrames((prev) => {
      const newFrames = [...prev, ...bufferedFrames];
      // 最大10000フレームまで保持
      return newFrames.length > 10000 ? newFrames.slice(-10000) : newFrames;
    });

    setStats((prev) => ({
      ...prev,
      framesReceived: prev.framesReceived + bufferedFrames.length,
    }));
  }, []);

  // WebSocketメッセージハンドラー
  const handleMessage = useCallback(
    (event: MessageEvent) => {
      try {
        const response: WebSocketResponse = JSON.parse(event.data);

        setStats((prev) => ({
          ...prev,
          bytesReceived: prev.bytesReceived + event.data.length,
        }));

        switch (response.type) {
          case 'frame':
            if (response.data?.frame) {
              const frame = response.data.frame;
              setLastFrame(frame);

              // バッファに追加
              frameBufferRef.current.push(frame);

              // バッファが一定サイズに達したら即座に更新
              if (frameBufferRef.current.length >= FRAME_BUFFER_SIZE) {
                if (batchUpdateTimeoutRef.current) {
                  clearTimeout(batchUpdateTimeoutRef.current);
                  batchUpdateTimeoutRef.current = null;
                }
                processBatchUpdate();
              } else if (!batchUpdateTimeoutRef.current) {
                // タイマーが設定されていなければ設定
                batchUpdateTimeoutRef.current = setTimeout(() => {
                  batchUpdateTimeoutRef.current = null;
                  processBatchUpdate();
                }, BATCH_UPDATE_INTERVAL);
              }
            }
            break;

          case 'status':
            console.log('WebSocket status update:', response.data);
            break;

          case 'error':
            console.error('WebSocket error:', response.error);
            setError(
              new Error(
                response.error || ErrorMessages.WEBSOCKET_INVALID_MESSAGE
              )
            );
            setStats((prev) => ({
              ...prev,
              lastError:
                response.error || ErrorMessages.WEBSOCKET_INVALID_MESSAGE,
              lastErrorTime: Date.now(),
            }));
            break;

          case 'heartbeat':
            setStats((prev) => ({
              ...prev,
              lastHeartbeat: Date.now(),
            }));
            break;
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
        const errorMessage =
          error instanceof Error
            ? error.message
            : ErrorMessages.WEBSOCKET_INVALID_MESSAGE;
        setError(new Error(errorMessage));
        setStats((prev) => ({
          ...prev,
          lastError: errorMessage,
          lastErrorTime: Date.now(),
        }));
      }
    },
    [processBatchUpdate]
  );

  // 再接続処理
  const handleReconnect = useCallback(() => {
    if (reconnectAttemptsRef.current >= finalConfig.maxReconnectAttempts) {
      console.log('Max reconnection attempts reached');
      setStatus('error');
      const error = new WebSocketConnectionError(
        ErrorMessages.WEBSOCKET_MAX_RECONNECT_EXCEEDED
      );
      setError(error);
      setStats((prev) => ({
        ...prev,
        lastError: error.message,
        lastErrorTime: Date.now(),
      }));
      return;
    }

    reconnectAttemptsRef.current++;
    setStats((prev) => ({
      ...prev,
      reconnectAttempts: reconnectAttemptsRef.current,
    }));

    console.log(
      `Attempting to reconnect (${reconnectAttemptsRef.current}/${finalConfig.maxReconnectAttempts})...`
    );

    reconnectTimeoutRef.current = setTimeout(() => {
      // 再接続のために内部でconnectを呼ぶ
      if (wsRef.current?.readyState !== WebSocket.OPEN) {
        setStatus('connecting');

        try {
          const ws = new WebSocket(finalConfig.url);
          wsRef.current = ws;

          ws.onopen = () => {
            console.log('WebSocket reconnected');
            setStatus('connected');
            setError(null);
            reconnectAttemptsRef.current = 0;

            // 接続タイムアウトをクリア
            if (connectionTimeoutRef.current) {
              clearTimeout(connectionTimeoutRef.current);
              connectionTimeoutRef.current = null;
            }

            startHeartbeat();
          };

          ws.onmessage = handleMessage;

          ws.onclose = (event) => {
            console.log('WebSocket closed:', event.code, event.reason);
            setStatus('disconnected');
            stopHeartbeat();

            // 正常な切断でない場合は再接続を試行
            if (event.code !== 1000 && event.code !== 1001) {
              const error = new WebSocketConnectionError(
                event.reason || ErrorMessages.WEBSOCKET_CONNECTION_LOST
              );
              setError(error);
              setStats((prev) => ({
                ...prev,
                lastError: error.message,
                lastErrorTime: Date.now(),
              }));

              if (isRetryableError(error)) {
                handleReconnect();
              }
            }
          };

          ws.onerror = (event) => {
            console.error('WebSocket error:', event);
            const error = new WebSocketConnectionError(
              ErrorMessages.WEBSOCKET_CONNECTION_FAILED
            );
            setError(error);
            setStatus('error');
            stopHeartbeat();
            setStats((prev) => ({
              ...prev,
              lastError: error.message,
              lastErrorTime: Date.now(),
            }));
          };
        } catch (error) {
          console.error('Failed to create WebSocket connection:', error);
          const wsError =
            error instanceof Error ? error : new WebSocketConnectionError();
          setError(wsError);
          setStatus('error');
          setStats((prev) => ({
            ...prev,
            lastError: wsError.message,
            lastErrorTime: Date.now(),
          }));
        }
      }
    }, finalConfig.reconnectInterval);
  }, [
    finalConfig.maxReconnectAttempts,
    finalConfig.reconnectInterval,
    finalConfig.url,
    handleMessage,
    startHeartbeat,
    stopHeartbeat,
  ]);

  // WebSocket接続
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setStatus('connecting');
    setError(null);

    // 接続タイムアウトの設定
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
    }

    connectionTimeoutRef.current = setTimeout(() => {
      if (wsRef.current?.readyState !== WebSocket.OPEN) {
        const error = new WebSocketTimeoutError();
        setError(error);
        setStatus('error');
        setStats((prev) => ({
          ...prev,
          lastError: error.message,
          lastErrorTime: Date.now(),
        }));
        if (wsRef.current) {
          wsRef.current.close();
        }
        handleReconnect();
      }
    }, finalConfig.connectionTimeout || 10000);

    try {
      const ws = new WebSocket(finalConfig.url);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected');
        setStatus('connected');
        setError(null);
        reconnectAttemptsRef.current = 0;

        // 接続タイムアウトをクリア
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current);
          connectionTimeoutRef.current = null;
        }

        startHeartbeat();
      };

      ws.onmessage = handleMessage;

      ws.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason);
        setStatus('disconnected');
        stopHeartbeat();

        // 接続タイムアウトをクリア
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current);
          connectionTimeoutRef.current = null;
        }

        // 正常な切断でない場合は再接続を試行
        if (event.code !== 1000 && event.code !== 1001) {
          const error = new WebSocketConnectionError(
            event.reason || ErrorMessages.WEBSOCKET_CONNECTION_LOST
          );
          setError(error);
          setStats((prev) => ({
            ...prev,
            lastError: error.message,
            lastErrorTime: Date.now(),
          }));

          if (isRetryableError(error)) {
            handleReconnect();
          }
        }
      };

      ws.onerror = (event) => {
        console.error('WebSocket error:', event);
        const error = new WebSocketConnectionError(
          ErrorMessages.WEBSOCKET_CONNECTION_FAILED
        );
        setError(error);
        setStatus('error');
        stopHeartbeat();
        setStats((prev) => ({
          ...prev,
          lastError: error.message,
          lastErrorTime: Date.now(),
        }));

        // 接続タイムアウトをクリア
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current);
          connectionTimeoutRef.current = null;
        }
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      const wsError =
        error instanceof Error ? error : new WebSocketConnectionError();
      setError(wsError);
      setStatus('error');
      setStats((prev) => ({
        ...prev,
        lastError: wsError.message,
        lastErrorTime: Date.now(),
      }));

      // 接続タイムアウトをクリア
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
        connectionTimeoutRef.current = null;
      }
    }
  }, [
    finalConfig.url,
    finalConfig.connectionTimeout,
    handleMessage,
    startHeartbeat,
    stopHeartbeat,
    handleReconnect,
  ]);

  // WebSocket切断
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
      connectionTimeoutRef.current = null;
    }

    if (batchUpdateTimeoutRef.current) {
      clearTimeout(batchUpdateTimeoutRef.current);
      batchUpdateTimeoutRef.current = null;
      processBatchUpdate(); // 残っているフレームを処理
    }

    stopHeartbeat();

    if (wsRef.current) {
      wsRef.current.close(1000, 'User disconnected');
      wsRef.current = null;
    }

    setStatus('disconnected');
    setError(null);
    reconnectAttemptsRef.current = 0;
    frameBufferRef.current = [];
  }, [stopHeartbeat, processBatchUpdate]);

  // ストリーミング開始
  const startStreaming = useCallback(() => {
    sendMessage({ type: 'start' });
  }, [sendMessage]);

  // ストリーミング停止
  const stopStreaming = useCallback(() => {
    sendMessage({ type: 'stop' });
  }, [sendMessage]);

  // メッセージID購読
  const subscribe = useCallback(
    (messageIds: number[]) => {
      sendMessage({ type: 'subscribe', messageIds });
    },
    [sendMessage]
  );

  // メッセージID購読解除
  const unsubscribe = useCallback(
    (messageIds: number[]) => {
      sendMessage({ type: 'unsubscribe', messageIds });
    },
    [sendMessage]
  );

  // クリーンアップ
  useEffect(() => {
    return () => {
      // バッチ更新タイマーのクリア
      if (batchUpdateTimeoutRef.current) {
        clearTimeout(batchUpdateTimeoutRef.current);
        processBatchUpdate(); // 残っているフレームを処理
      }
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    status,
    isConnected: status === 'connected',
    lastFrame,
    frames,
    error,
    connect,
    disconnect,
    startStreaming,
    stopStreaming,
    subscribe,
    unsubscribe,
    sendFrame: () => {}, // TODO: 実装待ち
    setFilters: () => {}, // TODO: 実装待ち
    getInterfaceInfo: () => {}, // TODO: 実装待ち
    stats,
    filters: {}, // TODO: 実装待ち
    interfaceInfo: null, // TODO: 実装待ち
  };
}
