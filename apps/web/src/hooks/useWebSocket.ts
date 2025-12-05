/// <reference types="vite/client" />
import type { WsMessage, WsEventType } from '@myorg/types';
import { useEffect, useRef, useCallback, useState } from 'react';
import type { Socket } from 'socket.io-client';
import { io } from 'socket.io-client';

const WS_URL = (import.meta.env.VITE_WS_URL as string) || 'http://localhost:3000';

interface UseWebSocketOptions {
  enabled?: boolean;
  token?: string;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const { enabled = true, token, onConnect, onDisconnect } = options;
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const listenersRef = useRef<Map<WsEventType, Set<(msg: WsMessage) => void>>>(new Map());

  useEffect(() => {
    if (!enabled || !token) return;

    const socket = io(WS_URL, {
      auth: { token },
      transports: ['websocket'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      onConnect?.();
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      onDisconnect?.();
    });

    // Setup event forwarding
    const events: WsEventType[] = [
      'task:created',
      'task:updated',
      'task:deleted',
      'user:online',
      'user:offline',
      'presence:join',
      'presence:leave',
    ];

    events.forEach((event) => {
      socket.on(event, (message: WsMessage) => {
        const listeners = listenersRef.current.get(event);
        listeners?.forEach((listener) => listener(message));
      });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [enabled, token, onConnect, onDisconnect]);

  const subscribe = useCallback((event: WsEventType, callback: (msg: WsMessage) => void) => {
    if (!listenersRef.current.has(event)) {
      listenersRef.current.set(event, new Set());
    }
    listenersRef.current.get(event)!.add(callback);

    return () => {
      listenersRef.current.get(event)?.delete(callback);
    };
  }, []);

  const joinRoom = useCallback((room: string) => {
    socketRef.current?.emit('join:room', room);
  }, []);

  const leaveRoom = useCallback((room: string) => {
    socketRef.current?.emit('leave:room', room);
  }, []);

  return {
    isConnected,
    subscribe,
    joinRoom,
    leaveRoom,
  };
}
