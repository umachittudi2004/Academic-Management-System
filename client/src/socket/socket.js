import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

class SocketClient {
    constructor() {
        this.socket = null;
        this.listeners = new Map();
    }

    connect(userId) {
        if (this.socket?.connected) {
            console.log('Socket already connected');
            return;
        }

        this.socket = io(SOCKET_URL, {
            withCredentials: true,
            transports: ['websocket', 'polling']
        });

        this.socket.on('connect', () => {
            console.log('🔌 Socket connected:', this.socket.id);
            
            // Join user's room
            if (userId) {
                this.socket.emit('join', userId);
            }
        });

        this.socket.on('disconnect', () => {
            console.log('🔌 Socket disconnected');
        });

        this.socket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
        });
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            console.log('🔌 Socket disconnected manually');
        }
    }

    on(event, callback) {
        if (this.socket) {
            this.socket.on(event, callback);
            
            // Store listener for cleanup
            if (!this.listeners.has(event)) {
                this.listeners.set(event, []);
            }
            this.listeners.get(event).push(callback);
        }
    }

    off(event, callback) {
        if (this.socket) {
            this.socket.off(event, callback);
            
            // Remove from stored listeners
            if (this.listeners.has(event)) {
                const callbacks = this.listeners.get(event);
                const index = callbacks.indexOf(callback);
                if (index > -1) {
                    callbacks.splice(index, 1);
                }
            }
        }
    }

    emit(event, data) {
        if (this.socket) {
            this.socket.emit(event, data);
        }
    }

    removeAllListeners() {
        if (this.socket) {
            this.listeners.forEach((callbacks, event) => {
                callbacks.forEach(callback => {
                    this.socket.off(event, callback);
                });
            });
            this.listeners.clear();
        }
    }
}

export const socketClient = new SocketClient();