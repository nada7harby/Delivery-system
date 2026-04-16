import { io } from "socket.io-client";

const transportSocket = io(import.meta.env.VITE_SOCKET_URL, {
  autoConnect: false,
  transports: ["websocket"],
});

const listeners = new Map();

const socket = {
  connect: () => transportSocket.connect(),
  disconnect: () => transportSocket.disconnect(),
  on: (eventName, callback) => {
    if (!listeners.has(eventName)) {
      listeners.set(eventName, new Set());
    }
    listeners.get(eventName).add(callback);
    return socket;
  },
  off: (eventName, callback) => {
    const eventListeners = listeners.get(eventName);
    if (eventListeners) {
      eventListeners.delete(callback);
      if (eventListeners.size === 0) {
        listeners.delete(eventName);
      }
    }
    return socket;
  },
  emit: (eventName, payload) => {
    const eventListeners = listeners.get(eventName);
    if (eventListeners) {
      eventListeners.forEach((callback) => callback(payload));
    }

    transportSocket.emit(eventName, payload);
    return socket;
  },
};

export default socket;
