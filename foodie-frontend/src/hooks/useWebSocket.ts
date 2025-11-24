'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface UseWebSocketOptions {
    url: string;
    onMessage?: (data: any) => void;
    onOpen?: () => void;
    onClose?: () => void;
    onError?: (error: Event) => void;
    reconnectInterval?: number;
    maxReconnectAttempts?: number;
}

interface UseWebSocketReturn {
    sendMessage: (data: any) => void;
    isConnected: boolean;
    reconnect: () => void;
    disconnect: () => void;
}

export function useWebSocket({
    url,
    onMessage,
    onOpen,
    onClose,
    onError,
    reconnectInterval = 3000,
    maxReconnectAttempts = 5,
}: UseWebSocketOptions): UseWebSocketReturn {
    const [isConnected, setIsConnected] = useState(false);
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectAttemptsRef = useRef(0);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const messageQueueRef = useRef<any[]>([]);

    const connect = useCallback(() => {
        try {
            const ws = new WebSocket(url);

            ws.onopen = () => {
                console.log('[WebSocket] Connected');
                setIsConnected(true);
                reconnectAttemptsRef.current = 0;

                // Send queued messages
                while (messageQueueRef.current.length > 0) {
                    const message = messageQueueRef.current.shift();
                    ws.send(JSON.stringify(message));
                }

                if (onOpen) onOpen();
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (onMessage) onMessage(data);
                } catch (error) {
                    console.error('[WebSocket] Failed to parse message:', error);
                }
            };

            ws.onclose = () => {
                console.log('[WebSocket] Disconnected');
                setIsConnected(false);
                wsRef.current = null;

                if (onClose) onClose();

                // Attempt reconnection
                if (reconnectAttemptsRef.current < maxReconnectAttempts) {
                    reconnectAttemptsRef.current += 1;
                    console.log(
                        `[WebSocket] Reconnecting... (${reconnectAttemptsRef.current}/${maxReconnectAttempts})`
                    );

                    reconnectTimeoutRef.current = setTimeout(() => {
                        connect();
                    }, reconnectInterval);
                } else {
                    console.error('[WebSocket] Max reconnection attempts reached');
                }
            };

            ws.onerror = (error) => {
                console.error('[WebSocket] Error:', error);
                if (onError) onError(error);
            };

            wsRef.current = ws;
        } catch (error) {
            console.error('[WebSocket] Connection error:', error);
        }
    }, [url, onMessage, onOpen, onClose, onError, reconnectInterval, maxReconnectAttempts]);

    const sendMessage = useCallback((data: any) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(data));
        } else {
            // Queue message if not connected
            console.log('[WebSocket] Queueing message (not connected)');
            messageQueueRef.current.push(data);
        }
    }, []);

    const disconnect = useCallback(() => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }

        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }

        setIsConnected(false);
    }, []);

    const reconnect = useCallback(() => {
        disconnect();
        reconnectAttemptsRef.current = 0;
        connect();
    }, [connect, disconnect]);

    useEffect(() => {
        connect();

        return () => {
            disconnect();
        };
    }, [connect, disconnect]);

    return {
        sendMessage,
        isConnected,
        reconnect,
        disconnect,
    };
}
