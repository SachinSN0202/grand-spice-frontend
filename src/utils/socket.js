import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

const socket = io(SOCKET_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 10,
  transports: ['websocket', 'polling'],
});

socket.on('connect', () => console.log('🔌 Socket connected:', socket.id));
socket.on('disconnect', () => console.log('❌ Socket disconnected'));
socket.on('connect_error', (err) => console.error('Socket error:', err.message));

export default socket;