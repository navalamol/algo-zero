import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
  }

  connect() {
    if (this.socket && this.connected) {
      return this.socket;
    }

    this.socket = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10
    });

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket.id);
      this.connected = true;
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
      this.connected = false;
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  subscribe(instruments) {
    if (this.socket && this.connected) {
      this.socket.emit('subscribe', instruments);
    }
  }

  unsubscribe(instruments) {
    if (this.socket && this.connected) {
      this.socket.emit('unsubscribe', instruments);
    }
  }

  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  isConnected() {
    return this.connected;
  }
}

export default new SocketService();
