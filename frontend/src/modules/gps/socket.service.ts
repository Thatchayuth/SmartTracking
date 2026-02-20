import { io, Socket } from 'socket.io-client';
import { useAuthStore } from 'src/modules/auth/auth.store';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (socket && socket.connected) return socket;

  const authStore = useAuthStore();

  socket = io(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/tracking`, {
    auth: {
      token: authStore.accessToken,
    },
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 2000,
  });

  socket.on('connect', () => {
    console.log('[WS] Connected:', socket?.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('[WS] Disconnected:', reason);
  });

  socket.on('error', (err) => {
    console.error('[WS] Error:', err);
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
