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

    const newSocket = io('http://localhost:5000', {
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
