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

const DEFAULT_CONFIG: WebSocketConfig = {
  url: `ws://${typeof window !== 'undefined' ? window.location.host : 'localhost:3000'}/ws`,
  reconnectInterval: 3000,
  maxReconnectAttempts: 5,
  heartbeatInterval: 30000,
};

export function useWebSocket(
  config: Partial<WebSocketConfig> = {}
): WebSocketHookReturn {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  // 状態管理
  const [status, setStatus] = useState<WebSocketStatus>('disconnected');
  const [lastFrame, setLastFrame] = useState<CANFrame | null>(null);
  const [frames, setFrames] = useState<CANFrame[]>([]);
  const [stats, setStats] = useState({
    framesReceived: 0,
    reconnectAttempts: 0,
    lastHeartbeat: null as number | null,
    bytesReceived: 0,
  });

  // refs
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);

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

  // WebSocketメッセージハンドラー
  const handleMessage = useCallback((event: MessageEvent) => {
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
            setFrames((prev) => {
              const newFrames = [...prev, frame];
              // 最大10000フレームまで保持
              return newFrames.length > 10000
                ? newFrames.slice(-10000)
                : newFrames;
            });
            setStats((prev) => ({
              ...prev,
              framesReceived: prev.framesReceived + 1,
            }));
          }
          break;

        case 'status':
          console.log('WebSocket status update:', response.data);
          break;

        case 'error':
          console.error('WebSocket error:', response.error);
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
    }
  }, []);

  // 再接続処理
  const handleReconnect = useCallback(() => {
    if (reconnectAttemptsRef.current >= finalConfig.maxReconnectAttempts) {
      console.log('Max reconnection attempts reached');
      setStatus('error');
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
            reconnectAttemptsRef.current = 0;
            startHeartbeat();
          };

          ws.onmessage = handleMessage;

          ws.onclose = (event) => {
            console.log('WebSocket closed:', event.code, event.reason);
            setStatus('disconnected');
            stopHeartbeat();

            // 正常な切断でない場合は再接続を試行
            if (event.code !== 1000 && event.code !== 1001) {
              handleReconnect();
            }
          };

          ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            setStatus('error');
            stopHeartbeat();
          };
        } catch (error) {
          console.error('Failed to create WebSocket connection:', error);
          setStatus('error');
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

    try {
      const ws = new WebSocket(finalConfig.url);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected');
        setStatus('connected');
        reconnectAttemptsRef.current = 0;
        startHeartbeat();
      };

      ws.onmessage = handleMessage;

      ws.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason);
        setStatus('disconnected');
        stopHeartbeat();

        // 正常な切断でない場合は再接続を試行
        if (event.code !== 1000 && event.code !== 1001) {
          handleReconnect();
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setStatus('error');
        stopHeartbeat();
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setStatus('error');
    }
  }, [
    finalConfig.url,
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

    stopHeartbeat();

    if (wsRef.current) {
      wsRef.current.close(1000, 'User disconnected');
      wsRef.current = null;
    }

    setStatus('disconnected');
    reconnectAttemptsRef.current = 0;
  }, [stopHeartbeat]);

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
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    status,
    isConnected: status === 'connected',
    lastFrame,
    frames,
    connect,
    disconnect,
    startStreaming,
    stopStreaming,
    subscribe,
    unsubscribe,
    stats,
  };
}
