import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let socket = null;

/**
 * Initializes or returns the current Socket.IO connection.
 * Sends the latest JWT in the handshake auth callback on every (re)connect.
 * Server assigns rooms securely based on the verified token.
 */
export const initSocket = () => {
  if (socket && socket.connected) {
    return socket;
  }

  if (socket) {
    socket.disconnect();
  }

  socket = io(SOCKET_URL, {
    transports: ['websocket', 'polling'],
    autoConnect: true,
    auth: (cb) => {
      const token = localStorage.getItem('token');
      cb({ token });
    },
  });

  socket.on('connect_error', (err) => {
    // Graceful error logging without leaking credentials
    console.warn('[Socket] Connection refused:', err.message);
  });

  return socket;
};

export const getSocket = () => {
  if (!socket) {
    return initSocket();
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
