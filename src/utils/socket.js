import { io } from 'socket.io-client';

const socket = io('https://grand-spice-backend.onrender.com', {
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