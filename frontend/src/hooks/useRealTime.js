import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

export function useRealTime(token) {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!token) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const socketUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '') : 'http://localhost:5000';
    const newSocket = io(socketUrl, {
      auth: { token }
    });

    newSocket.on('connect', () => {
      console.log('RealTime connected:', newSocket.id);
    });

    newSocket.on('disconnect', () => {
      console.log('RealTime disconnected');
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [token]);

  // Helper to subscribe to a specific station
  const subscribeToStation = (stationId) => {
    if (socket) {
      socket.emit('subscribe_station', stationId);
    }
  };

  const unsubscribeFromStation = (stationId) => {
    if (socket) {
      socket.emit('unsubscribe_station', stationId);
    }
  };

  return { socket, subscribeToStation, unsubscribeFromStation };
}
